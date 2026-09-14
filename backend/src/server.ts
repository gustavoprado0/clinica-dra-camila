import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { prisma } from './lib/prisma';
import { authRoutes } from './routes/auth.routes';
import { patientsRoutes } from './routes/patients.routes';
import { proceduresRoutes } from './routes/procedures.routes';
import { appointmentsRoutes } from './routes/appointments.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { publicRoutes } from './routes/public.routes';
import { settingsRoutes } from './routes/settings.routes';
import { requireAuth } from './lib/auth';
import { authLimiter, publicLimiter } from './lib/rate-limit';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Confia no proxy do Render/Vercel (necessário pro rate limit pegar o IP certo)
app.set('trust proxy', 1);

// Helmet — headers HTTP de segurança
app.use(
  helmet({
    contentSecurityPolicy: false, // desativado: o frontend é separado (Vercel)
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite imagens/recursos cross-domain
  })
);

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // MVP: aceita tudo
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- Rate limit global (todas as rotas) ----------
app.use('/api', publicLimiter);

// ---------- Healthchecks (sem rate limit rigoroso) ----------
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

// ---------- Público ----------
app.use('/api/public', publicRoutes);
app.use('/api/settings', settingsRoutes);

// ---------- Auth (com rate limit rigoroso) ----------
app.use('/api/auth', authLimiter, authRoutes);

// ---------- Protegidas ----------
app.use('/api/patients', requireAuth, patientsRoutes);
app.use('/api/procedures', proceduresRoutes);
app.use('/api/appointments', requireAuth, appointmentsRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Healthcheck: http://localhost:${PORT}/api/health`);
});
