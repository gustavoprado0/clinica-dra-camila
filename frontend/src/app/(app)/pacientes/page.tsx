'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Patient, Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PatientDialog } from '@/components/patient-dialog';

interface PatientWithHistory extends Patient {
  appointments?: Appointment[];
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const [historyPatient, setHistoryPatient] = useState<PatientWithHistory | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = query
        ? `/api/patients?q=${encodeURIComponent(query)}`
        : '/api/patients';
      const list = await api.get<Patient[]>(url);
      setPatients(list);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [query, router]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(p: Patient) {
    setEditing(p);
    setDialogOpen(true);
  }

  async function openHistory(p: Patient) {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryPatient(p);
    try {
      const data = await api.get<PatientWithHistory>(`/api/patients/${p.id}`);
      setHistoryPatient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    setError('');
    try {
      await api.delete(`/api/patients/${deleting.id}`);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
      setDeleting(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os pacientes da clínica
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Novo paciente
        </Button>
      </div>

      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou WhatsApp..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Carregando pacientes...
            </div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {query
                ? 'Nenhum paciente encontrado para essa busca.'
                : 'Nenhum paciente cadastrado ainda.'}
            </div>
          ) : (
            patients.map((p, i) => (
              <div key={p.id}>
                {i > 0 && <Separator />}
                <div className="px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition">
                  <button
                    type="button"
                    onClick={() => openHistory(p)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                      {p.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.whatsapp}
                      </p>
                    </div>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="size-9 inline-flex items-center justify-center rounded-md hover:bg-muted transition disabled:opacity-50"
                      disabled={busyId === p.id}
                    >
                      <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => openEdit(p)}>
                        <Pencil className="size-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openHistory(p)}>
                        <CalendarIcon className="size-4" />
                        Ver histórico
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleting(p)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <PatientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={load}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleting?.name}</strong>?
              Todos os agendamentos desse paciente também serão removidos.
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden max-h-[80vh] flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30 shrink-0">
            <DialogTitle className="text-xl">
              Histórico de {historyPatient?.name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {historyPatient?.whatsapp}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1">
            {historyLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Carregando...
              </div>
            ) : !historyPatient?.appointments ||
              historyPatient.appointments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhum agendamento registrado.
              </div>
            ) : (
              <div>
                {historyPatient.appointments.map((apt, i) => (
                  <div key={apt.id}>
                    {i > 0 && <Separator />}
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {apt.procedure?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(apt.scheduledAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}{' '}
                          às{' '}
                          {new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
