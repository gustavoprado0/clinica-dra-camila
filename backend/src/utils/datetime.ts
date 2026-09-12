// Timezone oficial da clínica: São Paulo (UTC-3)
const TIMEZONE = 'America/Sao_Paulo';

export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', { timeZone: TIMEZONE });
}

export function formatTimeBR(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}
