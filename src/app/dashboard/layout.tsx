
'use client';
import type { ReactNode } from 'react';
import { ModuleSidebar } from '@/components/module-sidebar';
import { ServerSidebar } from '@/components/server-sidebar';
import RippleGrid from '@/components/ripple-grid';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { serverId: string };
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect should run only on the client
    if (typeof window !== 'undefined') {
      const authedGuilds = JSON.parse(localStorage.getItem('authed_guilds') || '[]');
      if (authedGuilds.includes(params.serverId)) {
        setIsAuthorized(true);
      } else {
        // If not authorized, redirect to the selector page
        router.push('/dashboard');
      }
      // Authorization check is complete
      setLoading(false);
    }
  }, [params.serverId, router]);

  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
       </div>
    );
  }

  if (!isAuthorized) {
    // You can return a loading state or null while redirecting
     return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
          <p>Redirection...</p>
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
       </div>
    );
  }


  return (
    <div className="relative flex h-screen bg-background text-foreground overflow-hidden">
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
  );
}

    