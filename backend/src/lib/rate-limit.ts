import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para rotas de autenticação.
 * Limite: 5 tentativas por 15 minutos por IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    error: 'Muitas tentativas. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Não conta tentativas bem-sucedidas
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter geral para APIs públicas.
 * Limite: 100 requests por minuto por IP.
 */
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: {
    error: 'Muitas requisições. Aguarde um instante.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para criação de recursos (agendamentos, pacientes).
 * Limite: 20 criações por hora por IP.
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: {
    error: 'Muitas criações em pouco tempo. Aguarde um pouco.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
