import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const proceduresRoutes = Router();

const createSchema = z.object({
  name: z.string().min(2),
  durationMin: z.number().int().positive().default(60),
  price: z.number().nonnegative().default(0),
});

// LISTAR — público (usado pelo link de agendamento)
proceduresRoutes.get('/', async (_req, res) => {
  const list = await prisma.procedure.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
  res.json(list);
});

// CRIAR — protegido
proceduresRoutes.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  try {
    const created = await prisma.procedure.create({ data: parsed.data });
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Procedimento já existe' });
    }
    throw error;
  }
});
