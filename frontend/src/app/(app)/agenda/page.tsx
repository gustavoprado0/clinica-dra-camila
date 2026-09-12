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
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

type ConfirmAction = {
  type: 'cancel' | 'delete';
  appointment: Appointment;
} | null;

export default function AgendaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editing, setEditing] = useState<Appointment | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

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

  async function handleConfirm(apt: Appointment) {
    setBusyId(apt.id);
    try {
      const res = await api.patch<{ whatsappStatus: string | null }>(
        `/api/appointments/${apt.id}/status`,
        { status: 'CONFIRMED', sendWhatsApp: true }
      );
      setToast(
        res.whatsappStatus
          ? `WhatsApp enviado para ${apt.patient?.name}`
          : 'Agendamento confirmado'
      );
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erro');
    } finally {
      setBusyId(null);
    }
  }

  async function handleResend(apt: Appointment) {
    setBusyId(apt.id);
    try {
      await api.post(`/api/appointments/${apt.id}/resend-whatsapp`, {});
      setToast(`WhatsApp reenviado para ${apt.patient?.name}`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erro ao reenviar');
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
        setToast('Agendamento cancelado');
      } else {
        await api.delete(`/api/appointments/${appointment.id}`);
        setToast('Agendamento excluído');
      }
      setConfirmAction(null);
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erro');
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(apt: Appointment) {
    setEditing(apt);
    setEditOpen(true);
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

      {toast && (
        <div className="text-sm bg-green-50 border border-green-200 text-green-800 rounded-md px-4 py-2.5">
          {toast}
        </div>
      )}

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
                              className="flex items-center justify-between bg-background border rounded-md px-3 py-2 gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
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

                              <div className="flex items-center gap-1">
                                {apt.status !== 'CONFIRMED' && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirm(apt)}
                                    disabled={busyId === apt.id}
                                    title="Confirmar e enviar WhatsApp"
                                    className="size-9 inline-flex items-center justify-center rounded-md hover:bg-muted transition disabled:opacity-50"
                                  >
                                    <CheckCircle2 className="size-4 text-green-600" />
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
                                        setConfirmAction({ type: 'cancel', appointment: apt })
                                      }
                                      disabled={apt.status === 'CANCELLED'}
                                    >
                                      <XCircle className="size-4" />
                                      Cancelar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setConfirmAction({ type: 'delete', appointment: apt })
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

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={date}
        onCreated={load}
      />

      <AppointmentEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        appointment={editing}
        onSaved={() => {
          setEditOpen(false);
          setToast('Agendamento atualizado');
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
                  O agendamento de <strong>{confirmAction.appointment.patient?.name}</strong>{' '}
                  será marcado como cancelado. Fica no histórico.
                </>
              ) : (
                <>
                  O agendamento de <strong>{confirmAction?.appointment.patient?.name}</strong>{' '}
                  será removido <strong>permanentemente</strong>. Essa ação não pode ser desfeita.
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
              {confirmAction?.type === 'cancel' ? 'Cancelar agendamento' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
