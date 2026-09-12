import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import 'dotenv/config';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'clinica-dra-camila',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🦷 Servidor rodando em http://localhost:${PORT}`);
});
