'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Plus, GripVertical } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  startDate: Date;
  appointments: Appointment[];
  onSlotClick: (date: Date, hour: number) => void;
  onAppointmentClick: (apt: Appointment) => void;
  onAppointmentMove: (apt: Appointment, newDate: Date) => Promise<void> | void;
  weekdays: number[];
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

interface DraggableCardProps {
  apt: Appointment;
  onClick: () => void;
}

function DraggableCard({ apt, onClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: apt.id,
      data: { appointment: apt },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Ignora click se o usuário arrastou (evita conflito)
        if (isDragging) return;
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'relative w-full text-left rounded-md border px-2 py-1.5 transition text-xs cursor-grab active:cursor-grabbing select-none',
        statusColor(apt.status),
        isDragging && 'opacity-30'
      )}
    >
      <GripVertical className="absolute top-1 right-1 size-3 opacity-40" />
      <p className="font-semibold truncate leading-tight pr-3">
        {new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
      <p className="truncate leading-tight mt-0.5">{apt.patient?.name}</p>
      <p className="truncate leading-tight opacity-70">
        {apt.procedure?.name}
      </p>
    </div>
  );
}

interface DroppableCellProps {
  day: Date;
  hour: number;
  disabled: boolean;
  isOver: boolean;
  children: React.ReactNode;
  onSlotClick: () => void;
}

function DroppableCell({
  day,
  hour,
  disabled,
  children,
  onSlotClick,
}: DroppableCellProps) {
  const id = `cell-${day.toISOString()}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { day, hour },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[60px] border-l p-1 transition',
        isOver && 'bg-primary/10 border-primary/30'
      )}
    >
      {children}
      {!children && !disabled && (
        <button
          type="button"
          onClick={onSlotClick}
          className="w-full h-full min-h-[52px] rounded-md hover:bg-primary/5 hover:border hover:border-primary/20 transition flex items-center justify-center group"
          title="Novo agendamento"
        >
          <Plus className="size-3.5 text-muted-foreground/0 group-hover:text-primary/60 transition" />
        </button>
      )}
    </div>
  );
}

export function WeekView({
  startDate,
  appointments,
  onSlotClick,
  onAppointmentClick,
  onAppointmentMove,
  weekdays,
}: WeekViewProps) {
  const [activeApt, setActiveApt] = useState<Appointment | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px pra começar drag (evita clique acidental)
      },
    })
  );

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

  function handleDragStart(event: DragStartEvent) {
    const apt = event.active.data.current?.appointment as
      | Appointment
      | undefined;
    if (apt) setActiveApt(apt);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveApt(null);
    const { active, over } = event;
    if (!over) return;

    const apt = active.data.current?.appointment as Appointment | undefined;
    const target = over.data.current as { day: Date; hour: number } | undefined;
    if (!apt || !target) return;

    const originalDate = new Date(apt.scheduledAt);
    const newDate = new Date(target.day);
    newDate.setHours(target.hour, originalDate.getMinutes(), 0, 0);

    // Se for o mesmo horário, ignora
    if (
      originalDate.getFullYear() === newDate.getFullYear() &&
      originalDate.getMonth() === newDate.getMonth() &&
      originalDate.getDate() === newDate.getDate() &&
      originalDate.getHours() === newDate.getHours()
    ) {
      return;
    }

    await onAppointmentMove(apt, newDate);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header de dias */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
            <div className="py-3 px-2 text-xs text-muted-foreground" />
            {days.map((day) => {
              const isToday = day.getTime() === today.getTime();
              const isWorkingDay = weekdays.includes(day.getDay());
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'py-3 px-2 text-center border-l',
                    isToday && 'bg-primary/5',
                    !isWorkingDay && !isToday && "bg-muted/30"
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
              <div className="py-2 px-2 text-xs text-muted-foreground text-right border-r">
                {String(hour).padStart(2, '0')}:00
              </div>

              {days.map((day) => {
                const apts = getAppointments(day, hour);
                const isWorkingDay = weekdays.includes(day.getDay());
                const isPast =
                  day < today ||
                  (day.getTime() === today.getTime() &&
                    hour < new Date().getHours());

                const canDrop = isWorkingDay && !isPast;

                return (
                  <DroppableCell
                    key={day.toISOString() + hour}
                    day={day}
                    hour={hour}
                    disabled={!canDrop}
                    isOver={false}
                    onSlotClick={() => onSlotClick(day, hour)}
                  >
                    {apts.length > 0 ? (
                      <div className="space-y-1">
                        {apts.map((apt) => (
                          <DraggableCard
                            key={apt.id}
                            apt={apt}
                            onClick={() => onAppointmentClick(apt)}
                          />
                        ))}
                      </div>
                    ) : null}
                  </DroppableCell>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Overlay que segue o mouse durante o drag */}
      <DragOverlay dropAnimation={null}>
        {activeApt ? (
          <div
            className={cn(
              'text-left rounded-md border px-2 py-1.5 text-xs shadow-2xl rotate-2',
              statusColor(activeApt.status)
            )}
          >
            <p className="font-semibold truncate leading-tight">
              {new Date(activeApt.scheduledAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="truncate leading-tight mt-0.5">
              {activeApt.patient?.name}
            </p>
            <p className="truncate leading-tight opacity-70">
              {activeApt.procedure?.name}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
