'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppointmentDialog } from '@/components/appointment-dialog';

const START_HOUR = 8;
const END_HOUR = 19;

export default function AgendaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  const dateStr = useMemo(() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [date]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<Appointment[]>(
        `/api/appointments?date=${dateStr}`
      );
      setAppointments(list);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [dateStr, router]);

  useEffect(() => {
    load();
  }, [load]);

  function changeDay(delta: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    setDate(next);
  }

  function goToday() {
    setDate(new Date());
  }

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) list.push(h);
    return list;
  }, []);

  function appointmentsAt(hour: number) {
    return appointments.filter((apt) => {
      const d = new Date(apt.scheduledAt);
      return d.getHours() === hour;
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {date.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => changeDay(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => changeDay(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Novo agendamento
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Carregando agenda...
            </div>
          ) : (
            hours.map((hour, idx) => {
              const apts = appointmentsAt(hour);
              const hh = String(hour).padStart(2, '0');
              return (
                <div key={hour}>
                  {idx > 0 && <Separator />}
                  <div className="flex">
                    <div className="w-20 px-5 py-4 text-sm text-muted-foreground border-r bg-muted/20">
                      {hh}:00
                    </div>
                    <div className="flex-1 py-3 px-4">
                      {apts.length === 0 ? (
                        <div className="text-sm text-muted-foreground/60 italic">
                          Disponível
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {apts.map((apt) => (
                            <div
                              key={apt.id}
                              className="flex items-center justify-between bg-background border rounded-md px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {apt.patient?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {apt.procedure?.name} ·{' '}
                                  {new Date(apt.scheduledAt).toLocaleTimeString(
                                    'pt-BR',
                                    { hour: '2-digit', minute: '2-digit' }
                                  )}
                                </p>
                              </div>
                              <StatusBadge status={apt.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={date}
        onCreated={load}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pendente', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
    CONFIRMED: { label: 'Confirmada', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
    CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    DONE: { label: 'Concluída', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  };
  const info =
    map[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return <Badge className={info.className}>{info.label}</Badge>;
}
