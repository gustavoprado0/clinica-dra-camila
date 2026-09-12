import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { buildConfirmationMessage, sendWhatsApp } from '../utils/whatsapp';

export const publicRoutes = Router();

// Lista de procedimentos disponíveis (público)
publicRoutes.get('/procedures', async (_req, res) => {
  const list = await prisma.procedure.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
  res.json(list);
});

// Slots livres de um dia (?date=YYYY-MM-DD)
publicRoutes.get('/slots', async (req, res) => {
  const date = req.query.date as string;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Data inválida (use YYYY-MM-DD)' });
  }

  const START_HOUR = 8;
  const END_HOUR = 19;

  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59.999`);

  const busy = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: start, lte: end },
      status: { not: 'CANCELLED' },
    },
    select: { scheduledAt: true },
  });

  const busyHours = new Set(busy.map((b) => new Date(b.scheduledAt).getHours()));

  const slots: { time: string; available: boolean }[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    const hh = String(h).padStart(2, '0');
    slots.push({
      time: `${hh}:00`,
      available: !busyHours.has(h),
    });
  }

  res.json({ date, slots });
});

// Criar agendamento pela página pública
const bookSchema = z.object({
  procedureId: z.string(),
  scheduledAt: z.string(),
  patientName: z.string().min(2),
  patientWhatsapp: z.string().min(8),
});

publicRoutes.post('/book', async (req, res) => {
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  const { procedureId, scheduledAt, patientName, patientWhatsapp } = parsed.data;

  const procedure = await prisma.procedure.findUnique({ where: { id: procedureId } });
  if (!procedure) return res.status(404).json({ error: 'Procedimento não encontrado' });

  // Verifica se o horário está livre
  const dt = new Date(scheduledAt);
  const hourStart = new Date(dt);
  hourStart.setMinutes(0, 0, 0);
  const hourEnd = new Date(hourStart);
  hourEnd.setHours(hourEnd.getHours() + 1);

  const conflict = await prisma.appointment.findFirst({
    where: {
      scheduledAt: { gte: hourStart, lt: hourEnd },
      status: { not: 'CANCELLED' },
    },
  });

  if (conflict) {
    return res.status(409).json({ error: 'Horário já ocupado. Escolha outro.' });
  }

  // Reaproveita paciente existente pelo WhatsApp ou cria novo
  let patient = await prisma.patient.findFirst({
    where: { whatsapp: patientWhatsapp },
  });

  if (!patient) {
    patient = await prisma.patient.create({
      data: { name: patientName, whatsapp: patientWhatsapp },
    });
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      procedureId,
      scheduledAt: dt,
      status: 'CONFIRMED',
    },
    include: { patient: true, procedure: true },
  });

  // WhatsApp mock
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

  res.status(201).json({
    ok: true,
    appointment,
    whatsappPreview: body,
    whatsappStatus: result.status,
  });
});
