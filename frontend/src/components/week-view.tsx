'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  startDate: Date;
  appointments: Appointment[];
  onSlotClick: (date: Date, hour: number) => void;
  onAppointmentClick: (apt: Appointment) => void;
}

const START_HOUR = 8;
const END_HOUR = 19;

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function statusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200',
    CONFIRMED:
      'bg-emerald-100 border-emerald-300 text-emerald-900 hover:bg-emerald-200',
    CANCELLED: 'bg-red-100 border-red-300 text-red-900 hover:bg-red-200',
    DONE: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200',
  };
  return map[status] || 'bg-muted border-border';
}

export function WeekView({
  startDate,
  appointments,
  onSlotClick,
  onAppointmentClick,
}: WeekViewProps) {
  // 7 dias a partir do startDate (segunda ou o dia escolhido)
  const days = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      list.push(d);
    }
    return list;
  }, [startDate]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) list.push(h);
    return list;
  }, []);

  // Indexa agendamentos por [dia][hora]
  const grid = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const apt of appointments) {
      const d = new Date(apt.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    }
    return map;
  }, [appointments]);

  function getAppointments(day: Date, hour: number) {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${hour}`;
    return grid[key] || [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Cabeçalho de dias */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
          <div className="py-3 px-2 text-xs text-muted-foreground" />
          {days.map((day) => {
            const isToday = day.getTime() === today.getTime();
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'py-3 px-2 text-center border-l',
                  isToday && 'bg-primary/5',
                  isWeekend && !isToday && 'bg-muted/30'
                )}
              >
                <p
                  className={cn(
                    'text-xs font-medium uppercase tracking-wide',
                    isToday ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {WEEKDAY_SHORT[day.getDay()]}
                </p>
                <p
                  className={cn(
                    'text-lg font-bold leading-tight',
                    isToday && 'text-primary'
                  )}
                >
                  {String(day.getDate()).padStart(2, '0')}
                </p>
              </div>
            );
          })}
        </div>

        {/* Grid de horários */}
        {hours.map((hour, idx) => (
          <div
            key={hour}
            className={cn(
              'grid grid-cols-[60px_repeat(7,1fr)]',
              idx > 0 && 'border-t'
            )}
          >
            {/* Coluna de horas */}
            <div className="py-2 px-2 text-xs text-muted-foreground text-right border-r">
              {String(hour).padStart(2, '0')}:00
            </div>

            {/* 7 células */}
            {days.map((day) => {
              const apts = getAppointments(day, hour);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isPast =
                day < today || (day.getTime() === today.getTime() && hour < new Date().getHours());
              return (
                <div
                  key={day.toISOString() + hour}
                  className={cn(
                    'min-h-[60px] border-l p-1',
                    isWeekend && 'bg-muted/20',
                    isPast && 'opacity-50'
                  )}
                >
                  {apts.length === 0 ? (
                    !isWeekend && !isPast ? (
                      <button
                        type="button"
                        onClick={() => onSlotClick(day, hour)}
                        className="w-full h-full min-h-[52px] rounded-md hover:bg-primary/5 hover:border hover:border-primary/20 transition flex items-center justify-center group"
                        title="Novo agendamento"
                      >
                        <Plus className="size-3.5 text-muted-foreground/0 group-hover:text-primary/60 transition" />
                      </button>
                    ) : null
                  ) : (
                    <div className="space-y-1">
                      {apts.map((apt) => (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={() => onAppointmentClick(apt)}
                          className={cn(
                            'w-full text-left rounded-md border px-2 py-1.5 transition text-xs',
                            statusColor(apt.status)
                          )}
                        >
                          <p className="font-semibold truncate leading-tight">
                            {new Date(apt.scheduledAt).toLocaleTimeString(
                              'pt-BR',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </p>
                          <p className="truncate leading-tight mt-0.5">
                            {apt.patient?.name}
                          </p>
                          <p className="truncate leading-tight opacity-70">
                            {apt.procedure?.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
