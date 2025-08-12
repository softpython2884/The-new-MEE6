
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Hammer,
  Bot,
  Mic,
  FileClock,
  Sparkles,
  Languages,
  Lock,
  Camera,
  ScanSearch,
  Fingerprint,
  Ticket,
  Calendar,
  ToyBrick,
  GraduationCap,
  Wrench,
  HelpCircle,
  Palette,
  Terminal,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';

const navCategories = [
    {
        name: 'Général',
        items: [
            { href: 'commandes-generales', label: 'Commandes Générales', icon: Wrench },
            { href: 'assistant-communautaire', label: 'Assistant Communautaire', icon: MessageSquare },
            { href: 'traduction-automatique', label: 'Traduction Auto', icon: Languages, isPremium: true },
            { href: 'logs', label: 'Logs', icon: FileClock },
        ]
    },
    {
        name: 'Modération',
        items: [
            { href: 'moderation', label: 'Bans & Kicks', icon: Hammer },
            { href: 'auto-moderation', label: 'Auto-Modération', icon: Bot },
            { href: 'lock', label: 'Lock/Unlock', icon: Lock },
        ]
    },
    {
        name: 'Sécurité',
        items: [
            { href: 'anti-bot', label: 'Anti-Bot', icon: ShieldCheck },
            { href: 'webcam-control', label: 'Contrôle Webcam', icon: Camera },
            { href: 'filtre-image-ia', label: 'Filtre d\'Image IA', icon: ScanSearch, isPremium: true },
            { href: 'anti-raid', label: 'Anti-Raid & Liens', icon: Fingerprint, isPremium: true },
            { href: 'captcha', label: 'Captcha', icon: Fingerprint, isPremium: true },
        ]
    },
    {
        name: 'Automatisation',
        items: [
            { href: 'salons-prives', label: 'Salons Privés', icon: Ticket },
            { href: 'evenements', label: 'Événements & Calendrier', icon: Calendar, isPremium: true },
        ]
    },
    {
        name: 'Vocaux',
        items: [
             { href: 'vocaux-ia', label: 'IA Vocaux', icon: Mic, isPremium: true },
             { href: 'commandes-vocales', label: 'Commandes vocales', icon: Terminal },
        ]
    },
     {
        name: 'Outils IA',
        items: [
            { href: 'constructeur-serveur-ia', label: 'Server Builder IA', icon: ToyBrick, isPremium: true },
            { href: 'assistant-moderation-ia', label: 'Assistant Modération IA', icon: Sparkles, isPremium: true },
            { href: 'formation-moderateur-ia', label: 'Formation Modérateur IA', icon: GraduationCap, isPremium: true },
            { href: 'createur-contenu-ia', label: 'Créateur de Contenu IA', icon: Palette, isPremium: true },
        ]
    }
];

export function ModuleSidebar({ serverId }: { serverId: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-card p-4">
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
      <nav className="flex-1 space-y-2">
        {navCategories.map((category) => (
            <div key={category.name}>
                <h3 className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">{category.name}</h3>
                <div className="flex flex-col gap-1">
                    {category.items.map((item) => {
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
                              {item.isPremium && <Sparkles className="h-4 w-4 ml-auto text-yellow-400" />}
                          </Button>
                        </Link>
                      );
                    })}
                </div>
            </div>
        ))}
      </nav>
    </aside>
  );
}
