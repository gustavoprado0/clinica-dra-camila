'use client';

import { useEffect, useState } from 'react';
import { Loader2, User, Stethoscope, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import type { Appointment, Patient, Procedure } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment: Appointment | null;
  onSaved?: () => void;
}

export function AppointmentEditDialog({
  open,
  onOpenChange,
  appointment,
  onSaved,
}: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [patientId, setPatientId] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (!open || !appointment) return;
    const apt = appointment;

    async function load() {
      setLoading(true);
      try {
        const [p, proc] = await Promise.all([
          api.get<Patient[]>('/api/patients'),
          api.get<Procedure[]>('/api/procedures'),
        ]);
        setPatients(p);
        setProcedures(proc);

        setPatientId(apt.patientId);
        setProcedureId(apt.procedureId);

        const d = new Date(apt.scheduledAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        setDate(`${y}-${m}-${day}`);
        setTime(`${hh}:${mm}`);
      } catch {
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [open, appointment]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appointment) return;
    setError('');
    setSaving(true);

    try {
      const local = new Date(`${date}T${time}:00`);
      await api.put(`/api/appointments/${appointment.id}`, {
        patientId,
        procedureId,
        scheduledAt: local.toISOString(),
      });

      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const patientName = patients.find((p) => p.id === patientId)?.name;
  const procedureName = procedures.find((p) => p.id === procedureId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="text-xl">Editar agendamento</DialogTitle>
          <DialogDescription className="text-sm">
            Atualize os dados desta consulta
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <User className="size-4 text-muted-foreground" />
                Paciente <span className="text-destructive">*</span>
              </Label>
              <Select value={patientId} onValueChange={(v) => setPatientId(v ?? "")}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Escolha um paciente">
                    {patientName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id} label={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Stethoscope className="size-4 text-muted-foreground" />
                Procedimento <span className="text-destructive">*</span>
              </Label>
              <Select value={procedureId} onValueChange={(v) => setProcedureId(v ?? "")}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Escolha um procedimento">
                    {procedureName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {procedures.map((proc) => (
                    <SelectItem
                      key={proc.id}
                      value={proc.id}
                      label={`${proc.name} (${proc.durationMin}min)`}
                    >
                      {proc.name} ({proc.durationMin}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  Data <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="size-4 text-muted-foreground" />
                  Horário <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <DialogFooter className="!pt-4 !-mx-6 !px-6 !mb-0 border-t bg-muted/30 !mt-6">
              <div className="flex gap-2 w-full justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                  className="h-10"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="h-10 min-w-[120px]">
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar alterações'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
