import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const notificationsRoutes = Router();

/**
 * Retorna as próximas consultas de HOJE (a partir de agora).
 * Usado pelo sino do header.
 */
notificationsRoutes.get('/', async (_req, res) => {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const upcoming = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: now, lte: endOfDay },
      status: { notIn: ['CANCELLED', 'DONE'] },
    },
    include: { patient: true, procedure: true },
    orderBy: { scheduledAt: 'asc' },
    take: 10,
  });

  res.json({
    count: upcoming.length,
    upcoming: upcoming.map((apt) => ({
      id: apt.id,
      scheduledAt: apt.scheduledAt,
      patientName: apt.patient?.name ?? '—',
      procedureName: apt.procedure?.name ?? '—',
      status: apt.status,
    })),
  });
});
