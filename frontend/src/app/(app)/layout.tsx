import { AppNav } from '@/components/app-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AppNav />
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  );
}
