'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Patient, Procedure } from '@/lib/types';
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
  defaultDate?: Date;
  onCreated?: () => void;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  defaultDate,
  onCreated,
}: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [patientId, setPatientId] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (!open) return;
    async function load() {
      try {
        const [p, proc] = await Promise.all([
          api.get<Patient[]>('/api/patients'),
          api.get<Procedure[]>('/api/procedures'),
        ]);
        setPatients(p);
        setProcedures(proc);

        const d = defaultDate ?? new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDate(`${y}-${m}-${day}`);
      } catch {
        setError('Erro ao carregar dados');
      }
    }
    load();
  }, [open, defaultDate]);

  function reset() {
    setPatientId('');
    setProcedureId('');
    setTime('09:00');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!patientId || !procedureId || !date || !time) {
      setError('Preencha todos os campos');
      return;
    }

    setSaving(true);
    try {
      const local = new Date(`${date}T${time}:00`);
      await api.post('/api/appointments', {
        patientId,
        procedureId,
        scheduledAt: local.toISOString(),
      });

      onOpenChange(false);
      reset();
      onCreated?.();
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>
            Agende uma consulta para um paciente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente">
                  {patientName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {patients.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhum paciente cadastrado
                  </div>
                ) : (
                  patients.map((p) => (
                    <SelectItem key={p.id} value={p.id} label={p.name}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Procedimento *</Label>
            <Select value={procedureId} onValueChange={setProcedureId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o procedimento">
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
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
