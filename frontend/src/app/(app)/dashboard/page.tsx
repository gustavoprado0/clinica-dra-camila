'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { DashboardSummary } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const s = await api.get<DashboardSummary>('/api/dashboard/summary');
        setSummary(s);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const stats = summary?.stats || { totalToday: 0, confirmed: 0, pending: 0 };
  const today = summary?.today || [];

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do dia
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Hoje
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Consultas" value={stats.totalToday} accent="text-blue-600" />
          <StatCard label="Confirmadas" value={stats.confirmed} accent="text-green-600" />
          <StatCard label="Pendentes" value={stats.pending} accent="text-amber-600" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Agenda de hoje
        </h2>
        <Card>
          <CardContent className="p-0">
            {today.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhuma consulta agendada para hoje.
              </div>
            ) : (
              today.map((apt, i) => (
                <div key={apt.id}>
                  {i > 0 && <Separator />}
                  <div className="px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium w-14">
                        {new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div>
                        <p className="font-medium">{apt.patient?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {apt.procedure?.name}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                </div>
              ))
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
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className={`text-3xl font-bold ${accent}`}>{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
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
