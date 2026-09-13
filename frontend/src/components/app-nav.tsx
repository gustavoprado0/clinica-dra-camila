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

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/procedimentos', label: 'Procedimentos', icon: Stethoscope },
];

export function AppNav() {
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

  return (
    <nav className="flex flex-col w-60 min-h-screen bg-sidebar text-sidebar-foreground">
      {/* Logo / Header */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-sidebar-primary/10 flex items-center justify-center">
            <span className="text-xl">🦷</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-white">
              Dra. Camila
            </p>
            <p className="text-xs text-sidebar-foreground/60 leading-tight">
              Painel da clínica
            </p>
          </div>
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
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active
                  ? 'bg-sidebar-accent text-white font-medium shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white'
              )}
            >
              <Icon className="size-[18px]" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Footer — Configurações + Sair */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          href="/configuracoes"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
            pathname.startsWith('/configuracoes')
              ? 'bg-sidebar-accent text-white font-medium shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white'
          )}
        >
          <Settings className="size-[18px]" />
          Configurações
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white transition-all"
        >
          <LogOut className="size-[18px]" />
          Sair
        </button>
      </div>
    </nav>
  );
}
