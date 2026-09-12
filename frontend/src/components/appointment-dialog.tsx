'use client';

import { useEffect, useState } from 'react';
import { User, Stethoscope, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
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
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [patientId, setPatientId] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (!open) return;

    async function load() {
      setLoadingData(true);
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
      } finally {
        setLoadingData(false);
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

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!patientId || !procedureId || !date || !time) {
      setError('Preencha todos os campos obrigatórios');
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

      handleClose(false);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const patientName = patients.find((p) => p.id === patientId)?.name;
  const procedureName = procedures.find((p) => p.id === procedureId)?.name;
  const procedureInfo = procedures.find((p) => p.id === procedureId);
  const canSubmit = !!(patientId && procedureId && date && time && !saving);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="text-xl">Novo agendamento</DialogTitle>
          <DialogDescription className="text-sm">
            Agende uma consulta para um paciente
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Paciente */}
            <div className="space-y-2">
              <Label htmlFor="patient" className="flex items-center gap-2 text-sm font-medium">
                <User className="size-4 text-muted-foreground" />
                Paciente <span className="text-destructive">*</span>
              </Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger id="patient" className="w-full h-11">
                  <SelectValue placeholder="Escolha um paciente">
                    {patientName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {patients.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                      Nenhum paciente cadastrado ainda
                    </div>
                  ) : (
                    patients.map((p) => (
                      <SelectItem key={p.id} value={p.id} label={p.name}>
                        <div className="flex flex-col">
                          <span>{p.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {p.whatsapp}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Procedimento */}
            <div className="space-y-2">
              <Label htmlFor="procedure" className="flex items-center gap-2 text-sm font-medium">
                <Stethoscope className="size-4 text-muted-foreground" />
                Procedimento <span className="text-destructive">*</span>
              </Label>
              <Select value={procedureId} onValueChange={setProcedureId}>
                <SelectTrigger id="procedure" className="w-full h-11">
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
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span>{proc.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {proc.durationMin}min
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {procedureInfo && (
                <p className="text-xs text-muted-foreground flex items-center gap-3 pl-1">
                  <span>Duração: {procedureInfo.durationMin}min</span>
                  {procedureInfo.price > 0 && (
                    <span>Valor: R$ {procedureInfo.price.toFixed(2)}</span>
                  )}
                </p>
              )}
            </div>

            {/* Data e Hora */}
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
                  onClick={() => handleClose(false)}
                  disabled={saving}
                  className="h-10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-10 min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Confirmar'
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
