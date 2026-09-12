'use client';

import { useEffect, useState } from 'react';
import { Loader2, DollarSign, Clock, Tag } from 'lucide-react';
import { api } from '@/lib/api';
import type { Procedure } from '@/lib/types';
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Procedure | null;
  onSaved?: () => void;
}

const EMPTY = { name: '', durationMin: 60, price: 0 };

export function ProcedureDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: Props) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        durationMin: editing.durationMin,
        price: editing.price,
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

    if (!form.name.trim()) {
      setError('Informe o nome do procedimento');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/procedures/${editing.id}`, form);
      } else {
        await api.post('/api/procedures', form);
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
            {isEditing ? 'Editar procedimento' : 'Novo procedimento'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? 'Atualize os dados do procedimento'
              : 'Adicione um novo procedimento oferecido pela clínica'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
              <Tag className="size-4 text-muted-foreground" />
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Limpeza, Clareamento, Restauração..."
              required
              className="h-11"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium">
                <Clock className="size-4 text-muted-foreground" />
                Duração (min)
              </Label>
              <Input
                id="duration"
                type="number"
                min={5}
                step={5}
                value={form.durationMin}
                onChange={(e) =>
                  setForm({ ...form, durationMin: Number(e.target.value) })
                }
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="size-4 text-muted-foreground" />
                Valor (R$)
              </Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={10}
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                className="h-11"
                required
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
                disabled={saving}
                className="h-10 min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Salvando...
                  </>
                ) : isEditing ? (
                  'Salvar alterações'
                ) : (
                  'Criar procedimento'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
