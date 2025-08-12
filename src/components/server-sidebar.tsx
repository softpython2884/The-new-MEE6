'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export const servers = [
  { id: '1', name: 'La ruche des abeilles', imageUrl: 'https://placehold.co/48x48/f1c40f/000000.png', dataHint: 'beehive' },
  { id: '2', name: 'Okali Universe', imageUrl: 'https://placehold.co/48x48/9b59b6/ffffff.png', dataHint: 'galaxy planet' },
  { id: '3', name: 'Gaming Server', imageUrl: 'https://placehold.co/48x48/3498db/ffffff.png', dataHint: 'game controller' },
  { id: '4', name: 'Art Club', imageUrl: 'https://placehold.co/48x48/e74c3c/ffffff.png', dataHint: 'paint palette' },
  { id: '5', name: 'Developer Hub', imageUrl: 'https://placehold.co/48x48/2ecc71/ffffff.png', dataHint: 'code brackets' },
];

export function ServerSidebar({ serverId }: { serverId: string }) {
  const pathname = usePathname();
  const featurePath = pathname.split('/').pop() || 'moderation';

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full w-20 flex-col items-center gap-3 bg-[#202225] py-4">
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
                      <AvatarImage src={server.imageUrl} data-ai-hint={server.dataHint} />
                      <AvatarFallback>{server.name.charAt(0)}</AvatarFallback>
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
        <div className="mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex size-12 items-center justify-center rounded-full bg-card text-green-400 transition-all hover:bg-green-400 hover:text-white">
                <Plus size={24} />
              </button>
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