'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { DashboardSummary, User } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await api.get<{ user: User }>('/api/auth/me');
        setUser(me.user);

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

  async function handleLogout() {
    await api.post('/api/auth/logout', {});
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  const stats = summary?.stats || { totalToday: 0, confirmed: 0, pending: 0 };
  const today = summary?.today || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {user?.name ?? 'Dashboard'}
            </h1>
            <p className="text-xs text-gray-500">Painel da clínica</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Hoje
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Consultas" value={stats.totalToday} color="blue" />
            <StatCard label="Confirmadas" value={stats.confirmed} color="green" />
            <StatCard label="Pendentes" value={stats.pending} color="yellow" />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Agenda de hoje
            </h2>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {today.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Nenhuma consulta agendada para hoje.
              </div>
            ) : (
              today.map((apt) => (
                <div
                  key={apt.id}
                  className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-900 w-14">
                      {new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {apt.patient?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {apt.procedure?.name}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow';
}) {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
    CONFIRMED: { label: 'Confirmada', className: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
    DONE: { label: 'Concluída', className: 'bg-gray-100 text-gray-600' },
  };
  const info = map[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${info.className}`}>
      {info.label}
    </span>
  );
}
