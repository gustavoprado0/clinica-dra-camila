'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  Clock,
  DollarSign,
  Stethoscope,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Procedure } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/empty-state';
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
    try {
      await api.patch(`/api/procedures/${p.id}/toggle`, {});
      toast.success(p.active ? `${p.name} desativado` : `${p.name} ativado`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await api.delete(`/api/procedures/${deleting.id}`);
      toast.success(`${deleting.name} foi excluído`);
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir');
      setDeleting(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Procedimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os procedimentos da clínica
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" />
          Novo procedimento
        </Button>
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-2">
        <Switch
          id="show-inactive"
          checked={showInactive}
          onCheckedChange={setShowInactive}
        />
        <label
          htmlFor="show-inactive"
          className="text-sm text-muted-foreground cursor-pointer select-none"
        >
          Mostrar inativos
        </label>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="size-9" />
                  <Skeleton className="size-9" />
                </div>
              ))}
            </div>
          ) : procedures.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="Nenhum procedimento cadastrado"
              description="Cadastre os procedimentos oferecidos pela clínica."
              action={
                <Button onClick={openCreate} size="sm" className="mt-2 gap-1.5">
                  <Plus className="size-4" />
                  Novo procedimento
                </Button>
              }
            />
          ) : (
            procedures.map((p, i) => (
              <div key={p.id}>
                {i > 0 && <Separator />}
                <div
                  className={`px-4 sm:px-5 py-4 flex items-center justify-between transition ${
                    p.active ? 'hover:bg-muted/40' : 'bg-muted/20 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                        p.active
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Power className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{p.name}</p>
                        {!p.active && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground mt-0.5">
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

                  <div className="flex items-center gap-1 shrink-0">
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
        onSaved={() => {
          toast.success(editing ? 'Procedimento atualizado' : 'Procedimento criado');
          load();
        }}
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
