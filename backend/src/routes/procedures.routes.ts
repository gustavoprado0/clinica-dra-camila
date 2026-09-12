import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/auth';

export const proceduresRoutes = Router();

const createSchema = z.object({
  name: z.string().min(2),
  durationMin: z.number().int().positive().default(60),
  price: z.number().nonnegative().default(0),
});

const updateSchema = createSchema.partial();

// LISTAR — público
proceduresRoutes.get('/', async (req, res) => {
  const includeInactive = req.query.all === 'true';

  const list = await prisma.procedure.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: { name: 'asc' },
  });
  res.json(list);
});

// CRIAR — protegido
proceduresRoutes.post('/', requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  try {
    const created = await prisma.procedure.create({ data: parsed.data });
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Já existe um procedimento com esse nome' });
    }
    throw error;
  }
});

// EDITAR — protegido
proceduresRoutes.put('/:id', requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  try {
    const updated = await prisma.procedure.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(updated);
  } catch {
    return res.status(404).json({ error: 'Procedimento não encontrado' });
  }
});

// ATIVAR/DESATIVAR — protegido
proceduresRoutes.patch('/:id/toggle', requireAuth, async (req, res) => {
  try {
    const current = await prisma.procedure.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Procedimento não encontrado' });

    const updated = await prisma.procedure.update({
      where: { id: req.params.id },
      data: { active: !current.active },
    });
    res.json(updated);
  } catch {
    return res.status(404).json({ error: 'Procedimento não encontrado' });
  }
});

// EXCLUIR — protegido
proceduresRoutes.delete('/:id', requireAuth, async (req, res) => {
  try {
    const count = await prisma.appointment.count({
      where: { procedureId: req.params.id },
    });
    if (count > 0) {
      return res.status(409).json({
        error: `Esse procedimento tem ${count} agendamento(s). Desative em vez de excluir.`,
      });
    }

    await prisma.procedure.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    return res.status(404).json({ error: 'Procedimento não encontrado' });
  }
});
