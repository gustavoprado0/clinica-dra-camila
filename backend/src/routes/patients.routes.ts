import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { normalizeCpf, normalizeWhatsapp, sanitizeText } from '../lib/sanitize';

export const patientsRoutes = Router();

const baseSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(120),
  whatsapp: z.string().min(8, 'WhatsApp inválido'),
  cpf: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const createSchema = baseSchema;
const updateSchema = baseSchema.partial();

// Helper pra processar os dados
function processInput(data: z.infer<typeof baseSchema>) {
  const sanitized = {
    name: sanitizeText(data.name, 120),
    whatsapp: normalizeWhatsapp(data.whatsapp),
    cpf: data.cpf ? normalizeCpf(data.cpf) : null,
    notes: data.notes ? sanitizeText(data.notes, 500) : null,
  };
  return sanitized;
}

// LISTAR (com busca)
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
    return res.status(400).json({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    });
  }

  const data = processInput(parsed.data);

  if (!data.whatsapp) {
    return res.status(400).json({
      error: 'WhatsApp inválido. Use o formato (11) 99999-9999.',
    });
  }

  const { birthDate } = parsed.data;

  try {
    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        whatsapp: data.whatsapp,
        cpf: data.cpf,
        notes: data.notes,
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

// BUSCAR POR ID
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
    return res.status(400).json({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    });
  }

  const { birthDate, name, whatsapp, cpf, notes } = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = sanitizeText(name, 120);
  if (whatsapp !== undefined) {
    const normalized = normalizeWhatsapp(whatsapp);
    if (!normalized) {
      return res.status(400).json({
        error: 'WhatsApp inválido. Use o formato (11) 99999-9999.',
      });
    }
    updateData.whatsapp = normalized;
  }
  if (cpf !== undefined) updateData.cpf = cpf ? normalizeCpf(cpf) : null;
  if (notes !== undefined)
    updateData.notes = notes ? sanitizeText(notes, 500) : null;
  if (birthDate !== undefined)
    updateData.birthDate = birthDate ? new Date(birthDate) : null;

  try {
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: updateData,
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
