import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { prisma } from './lib/prisma';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, message: 'pong' });
});

app.get('/api/health', async (_req, res) => {
  try {
    const [users, procedures, patients, appointments] = await Promise.all([
      prisma.user.count(),
      prisma.procedure.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
    ]);

    res.json({
      ok: true,
      service: 'clinica-dra-camila',
      database: 'connected',
      counts: { users, procedures, patients, appointments },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro no /api/health:', error);
    res.status(500).json({
      ok: false,
      service: 'clinica-dra-camila',
      database: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Healthcheck: http://localhost:${PORT}/api/health`);
});
