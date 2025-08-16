
'use client';
import type { ReactNode } from 'react';
import { ModuleSidebar } from '@/components/module-sidebar';
import { ServerSidebar } from '@/components/server-sidebar';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
      // Should not happen on this layout, but as a safeguard
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
    // This will be shown briefly before redirection kicks in
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
        <ModuleSidebar serverId={params.serverId} />
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="container mx-auto p-6 lg:p-8">
             <AuthGuard>{children}</AuthGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
