'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AppNav } from './app-nav';
import { useUIStore } from '@/lib/ui-store';

export function MobileMenu() {
  const pathname = usePathname();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  // Fecha ao trocar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent
        side="left"
        className="p-0 w-60 max-w-[80vw] border-r-0 bg-sidebar text-sidebar-foreground [&>button]:text-white [&>button]:top-4 [&>button]:right-4"
      >
        <AppNav onNavigate={() => setMobileMenuOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
