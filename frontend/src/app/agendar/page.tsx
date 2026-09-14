'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Procedure } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/phone-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfettiOnMount } from '@/components/confetti';

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
  const [closed, setClosed] = useState(false);
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
    setClosed(false);
    api
      .get<{ date: string; closed: boolean; slots: Slot[] }>(
        `/api/public/slots?date=${date}`
      )
      .then((r) => {
        setSlots(r.slots);
        setClosed(r.closed);
      })
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 sm:py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-16 sm:size-20 rounded-full bg-white shadow-sm border mb-4">
            <span className="text-3xl sm:text-4xl">🦷</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Clínica Dra. Camila
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Agende sua consulta em poucos passos
          </p>
        </div>

        {/* Stepper */}
        <StepIndicator step={step} />

        {/* STEP 1 — Procedimento */}
        {step === 1 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Escolha o procedimento</CardTitle>
              <CardDescription>
                Selecione o tipo de atendimento que você precisa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {procedures.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Carregando procedimentos...
                </p>
              ) : (
                procedures.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProcedure(p);
                      setStep(2);
                    }}
                    className="w-full text-left px-4 py-3.5 border-2 border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99] transition flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground group-hover:text-primary transition">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.durationMin} minutos
                      </p>
                    </div>
                    {p.price > 0 && (
                      <span className="text-sm font-medium text-muted-foreground shrink-0">
                        R$ {p.price.toFixed(2)}
                      </span>
                    )}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2 — Data e horário */}
        {step === 2 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Escolha data e horário</CardTitle>
              <CardDescription>
                <Badge variant="secondary" className="font-normal">
                  {selectedProcedure?.name}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  Data
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSelectedTime('');
                  }}
                  min={new Date().toISOString().slice(0, 10)}
                  className="h-11 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  Horário disponível
                </Label>

                {slotsLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="h-11 rounded-lg bg-muted animate-pulse"
                      />
                    ))}
                  </div>
                ) : closed ? (
                  <div className="text-sm text-center text-muted-foreground py-6 bg-muted/40 rounded-lg">
                    A clínica não atende neste dia. Escolha outra data.
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-sm text-center text-muted-foreground py-6 bg-muted/40 rounded-lg">
                    Nenhum horário disponível neste dia.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelectedTime(s.time)}
                        className={`h-11 rounded-lg text-sm font-medium border-2 transition ${
                          selectedTime === s.time
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : s.available
                            ? 'bg-background border-border hover:border-primary/40 hover:bg-primary/5 text-foreground'
                            : 'bg-muted/50 text-muted-foreground/40 border-transparent line-through cursor-not-allowed'
                        }`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
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
                  onClick={() => setStep(1)}
                  className="h-11"
                >
                  <ChevronLeft className="size-4" />
                  Voltar
                </Button>
                <Button
                  type="button"
                  disabled={!selectedTime}
                  onClick={() => setStep(3)}
                  className="flex-1 h-11"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3 — Dados */}
        {step === 3 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Seus dados</CardTitle>
              <CardDescription className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="font-normal">
                  {selectedProcedure?.name}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {selectedTime}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-muted-foreground" />
                  Nome completo
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como no documento"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  WhatsApp
                </Label>
                <PhoneInput
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(v) => setWhatsapp(v)}
                  placeholder="(11) 99999-9999"
                  className="h-11"
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
                  className="h-11"
                >
                  <ChevronLeft className="size-4" />
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1 h-11"
                >
                  {saving ? 'Confirmando...' : 'Confirmar agendamento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4 — Sucesso */}
        {step === 4 && result && (
          <>
            <ConfettiOnMount />
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="pt-8 pb-8 text-center space-y-5">
                <div className="relative mx-auto size-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                  <Check className="relative size-10 text-emerald-600" strokeWidth={3} />
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Agendamento realizado!
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enviamos uma confirmação no seu WhatsApp
                  </p>
                </div>

                <div className="py-4 border-y space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <p className="font-semibold text-foreground">
                      {result.appointment.procedure.name}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(result.appointment.scheduledAt).toLocaleDateString(
                      'pt-BR',
                      {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      }
                    )}{' '}
                    às{' '}
                    {new Date(result.appointment.scheduledAt).toLocaleTimeString(
                      'pt-BR',
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <Check className="size-3.5" />
                  WhatsApp enviado para {result.appointment.patient.whatsapp}
                </div>

                <div className="text-left text-xs bg-muted/50 rounded-lg p-3.5 whitespace-pre-wrap text-muted-foreground border">
                  {result.whatsappPreview}
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Até lá! 💙
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          Em caso de dúvidas, entre em contato com a clínica
        </p>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = ['Procedimento', 'Data', 'Dados', 'Pronto'];
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {steps.map((label, i) => {
        const num = (i + 1) as Step;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                active
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/15'
                  : done
                  ? 'bg-emerald-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : num}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-6 sm:w-10 h-0.5 rounded-full transition ${
                  done ? 'bg-emerald-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
