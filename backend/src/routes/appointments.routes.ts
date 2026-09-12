import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { buildConfirmationMessage, sendWhatsApp } from '../utils/whatsapp';

export const appointmentsRoutes = Router();

// Schema flexível: aceita patientId existente OU patientName+patientWhatsapp (novo)
const createSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  patientWhatsapp: z.string().optional(),
  procedureId: z.string(),
  scheduledAt: z.string(),
  notes: z.string().optional().nullable(),
  sendWhatsApp: z.boolean().optional().default(true),
});

// LISTAR agendamentos de um dia (?date=YYYY-MM-DD). Se sem data, usa hoje.
appointmentsRoutes.get('/', async (req, res) => {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59.999`);

  const list = await prisma.appointment.findMany({
    where: { scheduledAt: { gte: start, lte: end } },
    include: { patient: true, procedure: true },
    orderBy: { scheduledAt: 'asc' },
  });
  res.json(list);
});

// CRIAR agendamento
appointmentsRoutes.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  const {
    patientId,
    patientName,
    patientWhatsapp,
    procedureId,
    scheduledAt,
    notes,
    sendWhatsApp: shouldSend,
  } = parsed.data;

  // Resolve paciente: usa existente ou cria novo
  let finalPatientId = patientId;
  if (!finalPatientId) {
    if (!patientName || !patientWhatsapp) {
      return res.status(400).json({
        error: 'Informe patientId OU patientName + patientWhatsapp',
      });
    }
    const patient = await prisma.patient.create({
      data: { name: patientName, whatsapp: patientWhatsapp },
    });
    finalPatientId = patient.id;
  }

  const procedure = await prisma.procedure.findUnique({ where: { id: procedureId } });
  if (!procedure) return res.status(404).json({ error: 'Procedimento não encontrado' });

  const appointment = await prisma.appointment.create({
    data: {
      patientId: finalPatientId,
      procedureId,
      scheduledAt: new Date(scheduledAt),
      notes: notes ?? null,
      status: 'CONFIRMED',
    },
    include: { patient: true, procedure: true },
  });

  // WhatsApp mock
  let whatsappPreview: string | null = null;
  let whatsappStatus: string | null = null;

  if (shouldSend) {
    const dt = new Date(appointment.scheduledAt);
    const dateStr = dt.toLocaleDateString('pt-BR');
    const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const body = buildConfirmationMessage({
      patientName: appointment.patient.name,
      procedure: appointment.procedure.name,
      date: dateStr,
      time: timeStr,
    });

    const result = await sendWhatsApp(appointment.patient.whatsapp, body);

    await prisma.message.create({
      data: {
        appointmentId: appointment.id,
        to: appointment.patient.whatsapp,
        body,
        status: result.status,
      },
    });

    whatsappPreview = body;
    whatsappStatus = result.status;
  }

  res.status(201).json({
    appointment,
    whatsappPreview,
    whatsappStatus,
  });
});

// ATUALIZAR STATUS
appointmentsRoutes.patch('/:id/status', async (req, res) => {
  const schema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE']),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });
    res.json(updated);
  } catch {
    return res.status(404).json({ error: 'Agendamento não encontrado' });
  }
});
