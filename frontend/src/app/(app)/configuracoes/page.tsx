'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Clock, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ClinicSettings {
  id: string;
  openHour: number;
  closeHour: number;
  slotMinutes: number;
  weekdays: string;
  updatedAt: string;
}

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_OPTIONS = [15, 30, 45, 60, 90, 120];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [openHour, setOpenHour] = useState(8);
  const [closeHour, setCloseHour] = useState(19);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    async function load() {
      try {
        const s = await api.get<ClinicSettings>('/api/settings');
        setOpenHour(s.openHour);
        setCloseHour(s.closeHour);
        setSlotMinutes(s.slotMinutes);
        setWeekdays(s.weekdays.split(',').map(Number));
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => a - b)
    );
  }

  async function handleSave() {
    if (weekdays.length === 0) {
      toast.error('Escolha pelo menos um dia de funcionamento');
      return;
    }
    if (openHour >= closeHour) {
      toast.error('Horário de abertura deve ser antes do fechamento');
      return;
    }

    setSaving(true);
    try {
      await api.put('/api/settings', {
        openHour,
        closeHour,
        slotMinutes,
        weekdays: weekdays.join(','),
      });
      toast.success('Configurações salvas com sucesso');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-10 w-16 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
            </div>
            <Skeleton className="h-11" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Defina os horários e dias de funcionamento da clínica
        </p>
      </div>

      {/* Dias de funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="size-5 text-muted-foreground" />
            Dias de funcionamento
          </CardTitle>
          <CardDescription>
            Selecione os dias em que a clínica atende. Dias não marcados ficam
            indisponíveis pra agendamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_OPTIONS.map((opt) => {
              const active = weekdays.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleWeekday(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Horários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="size-5 text-muted-foreground" />
            Horários
          </CardTitle>
          <CardDescription>
            Defina o horário de abertura, fechamento e o intervalo entre
            consultas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Abre às</Label>
              <Select
                value={String(openHour)}
                onValueChange={(v) => setOpenHour(Number(v))}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {String(h).padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha às</Label>
              <Select
                value={String(closeHour)}
                onValueChange={(v) => setCloseHour(Number(v))}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.filter((h) => h > 0).map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {String(h).padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duração do slot</Label>
            <Select
              value={String(slotMinutes)}
              onValueChange={(v) => setSlotMinutes(Number(v))}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLOT_OPTIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} minutos
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Tempo mínimo entre cada consulta disponível para agendamento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ação */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[160px] h-11 gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Salvar configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
