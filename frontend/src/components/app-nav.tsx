'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
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
    <nav className="flex flex-col w-56 min-h-screen border-r bg-background">
      <div className="px-5 py-5 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦷</span>
          <div>
            <p className="text-sm font-semibold">Dra. Camila</p>
            <p className="text-xs text-muted-foreground">Painel da clínica</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-sm transition',
                active
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-muted-foreground"
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </nav>
  );
}
