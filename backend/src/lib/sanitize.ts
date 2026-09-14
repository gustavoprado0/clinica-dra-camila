/**
 * Remove caracteres perigosos de strings (evita XSS básico).
 * NÃO usa lib pesada — só remove < > e limita tamanho.
 */
export function sanitizeText(input: string, maxLength = 500): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, maxLength);
}

/**
 * Normaliza WhatsApp pra formato consistente.
 * Aceita: "(11) 99999-9999", "11999999999", "+55 11 99999-9999"
 * Retorna: "(11) 99999-9999" ou string vazia se inválido.
 */
export function normalizeWhatsapp(input: string): string {
  const digits = input.replace(/\D/g, '');

  // Remove DDI (55) se presente e sobrarem 10-11 dígitos
  let local = digits;
  if (digits.length === 13 && digits.startsWith('55')) {
    local = digits.slice(2);
  } else if (digits.length === 12 && digits.startsWith('55')) {
    local = digits.slice(2);
  }

  // Formatos válidos: 10 dígitos (fixo) ou 11 (celular)
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }

  return '';
}

/**
 * Normaliza CPF pra formato "999.999.999-99".
 * Retorna null se não tiver 11 dígitos.
 */
export function normalizeCpf(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 11) return null;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
