
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

interface ServerInfo {
  id: string;
  name: string;
  iconURL: string | null;
}

function ServerSidebarSkeleton() {
    return (
         <div className="flex flex-1 flex-col items-center gap-3">
            {[...Array(3)].map((_, i) => (
                 <Skeleton key={i} className="h-12 w-12 rounded-full" />
            ))}
         </div>
    )
}

export function ServerSidebar({ serverId }: { serverId: string }) {
  const pathname = usePathname();
  const pathSegments = pathname.split('/');
  // If the path is just /dashboard/[serverId], default to 'moderation'.
  // Otherwise, take the last part of the URL.
  const featurePath = pathSegments.length > 3 && pathSegments[3] ? pathSegments[3] : 'moderation';
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteUrl, setInviteUrl] = useState<string>('#');

  useEffect(() => {
    const fetchServers = async () => {
        const storedGuildIds = JSON.parse(localStorage.getItem('authed_guilds') || '[]');
        if (storedGuildIds.length === 0) {
            setLoading(false);
            return;
        }

        try {
             const response = await fetch(`${API_URL}/get-servers-details`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ guildIds: storedGuildIds }),
            });
            if (response.ok) {
                const data = await response.json();
                setServers(data);
            } else {
                console.error("Failed to fetch servers details");
            }
        } catch (error) {
            console.error("Error fetching server details", error);
        } finally {
            setLoading(false);
        }
    };
    fetchServers();

    // Construct the invite URL
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    if (clientId) {
        setInviteUrl(`https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`);
    }

  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full w-20 flex-col items-center gap-3 bg-card py-4">
        {loading ? (
            <ServerSidebarSkeleton />
        ) : (
            <div className="flex flex-1 flex-col items-center gap-3">
              {servers.map((server) => {
                const isActive = server.id === serverId;
                return (
                  <Tooltip key={server.id}>
                    <TooltipTrigger asChild>
                      <Link href={`/dashboard/${server.id}/${featurePath}`} className="relative group">
                        <div className={cn(
                          "absolute -left-1 top-1/2 -translate-y-1/2 h-0 w-1 bg-white rounded-r-full transition-all",
                          isActive ? "h-10" : "group-hover:h-5"
                        )}></div>
                        <Avatar className={cn(
                          "h-12 w-12 rounded-full transition-all group-hover:rounded-2xl",
                          isActive ? "rounded-2xl" : ""
                        )}>
                          {server.iconURL ? (
                             <AvatarImage src={server.iconURL} />
                          ) : (
                             <AvatarFallback>{server.name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{server.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
        )}
        <div className="mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
                <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                    <button className="flex size-12 items-center justify-center rounded-full bg-card-foreground/10 text-green-400 transition-all hover:bg-green-400 hover:text-white">
                        <Plus size={24} />
                    </button>
                </a>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Ajouter un serveur</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
