import type { ReactNode } from 'react';
import { AppHeader } from '@/components/app-header';
import { ModuleSidebar } from '@/components/module-sidebar';
import { ServerSidebar } from '@/components/server-sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <ServerSidebar />
        <ModuleSidebar />
        <main className="flex-1 overflow-y-auto bg-[#313338]">
          <div className="container mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
