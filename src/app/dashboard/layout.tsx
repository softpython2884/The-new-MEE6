'use client';
import type { ReactNode } from 'react';
import { ModuleSidebar } from '@/components/module-sidebar';
import { ServerSidebar } from '@/components/server-sidebar';
import dynamic from 'next/dynamic';

const RippleGrid = dynamic(() => import('@/components/ripple-grid'), {
  ssr: false,
});

export default function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { serverId: string };
}) {
  return (
    <div className="relative flex h-screen bg-background text-foreground overflow-hidden">
      <div className="relative z-10 flex h-full w-full">
        <ServerSidebar serverId={params.serverId} />
        <ModuleSidebar serverId={params.serverId} />
        <main className="flex-1 overflow-y-auto bg-transparent relative">
           <div className="absolute inset-0 z-0">
             <RippleGrid
                enableRainbow={true}
                gridColor="#2c3e50"
                rippleIntensity={0.05}
                gridSize={10}
                gridThickness={15}
                fadeDistance={1.5}
                vignetteStrength={2}
                glowIntensity={0.1}
                opacity={1}
                gridRotation={0}
                mouseInteraction={true}
                mouseInteractionRadius={0.8}
            />
           </div>
          <div className="container mx-auto p-6 lg:p-8 relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
