import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { buildConfirmationMessage, sendWhatsApp } from '../utils/whatsapp';
import { formatDateBR, formatTimeBR } from '../utils/datetime';

export const appointmentsRoutes = Router();

const createSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  patientWhatsapp: z.string().optional(),
  procedureId: z.string(),
  scheduledAt: z.string(),
  notes: z.string().optional().nullable(),
  sendWhatsApp: z.boolean().optional().default(true),
});

const updateSchema = z.object({
  patientId: z.string().optional(),
  procedureId: z.string().optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional().nullable(),
});

// LISTAR por dia
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

// BUSCAR por ID
appointmentsRoutes.get('/:id', async (req, res) => {
  const apt = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { patient: true, procedure: true, messages: true },
  });
  if (!apt) return res.status(404).json({ error: 'Agendamento não encontrado' });
  res.json(apt);
});

// CRIAR
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

  let whatsappPreview: string | null = null;
  let whatsappStatus: string | null = null;

  if (shouldSend) {
    const dt = new Date(appointment.scheduledAt);
    const dateStr = formatDateBR(dt);
    const timeStr = formatTimeBR(dt);

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

  res.status(201).json({ appointment, whatsappPreview, whatsappStatus });
});

// EDITAR
appointmentsRoutes.put('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  const { scheduledAt, ...rest } = parsed.data;

  try {
    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
      include: { patient: true, procedure: true },
    });
    res.json(updated);
  } catch {
    return res.status(404).json({ error: 'Agendamento não encontrado' });
  }
});

// ATUALIZAR STATUS
appointmentsRoutes.patch('/:id/status', async (req, res) => {
  const schema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE']),
    sendWhatsApp: z.boolean().optional().default(false),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Status inválido' });

  const { status, sendWhatsApp: shouldSend } = parsed.data;

  try {
    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
      include: { patient: true, procedure: true },
    });

    let whatsappPreview: string | null = null;
    let whatsappStatus: string | null = null;

    // Se está confirmando e quer enviar WhatsApp, envia
    if (shouldSend && status === 'CONFIRMED') {
      const dt = new Date(updated.scheduledAt);
      const dateStr = formatDateBR(dt);
      const timeStr = formatTimeBR(dt);

      const body = buildConfirmationMessage({
        patientName: updated.patient.name,
        procedure: updated.procedure.name,
        date: dateStr,
        time: timeStr,
      });

      const result = await sendWhatsApp(updated.patient.whatsapp, body);

      await prisma.message.create({
        data: {
          appointmentId: updated.id,
          to: updated.patient.whatsapp,
          body,
          status: result.status,
        },
      });

      whatsappPreview = body;
      whatsappStatus = result.status;
    }

    res.json({ appointment: updated, whatsappPreview, whatsappStatus });
  } catch {
    return res.status(404).json({ error: 'Agendamento não encontrado' });
  }
});

// REENVIAR WhatsApp (independente do status)
appointmentsRoutes.post('/:id/resend-whatsapp', async (req, res) => {
  try {
    const apt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { patient: true, procedure: true },
    });
    if (!apt) return res.status(404).json({ error: 'Agendamento não encontrado' });

    const dt = new Date(apt.scheduledAt);
    const dateStr = formatDateBR(dt);
    const timeStr = formatTimeBR(dt);

    const body = buildConfirmationMessage({
      patientName: apt.patient.name,
      procedure: apt.procedure.name,
      date: dateStr,
      time: timeStr,
    });

    const result = await sendWhatsApp(apt.patient.whatsapp, body);

    await prisma.message.create({
      data: {
        appointmentId: apt.id,
        to: apt.patient.whatsapp,
        body,
        status: result.status,
      },
    });

    res.json({ ok: true, whatsappPreview: body, whatsappStatus: result.status });
  } catch {
    return res.status(500).json({ error: 'Erro ao reenviar' });
  }
});

// EXCLUIR de vez
appointmentsRoutes.delete('/:id', async (req, res) => {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    return res.status(404).json({ error: 'Agendamento não encontrado' });
  }
});
