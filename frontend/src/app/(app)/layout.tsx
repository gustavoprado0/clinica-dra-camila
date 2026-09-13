'use client';

import { AppNav } from '@/components/app-nav';
import { AppHeader } from '@/components/app-header';
import { MobileMenu } from '@/components/mobile-menu';
import { useUIStore } from '@/lib/ui-store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar desktop (>= lg) */}
      <div className="hidden lg:block shrink-0">
        <AppNav collapsed={sidebarCollapsed} />
      </div>

      {/* Drawer mobile (< lg) */}
      <MobileMenu />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
