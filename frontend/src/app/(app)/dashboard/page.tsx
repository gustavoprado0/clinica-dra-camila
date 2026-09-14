'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CalendarX, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { DashboardSummary } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
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

  const totalToday = summary?.stats.totalToday || 0;
  const today = summary?.today || [];

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  // Saudação por hora do dia
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Saudação */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {greeting}, Dra. Camila
        </h1>
        <p className="text-sm text-muted-foreground capitalize mt-1">
          {todayFormatted}
        </p>
      </div>

      {/* Card único de consultas */}
      {loading ? (
        <StatCardSkeleton />
      ) : (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Consultas hoje
                </p>
                <p className="text-5xl sm:text-6xl font-bold text-primary mt-2 leading-none">
                  {totalToday}
                </p>
                {totalToday > 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {totalToday === 1
                      ? '1 paciente agendado'
                      : `${totalToday} pacientes agendados`}
                  </p>
                )}
              </div>
              <div className="size-16 sm:size-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="size-8 sm:size-10 text-primary" />
              </div>
            </div>

            {totalToday > 0 && (
              <Button
                onClick={() => router.push('/agenda')}
                className="mt-6 gap-2"
                variant="default"
              >
                Ver agenda
                <ArrowRight className="size-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agenda do dia */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {totalToday > 0 ? 'Consultas de hoje' : 'Nada agendado pra hoje'}
        </h2>

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
                description="Aproveite o dia livre! Ou crie um novo agendamento."
                action={
                  <Button
                    size="sm"
                    onClick={() => router.push('/agenda')}
                    className="mt-2 gap-1.5"
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
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => router.push('/agenda')}
                      className="w-full text-left flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-muted/40 transition"
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

                      <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                    </button>
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
