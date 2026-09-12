/**
 * MOCK de envio de WhatsApp.
 * Quando for integrar de verdade, troque o corpo dessa função
 * por uma chamada à API oficial (Meta Cloud API, Z-API, Twilio, etc).
 */
export async function sendWhatsApp(to: string, body: string) {
  console.log('──────────────────────────────────────');
  console.log('WHATSAPP SIMULADO');
  console.log(`Para: ${to}`);
  console.log('Mensagem:');
  console.log(body);
  console.log('──────────────────────────────────────');

  return { status: 'SIMULATED', providerId: `mock_${Date.now()}` };
}

export function buildConfirmationMessage(data: {
  patientName: string;
  procedure: string;
  date: string;
  time: string;
  clinicName?: string;
}) {
  const clinic = data.clinicName ?? 'Clinica Dra. Camila';
  return `${clinic}
Ola, ${data.patientName}!

Sua consulta foi agendada com sucesso.

Procedimento: ${data.procedure}
Data: ${data.date}
Horario: ${data.time}

Caso precise remarcar, entre em contato conosco.`;
}
