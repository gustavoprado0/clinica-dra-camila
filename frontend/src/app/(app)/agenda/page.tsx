'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Send,
  XCircle,
  MoreVertical,
  CalendarX,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Appointment, ClinicSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { WeekView } from '@/components/week-view';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppointmentDialog } from '@/components/appointment-dialog';
import { AppointmentEditDialog } from '@/components/appointment-edit-dialog';

const START_HOUR = 8;
const END_HOUR = 19;

type ViewMode = 'day' | 'week';
type ConfirmAction = {
  type: 'cancel' | 'delete';
  appointment: Appointment;
} | null;

export default function AgendaPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDefaultDate, setDialogDefaultDate] = useState<Date | undefined>();

  const [editing, setEditing] = useState<Appointment | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Segunda-feira da semana atual
  // Carrega dias de funcionamento da clínica
  useEffect(() => {
    api
      .get<ClinicSettings>('/api/settings')
      .then((s) => {
        if (s.weekdays) {
          setWeekdays(s.weekdays.split(',').map(Number));
        }
      })
      .catch(() => {
        // mantém fallback (Seg-Sex)
      });
  }, []);

  const weekStart = useMemo(() => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [date]);

  const dateStr = useMemo(() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [date]);

  const weekStartStr = useMemo(() => {
    const y = weekStart.getFullYear();
    const m = String(weekStart.getMonth() + 1).padStart(2, '0');
    const d = String(weekStart.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === 'day') {
        const list = await api.get<Appointment[]>(
          `/api/appointments?date=${dateStr}`
        );
        setAppointments(list);
      } else {
        const res = await api.get<{ appointments: Appointment[] }>(
          `/api/appointments/week?start=${weekStartStr}`
        );
        setWeekAppointments(res.appointments);
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [viewMode, dateStr, weekStartStr, router]);

  useEffect(() => {
    load();
  }, [load]);

  function changeRange(delta: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + (viewMode === 'day' ? delta : delta * 7));
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

  async function handleConfirm(apt: Appointment) {
    setBusyId(apt.id);
    try {
      const res = await api.patch<{ whatsappStatus: string | null }>(
        `/api/appointments/${apt.id}/status`,
        { status: 'CONFIRMED', sendWhatsApp: true }
      );
      toast.success(
        res.whatsappStatus
          ? `WhatsApp enviado para ${apt.patient?.name}`
          : 'Agendamento confirmado'
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setBusyId(null);
    }
  }

  async function handleResend(apt: Appointment) {
    setBusyId(apt.id);
    try {
      await api.post(`/api/appointments/${apt.id}/resend-whatsapp`, {});
      toast.success(`WhatsApp reenviado para ${apt.patient?.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao reenviar');
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    const { type, appointment } = confirmAction;
    setBusyId(appointment.id);

    try {
      if (type === 'cancel') {
        await api.patch(`/api/appointments/${appointment.id}/status`, {
          status: 'CANCELLED',
          sendWhatsApp: false,
        });
        toast.success('Agendamento cancelado');
      } else {
        await api.delete(`/api/appointments/${appointment.id}`);
        toast.success('Agendamento excluído');
      }
      setConfirmAction(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(apt: Appointment) {
    setEditing(apt);
    setEditOpen(true);
  }

  function openNewAt(d: Date, hour: number) {
    const newDate = new Date(d);
    newDate.setHours(hour, 0, 0, 0);
    setDialogDefaultDate(newDate);
    setDialogOpen(true);
  }

  function openNew() {
    setDialogDefaultDate(date);
    setDialogOpen(true);
  }

  async function handleAppointmentMove(apt: Appointment, newDate: Date) {
    setBusyId(apt.id);
    try {
      await api.put(`/api/appointments/${apt.id}`, {
        scheduledAt: newDate.toISOString(),
      });
      const dateLabel = newDate.toLocaleDateString('pt-BR');
      const timeLabel = newDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      toast.success(`Agendamento movido para ${dateLabel} às ${timeLabel}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao mover');
    } finally {
      setBusyId(null);
    }
  }

  const todayFormatted = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const weekFormatted = `${weekStart.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })} — ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'short', year: 'numeric' }
  )}`;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">
            {viewMode === 'day' ? todayFormatted : weekFormatted}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle dia/semana */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                viewMode === 'day'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays className="size-4" />
              <span className="hidden sm:inline">Dia</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                viewMode === 'week'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">Semana</span>
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={goToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => changeRange(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => changeRange(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button onClick={openNew} className="gap-1.5">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Novo agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* MODO DIA */}
      {viewMode === 'day' && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <Skeleton className="h-4 w-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <EmptyState
                icon={CalendarX}
                title="Nenhuma consulta neste dia"
                description="Aproveite! Ou crie um novo agendamento."
                action={
                  <Button size="sm" onClick={openNew} className="mt-2 gap-1.5">
                    <Plus className="size-4" />
                    Novo agendamento
                  </Button>
                }
              />
            ) : (
              hours.map((hour, idx) => {
                const apts = appointmentsAt(hour);
                const hh = String(hour).padStart(2, '0');
                return (
                  <div key={hour}>
                    {idx > 0 && <Separator />}
                    <div className="flex">
                      <div className="w-16 sm:w-20 px-3 sm:px-5 py-3 sm:py-4 text-sm text-muted-foreground border-r bg-muted/20 shrink-0">
                        {hh}:00
                      </div>
                      <div className="flex-1 py-3 px-3 sm:px-4">
                        {apts.length === 0 ? (
                          <div className="text-sm text-muted-foreground/60 italic">
                            Disponível
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {apts.map((apt) => (
                              <div
                                key={apt.id}
                                className="flex items-center justify-between bg-background border rounded-md px-3 py-2 gap-2 sm:gap-3"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {shortName(apt.patient?.name)}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {apt.procedure?.name} ·{' '}
                                    {new Date(apt.scheduledAt).toLocaleTimeString(
                                      'pt-BR',
                                      { hour: '2-digit', minute: '2-digit' }
                                    )}
                                  </p>
                                </div>


                                <div className="flex items-center gap-1">
                                  {apt.status !== 'CONFIRMED' && (
                                    <button
                                      type="button"
                                      onClick={() => handleConfirm(apt)}
                                      disabled={busyId === apt.id}
                                      title="Confirmar e enviar WhatsApp"
                                      className="size-9 inline-flex items-center justify-center rounded-md hover:bg-muted transition disabled:opacity-50"
                                    >
                                      <CheckCircle2 className="size-4 text-emerald-600" />
                                    </button>
                                  )}

                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      className="size-9 inline-flex items-center justify-center rounded-md hover:bg-muted transition disabled:opacity-50 data-[popup-open]:bg-muted"
                                      disabled={busyId === apt.id}
                                    >
                                      <MoreVertical className="size-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                      <DropdownMenuItem onClick={() => openEdit(apt)}>
                                        <Pencil className="size-4" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleResend(apt)}
                                      >
                                        <Send className="size-4" />
                                        Reenviar WhatsApp
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setConfirmAction({
                                            type: 'cancel',
                                            appointment: apt,
                                          })
                                        }
                                        disabled={apt.status === 'CANCELLED'}
                                      >
                                        <XCircle className="size-4" />
                                        Cancelar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setConfirmAction({
                                            type: 'delete',
                                            appointment: apt,
                                          })
                                        }
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="size-4" />
                                        Excluir de vez
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
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
      )}

      {/* MODO SEMANA */}
      {viewMode === 'week' && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Carregando semana...
                </p>
              </div>
            ) : (
              <WeekView
                startDate={weekStart}
                appointments={weekAppointments}
                onSlotClick={openNewAt}
                onAppointmentClick={openEdit}
                onAppointmentMove={handleAppointmentMove}
                weekdays={weekdays}
              />
            )}
          </CardContent>
        </Card>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={dialogDefaultDate}
        onCreated={() => {
          load();
          toast.success('Agendamento criado');
        }}
      />

      <AppointmentEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        appointment={editing}
        onSaved={() => {
          setEditOpen(false);
          toast.success('Agendamento atualizado');
          load();
        }}
      />

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(v) => !v && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'cancel'
                ? 'Cancelar agendamento?'
                : 'Excluir agendamento?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'cancel' ? (
                <>
                  O agendamento de{' '}
                  <strong>{confirmAction.appointment.patient?.name}</strong>{' '}
                  será marcado como cancelado. Fica no histórico.
                </>
              ) : (
                <>
                  O agendamento de{' '}
                  <strong>{confirmAction?.appointment.patient?.name}</strong>{' '}
                  será removido <strong>permanentemente</strong>. Essa ação não
                  pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmAction?.type === 'delete'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {confirmAction?.type === 'cancel'
                ? 'Cancelar agendamento'
                : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


function shortName(full: string | undefined): string {
  if (!full) return '';
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 2) return full;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
