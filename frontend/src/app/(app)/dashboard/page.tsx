'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  CalendarX,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { DashboardSummary } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/skeleton-card';

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const s = await api.get<DashboardSummary>('/api/dashboard/summary');
      setSummary(s);
    } catch (err) {
      toast.error('Erro ao carregar dashboard');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = summary?.stats || { totalToday: 0, confirmed: 0, pending: 0 };
  const today = summary?.today || [];

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Visão Geral</h1>
        <p className="text-sm text-muted-foreground capitalize mt-1">
          {todayFormatted}
        </p>
      </div>

      {/* Stats */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Hoje
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label="Consultas"
                value={stats.totalToday}
                icon={Calendar}
                accent="text-blue-600 bg-blue-50"
              />
              <StatCard
                label="Confirmadas"
                value={stats.confirmed}
                icon={CheckCircle2}
                accent="text-emerald-600 bg-emerald-50"
              />
              <StatCard
                label="Pendentes"
                value={stats.pending}
                icon={Clock}
                accent="text-amber-600 bg-amber-50"
              />
            </>
          )}
        </div>
      </section>

      {/* Agenda de hoje */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Agenda de hoje
          </h2>
          {!loading && today.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/agenda')}
              className="text-xs h-7"
            >
              Ver agenda completa
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <>
                <ListItemSkeleton />
                <ListItemSkeleton />
                <ListItemSkeleton />
              </>
            ) : today.length === 0 ? (
              <EmptyState
                icon={CalendarX}
                title="Nenhuma consulta agendada"
                description="Quando você agendar uma consulta, ela aparece aqui."
                action={
                  <Button
                    size="sm"
                    onClick={() => router.push('/agenda')}
                    className="mt-2"
                  >
                    Ir para agenda
                  </Button>
                }
              />
            ) : (
              <div className="divide-y">
                {today.map((apt) => {
                  const time = new Date(apt.scheduledAt).toLocaleTimeString(
                    'pt-BR',
                    { hour: '2-digit', minute: '2-digit' }
                  );
                  const initials = (apt.patient?.name ?? '?')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={apt.id}
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-muted/40 transition"
                    >
                      {/* Hora */}
                      <div className="flex flex-col items-center justify-center w-14 shrink-0">
                        <span className="text-sm font-semibold text-foreground">
                          {time}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                        {initials}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {apt.patient?.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {apt.procedure?.name}
                        </p>
                      </div>

                      {/* Status */}
                      <StatusBadge status={apt.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
          <div
            className={`size-10 rounded-lg flex items-center justify-center ${accent}`}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: 'Pendente',
      className: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    },
    CONFIRMED: {
      label: 'Confirmada',
      className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    },
    CANCELLED: {
      label: 'Cancelada',
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
    DONE: {
      label: 'Concluída',
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    },
  };
  const info = map[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  };
  return <Badge className={info.className}>{info.label}</Badge>;
}
