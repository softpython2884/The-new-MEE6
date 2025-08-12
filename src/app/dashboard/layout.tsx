import type { ReactNode } from 'react';
import { ModuleSidebar } from '@/components/module-sidebar';
import { ServerSidebar } from '@/components/server-sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <ServerSidebar />
      <ModuleSidebar />
      <ScrollArea className="flex-1">
        <main className="container mx-auto p-6 lg:p-8">{children}</main>
      </ScrollArea>
    </div>
  );
}
