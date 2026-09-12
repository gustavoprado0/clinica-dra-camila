import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const dashboardRoutes = Router();

dashboardRoutes.get('/summary', async (_req, res) => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  const [totalToday, confirmed, pending, todayList] = await Promise.all([
    prisma.appointment.count({ where: { scheduledAt: { gte: start, lte: end } } }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: start, lte: end }, status: 'CONFIRMED' },
    }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: start, lte: end }, status: 'PENDING' },
    }),
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: start, lte: end } },
      include: { patient: true, procedure: true },
      orderBy: { scheduledAt: 'asc' },
    }),
  ]);

  res.json({
    stats: { totalToday, confirmed, pending },
    today: todayList,
  });
});
