'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/ui-store';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/procedimentos', label: 'Procedimentos', icon: Stethoscope },
];

interface AppNavProps {
  /** Se true, mostra só ícones (desktop colapsado) */
  collapsed?: boolean;
  /** Callback chamado quando um link é clicado (pra fechar drawer mobile) */
  onNavigate?: () => void;
}

export function AppNav({ collapsed = false, onNavigate }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
    router.refresh();
  }

  function handleLinkClick() {
    onNavigate?.();
  }

  return (
    <nav
      className={cn(
        'flex flex-col min-h-screen bg-sidebar text-sidebar-foreground transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo / Header */}
      <div
        className={cn(
          'border-b border-sidebar-border transition-all',
          collapsed ? 'px-3 py-6' : 'px-5 py-6'
        )}
      >
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="size-10 shrink-0 rounded-xl bg-sidebar-primary/10 flex items-center justify-center">
            <span className="text-xl">🦷</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight text-white">
                Dra. Camila
              </p>
              <p className="text-xs text-sidebar-foreground/60 leading-tight">
                Painel da clínica
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Links principais */}
      <div className="flex-1 py-4 px-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={handleLinkClick}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg text-sm transition-all',
                collapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5',
                active
                  ? 'bg-sidebar-accent text-white font-medium shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white'
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Footer — Configurações + Sair */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          href="/configuracoes"
          onClick={handleLinkClick}
          title={collapsed ? 'Configurações' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm transition-all',
            collapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5',
            pathname.startsWith('/configuracoes')
              ? 'bg-sidebar-accent text-white font-medium shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white'
          )}
        >
          <Settings className="size-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Configurações</span>}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white transition-all',
            collapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5'
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Sair</span>}
        </button>
      </div>
    </nav>
  );
}
