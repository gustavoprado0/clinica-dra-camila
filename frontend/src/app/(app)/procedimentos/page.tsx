'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Power, Clock, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import type { Procedure } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { ProcedureDialog } from '@/components/procedure-dialog';

export default function ProceduresPage() {
  const router = useRouter();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [deleting, setDeleting] = useState<Procedure | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = showInactive ? '/api/procedures?all=true' : '/api/procedures';
      const list = await api.get<Procedure[]>(url);
      setProcedures(list);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [showInactive, router]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(p: Procedure) {
    setEditing(p);
    setDialogOpen(true);
  }

  async function handleToggle(p: Procedure) {
    setBusyId(p.id);
    setError('');
    try {
      await api.patch(`/api/procedures/${p.id}/toggle`, {});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    setError('');
    try {
      await api.delete(`/api/procedures/${deleting.id}`);
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
          <h1 className="text-2xl font-bold">Procedimentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os procedimentos oferecidos pela clínica
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Novo procedimento
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="show-inactive"
          checked={showInactive}
          onCheckedChange={setShowInactive}
        />
        <label
          htmlFor="show-inactive"
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Mostrar inativos
        </label>
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
              Carregando procedimentos...
            </div>
          ) : procedures.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum procedimento cadastrado ainda.
            </div>
          ) : (
            procedures.map((p, i) => (
              <div key={p.id}>
                {i > 0 && <Separator />}
                <div
                  className={`px-5 py-4 flex items-center justify-between transition ${
                    p.active ? 'hover:bg-muted/40' : 'bg-muted/20 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        p.active
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Power className="size-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{p.name}</p>
                        {!p.active && (
                          <Badge variant="outline" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {p.durationMin}min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="size-3" />
                          {p.price === 0 ? 'Grátis' : `R$ ${p.price.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(p)}
                      disabled={busyId === p.id}
                      title="Editar"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(p)}
                      disabled={busyId === p.id}
                      title={p.active ? 'Desativar' : 'Ativar'}
                    >
                      <Power className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(p)}
                      disabled={busyId === p.id}
                      title="Excluir"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ProcedureDialog
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
            <AlertDialogTitle>Excluir procedimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleting?.name}</strong>?
              Essa ação não pode ser desfeita. Se houver agendamentos usando
              este procedimento, a exclusão será bloqueada — nesse caso, prefira
              <strong> desativar</strong>.
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
    </div>
  );
}
