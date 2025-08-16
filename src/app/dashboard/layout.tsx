
'use client';
import type { ReactNode } from 'react';
import { ModuleSidebar } from '@/components/module-sidebar';
import { ServerSidebar } from '@/components/server-sidebar';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RippleGrid = dynamic(() => import('@/components/ripple-grid'), {
  ssr: false,
});

function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const serverId = params.serverId as string;
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      router.push('/dashboard');
      return;
    }

    const storedGuilds = JSON.parse(localStorage.getItem('authed_guilds') || '[]');
    
    if (storedGuilds.includes(serverId)) {
      setIsVerified(true);
    } else {
      console.warn(`Accès non autorisé refusé pour le serveur : ${serverId}. Redirection.`);
      router.push('/dashboard');
    }
    setLoading(false);
  }, [serverId, router]);

  if (loading) {
     return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
  }

  if (!isVerified) {
     return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
  }

  return <>{children}</>;
}


export default function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { serverId: string };
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen bg-background text-foreground overflow-hidden">
      <div className="absolute inset-0 z-0">
        <RippleGrid
            enableRainbow={true}
            gridColor="#2c3e50"
            rippleIntensity={0.07}
            gridSize={30}
            gridThickness={15}
            fadeDistance={1.5}
            vignetteStrength={2}
            glowIntensity={0.1}
            opacity={1}
            gridRotation={0}
            mouseInteraction={true}
            mouseInteractionRadius={0.5}
        />
      </div>
      <div className="relative z-10 flex h-full w-full">
        <ServerSidebar serverId={params.serverId} />
        <ModuleSidebar serverId={params.serverId} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-transparent">
           <div className="md:hidden flex items-center p-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-6 w-6" />
              </Button>
            </div>
          <div className="container mx-auto p-6 lg:p-8 pt-0 md:pt-8">
             <AuthGuard>{children}</AuthGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
