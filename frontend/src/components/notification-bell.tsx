'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/use-notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const router = useRouter();
  const { count, upcoming } = useNotifications();

  const hasNotifications = count > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative size-9 inline-flex items-center justify-center rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
        title="Notificações"
      >
        <Bell className="size-[18px]" />
        {hasNotifications && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Notificações</p>
          <p className="text-xs text-muted-foreground">
            {hasNotifications
              ? `${count} consulta${count === 1 ? '' : 's'} próxima${
                  count === 1 ? '' : 's'
                }`
              : 'Nada agendado pra hoje'}
          </p>
        </div>

        {hasNotifications ? (
          <div className="max-h-72 overflow-y-auto divide-y">
            {upcoming.map((n) => {
              const time = new Date(n.scheduledAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div key={n.id} className="px-4 py-3 hover:bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {time}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {n.patientName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {n.procedureName}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta próxima hoje 🎉
            </p>
          </div>
        )}

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/agenda')}
            className="w-full text-xs"
          >
            Ver agenda completa
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
