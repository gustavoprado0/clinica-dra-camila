'use client';

import { useEffect, useState } from 'react';
import { Loader2, User, Phone, CreditCard, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import type { Patient } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/phone-input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Patient | null;
  onSaved?: () => void;
}

const EMPTY = { name: '', whatsapp: '', cpf: '', birthDate: '', notes: '' };

export function PatientDialog({ open, onOpenChange, editing, onSaved }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        whatsapp: editing.whatsapp,
        cpf: editing.cpf ?? '',
        birthDate: editing.birthDate
          ? new Date(editing.birthDate).toISOString().slice(0, 10)
          : '',
        notes: editing.notes ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setError('');
  }, [open, editing]);

  function handleClose(v: boolean) {
    if (!v) setError('');
    onOpenChange(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.whatsapp.trim()) {
      setError('Nome e WhatsApp são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        whatsapp: form.whatsapp,
        cpf: form.cpf || null,
        birthDate: form.birthDate || null,
        notes: form.notes || null,
      };

      if (editing) {
        await api.put(`/api/patients/${editing.id}`, payload);
      } else {
        await api.post('/api/patients', payload);
      }
      handleClose(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const isEditing = !!editing;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar paciente' : 'Novo paciente'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? 'Atualize os dados do paciente'
              : 'Cadastre um novo paciente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
              <User className="size-4 text-muted-foreground" />
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="h-11"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2 text-sm font-medium">
              <Phone className="size-4 text-muted-foreground" />
              WhatsApp <span className="text-destructive">*</span>
            </Label>
            <PhoneInput
              id="whatsapp"
              placeholder="(11) 99999-9999"
              value={form.whatsapp}
              onChange={(v) => setForm({ ...form, whatsapp: v })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf" className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="size-4 text-muted-foreground" />
                CPF
              </Label>
              <Input
                id="cpf"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="size-4 text-muted-foreground" />
                Nascimento
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4 text-muted-foreground" />
              Observações
            </Label>
            <Input
              id="notes"
              placeholder="Alergias, histórico, etc."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="h-11"
            />
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
              <Button type="submit" disabled={saving} className="h-10 min-w-[120px]">
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Salvando...
                  </>
                ) : isEditing ? (
                  'Salvar alterações'
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
