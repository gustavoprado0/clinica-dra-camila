'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { api } from '@/lib/api';
import type { Procedure } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Slot {
  time: string;
  available: boolean;
}

interface BookResult {
  ok: boolean;
  appointment: {
    id: string;
    scheduledAt: string;
    patient: { name: string; whatsapp: string };
    procedure: { name: string };
  };
  whatsappPreview: string;
}

type Step = 1 | 2 | 3 | 4;

export default function PublicBookingPage() {
  const [step, setStep] = useState<Step>(1);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BookResult | null>(null);

  useEffect(() => {
    api
      .get<Procedure[]>('/api/public/procedures')
      .then(setProcedures)
      .catch(() => setError('Erro ao carregar procedimentos'));
  }, []);

  useEffect(() => {
    if (step !== 2 || !date) return;
    setSlotsLoading(true);
    api
      .get<{ date: string; slots: Slot[] }>(`/api/public/slots?date=${date}`)
      .then((r) => setSlots(r.slots))
      .catch(() => setError('Erro ao carregar horários'))
      .finally(() => setSlotsLoading(false));
  }, [step, date]);

  async function handleConfirm() {
    if (!selectedProcedure || !selectedTime || !name || !whatsapp) {
      setError('Preencha todos os campos');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const local = new Date(`${date}T${selectedTime}:00`);
      const res = await api.post<BookResult>('/api/public/book', {
        procedureId: selectedProcedure.id,
        scheduledAt: local.toISOString(),
        patientName: name,
        patientWhatsapp: whatsapp,
      });
      setResult(res);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-2">🦷</div>
          <h1 className="text-2xl font-bold">Clínica Dra. Camila</h1>
          <p className="text-sm text-muted-foreground">
            Agende sua consulta em poucos passos
          </p>
        </div>

        <StepIndicator step={step} />

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha o procedimento</CardTitle>
              <CardDescription>Selecione o tipo de atendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {procedures.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProcedure(p);
                    setStep(2);
                  }}
                  className="w-full text-left px-4 py-3 border rounded-lg hover:bg-muted transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.durationMin}min
                    </p>
                  </div>
                  {p.price > 0 && (
                    <span className="text-sm text-muted-foreground">
                      R$ {p.price.toFixed(2)}
                    </span>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha data e horário</CardTitle>
              <CardDescription>
                {selectedProcedure?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSelectedTime('');
                  }}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>

              {slotsLoading ? (
                <p className="text-sm text-muted-foreground">
                  Carregando horários...
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <Button
                      key={s.time}
                      type="button"
                      variant={selectedTime === s.time ? 'default' : 'outline'}
                      disabled={!s.available}
                      onClick={() => setSelectedTime(s.time)}
                      className="text-sm"
                    >
                      {s.time}
                    </Button>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="size-4" />
                  Voltar
                </Button>
                <Button
                  type="button"
                  disabled={!selectedTime}
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Seus dados</CardTitle>
              <CardDescription>
                {selectedProcedure?.name} · {date.split('-').reverse().join('/')} às {selectedTime}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como no documento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={saving}
                >
                  <ChevronLeft className="size-4" />
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? 'Confirmando...' : 'Confirmar agendamento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && result && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="size-16 rounded-full bg-green-100 mx-auto flex items-center justify-center">
                <Check className="size-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Agendamento realizado!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.appointment.patient.name}
                </p>
              </div>

              <div className="text-sm space-y-1 py-4 border-y">
                <p>
                  <strong>{result.appointment.procedure.name}</strong>
                </p>
                <p className="text-muted-foreground">
                  {new Date(result.appointment.scheduledAt).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(result.appointment.scheduledAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="text-xs text-green-600 font-medium">
                ✓ WhatsApp de confirmação enviado
              </div>

              <div className="text-left text-xs bg-muted/50 rounded-md p-3 whitespace-pre-wrap text-muted-foreground">
                {result.whatsappPreview}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = ['Procedimento', 'Data/Hora', 'Dados', 'Pronto'];
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((label, i) => {
        const num = (i + 1) as Step;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`size-7 rounded-full flex items-center justify-center text-xs font-medium transition ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : done
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {done ? <Check className="size-3.5" /> : num}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 h-px ${done ? 'bg-green-500' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
