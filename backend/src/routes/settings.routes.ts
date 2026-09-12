import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const settingsRoutes = Router();

// Retorna as configurações atuais (cria se não existir)
async function getOrCreateSettings() {
  let settings = await prisma.clinicSettings.findFirst();
  if (!settings) {
    settings = await prisma.clinicSettings.create({
      data: {
        openHour: 8,
        closeHour: 19,
        slotMinutes: 60,
        weekdays: '1,2,3,4,5',
      },
    });
  }
  return settings;
}

// GET — públicas (o link de agendamento precisa saber)
settingsRoutes.get('/', async (_req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

// PUT — protegido (só admin altera)
const updateSchema = z.object({
  openHour: z.number().int().min(0).max(23).optional(),
  closeHour: z.number().int().min(1).max(24).optional(),
  slotMinutes: z.number().int().min(15).max(120).optional(),
  weekdays: z.string().regex(/^[0-6](,[0-6])*$/).optional(),
});

settingsRoutes.put('/', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
  }

  const current = await getOrCreateSettings();

  if (
    parsed.data.openHour !== undefined &&
    parsed.data.closeHour !== undefined &&
    parsed.data.openHour >= parsed.data.closeHour
  ) {
    return res.status(400).json({ error: 'Horário de abertura deve ser antes do fechamento' });
  }

  const updated = await prisma.clinicSettings.update({
    where: { id: current.id },
    data: parsed.data,
  });

  res.json(updated);
});
