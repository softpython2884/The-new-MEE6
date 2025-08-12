'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRightLeft,
  BookUser,
  Bot,
  CircleDollarSign,
  GanttChart,
  Gauge,
  MessageSquare,
  ShieldCheck,
  UserRoundCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';

const navItems = [
  { href: '/dashboard/arrivals-departures', label: 'Arrivées et départs', icon: ArrowRightLeft },
  { href: '/dashboard/auto-roles', label: 'Rôles automatiques', icon: UserRoundCog },
  { href: '/dashboard/levels', label: 'Niveaux', icon: Gauge },
  { href: '/dashboard/economy', label: 'Économie', icon: CircleDollarSign },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare, isNew: true },
  { href: '/dashboard/moderation', label: 'Modération', icon: ShieldCheck },
  { href: '/dashboard/auto-moderation', label: 'Auto-Modération', icon: Bot },
  { href: '/dashboard/reaction-roles', label: 'Rôles-Réactions', icon: GanttChart },
];

export function ModuleSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col bg-card p-4">
      <div className="mb-6 flex items-center gap-3 px-2">
        <Avatar className="h-12 w-12 rounded-lg">
          <AvatarImage src="https://placehold.co/64x64/f1c40f/000000.png" data-ai-hint="beehive" />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-white">La ruche des abeilles 🌸</h2>
          <Badge className="bg-orange-600/80 text-white border-0 mt-1">Premium</Badge>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.label} href={item.href} passHref legacyBehavior>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start gap-3', { 'bg-secondary text-white': isActive, 'text-muted-foreground hover:text-white': !isActive})}
                asChild
              >
                <a>
                  <item.icon className={cn('h-5 w-5', { 'text-primary': isActive })} />
                  <span>{item.label}</span>
                  {item.isNew && (
                    <Badge variant="default" className="ml-auto h-5">
                      NEW
                    </Badge>
                  )}
                </a>
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
