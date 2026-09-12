import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const patientsRoutes = Router();

const createSchema = z.object({
  name: z.string().min(2),
  whatsapp: z.string().min(8),
  cpf: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial();

// LISTAR (com busca opcional via ?q=)
patientsRoutes.get('/', async (req, res) => {
  const q = (req.query.q as string) || '';

  const patients = await prisma.patient.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { whatsapp: { contains: q } },
          ],
        }
      : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json(patients);
});

// CRIAR
patientsRoutes.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  const { birthDate, cpf, ...rest } = parsed.data;

  try {
    const patient = await prisma.patient.create({
      data: {
        ...rest,
        cpf: cpf || null,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });
    res.status(201).json(patient);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'CPF já cadastrado' });
    }
    throw error;
  }
});

// BUSCAR POR ID (com histórico de agendamentos)
patientsRoutes.get('/:id', async (req, res) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: {
      appointments: {
        include: { procedure: true },
        orderBy: { scheduledAt: 'desc' },
      },
    },
  });

  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' });
  res.json(patient);
});

// ATUALIZAR
patientsRoutes.put('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  const { birthDate, ...rest } = parsed.data;

  try {
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        birthDate: birthDate ? new Date(birthDate) : undefined,
      },
    });
    res.json(patient);
  } catch {
    return res.status(404).json({ error: 'Paciente não encontrado' });
  }
});

// DELETAR
patientsRoutes.delete('/:id', async (req, res) => {
  try {
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    return res.status(404).json({ error: 'Paciente não encontrado' });
  }
});
