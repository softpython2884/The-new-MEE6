'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Hammer,
  ShieldCheck,
  Users,
  MessageSquare,
  Sparkles,
  Palette,
  Layout,
  Mic,
  FileClock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';

const navItems = [
  { href: 'moderation', label: 'Modération', icon: Hammer },
  { href: 'auto-moderation', label: 'Auto-Modération', icon: Bot },
  { href: 'securite', label: 'Sécurité', icon: ShieldCheck },
  { href: 'createur-contenu-ia', label: 'Créateur de Contenu IA', icon: Palette },
  { href: 'constructeur-serveur-ia', label: 'Constructeur de Serveur IA', icon: Layout },
  { href: 'salons-vocaux-intelligents', label: 'Salons Vocaux Intelligents', icon: Mic },
  { href: 'logs', label: 'Logs & Notifications', icon: FileClock, isNew: true },
  { href: 'roles-reactions', label: 'Rôles-Réactions', icon: Sparkles },
  { href: 'roles-automatiques', label: 'Rôles automatiques', icon: Users },
  { href: 'messages', label: 'Messages', icon: MessageSquare },
];

export function ModuleSidebar({ serverId }: { serverId: string }) {
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
          <Badge className="mt-1 border-0 bg-orange-600/80 text-white">Premium</Badge>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const fullPath = `/dashboard/${serverId}/${item.href}`;
          const isActive = pathname === fullPath;
          return (
            <Link key={item.label} href={fullPath}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start gap-3', { 'bg-secondary text-white': isActive, 'text-muted-foreground hover:text-white': !isActive})}
              >
                <item.icon className={cn('h-5 w-5', { 'text-primary': isActive })} />
                <span>{item.label}</span>
                {item.isNew && (
                  <Badge variant="default" className="ml-auto h-5">
                    NEW
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
