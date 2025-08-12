'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BotMessageSquare, Plus } from 'lucide-react';
import { Separator } from './ui/separator';

const servers = [
  { id: '1', name: 'Gaming Community', imageUrl: 'https://placehold.co/64x64/2c3e50/00bcd4.png', dataHint: 'gaming controller' },
  { id: '2', name: 'Study Group', imageUrl: 'https://placehold.co/64x64/34495e/00bcd4.png', dataHint: 'books stack' },
  { id: '3', name: 'Art Club', imageUrl: 'https://placehold.co/64x64/2c3e50/00bcd4.png', dataHint: 'paint palette' },
  { id: '4', name: 'Developer Hub', imageUrl: 'https://placehold.co/64x64/34495e/00bcd4.png', dataHint: 'code brackets' },
  { id: '5', name: 'Music Corner', imageUrl: 'https://placehold.co/64x64/2c3e50/00bcd4.png', dataHint: 'music note' },
];

export function ServerSidebar() {
  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full w-20 flex-col items-center gap-4 border-r border-border bg-card/50 py-4">
        <Link href="/dashboard" aria-label="Home">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-all hover:scale-110">
                <BotMessageSquare size={28} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Home</p>
            </TooltipContent>
          </Tooltip>
        </Link>
        <Separator className="w-8 bg-border/50" />
        <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto">
          {servers.map((server) => (
            <Tooltip key={server.id}>
              <TooltipTrigger asChild>
                <Link href={`/dashboard?server=${server.id}`}>
                  <Avatar className="h-12 w-12 rounded-2xl transition-all hover:rounded-xl hover:ring-2 hover:ring-primary">
                    <AvatarImage src={server.imageUrl} data-ai-hint={server.dataHint} />
                    <AvatarFallback>{server.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{server.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex size-12 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/10">
              <Plus size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add a server</p>
          </TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}
