'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, ChevronRight, User, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/lib/ui-store';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  agenda: 'Agenda',
  pacientes: 'Pacientes',
  procedimentos: 'Procedimentos',
  configuracoes: 'Configurações',
};

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('Dra. Camila');
  const { toggleSidebar, setMobileMenuOpen } = useUIStore();

  useEffect(() => {
    async function load() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API}/api/auth/me`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.user?.name) setUserName(data.user.name);
      } catch {
        // ignora
      }
    }
    load();
  }, []);

  async function handleLogout() {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    await fetch(`${API}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
    router.refresh();
  }

  const segments = pathname.split('/').filter(Boolean);
  const current = segments[segments.length - 1] || 'dashboard';
  const currentLabel = routeLabels[current] || current;

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 lg:px-8">
      {/* Esquerda — Menu toggle + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Botão desktop (colapsa sidebar) */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
          title="Alternar sidebar"
        >
          <Menu className="size-[18px]" />
        </button>

        {/* Botão mobile (abre drawer) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden size-9 inline-flex items-center justify-center rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
          title="Abrir menu"
        >
          <Menu className="size-[18px]" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline text-muted-foreground">
            Dra. Camila
          </span>
          <ChevronRight className="hidden sm:inline size-4 text-muted-foreground/50" />
          <span className="font-medium text-foreground">{currentLabel}</span>
        </div>
      </div>

      {/* Direita — Notificações + User */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="size-9 inline-flex items-center justify-center rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
          title="Notificações (em breve)"
        >
          <Bell className="size-[18px]" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-muted transition">
            <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-foreground">
              {userName.split(' ')[0]}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">Administradora</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="size-4" />
              Meu perfil (em breve)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
