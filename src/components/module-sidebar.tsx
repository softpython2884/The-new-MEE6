

'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
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
  MessageSquare,
  Voicemail,
  Palette,
  DatabaseBackup,
  MessageCircleQuestion
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { useServerInfo } from '@/hooks/use-server-info';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

const navCategories = [
    {
        name: 'Général',
        items: [
            { href: 'commandes-generales', label: 'Commandes Générales', icon: Wrench },
            { href: 'assistant-communautaire', label: 'Assistant Communautaire', icon: MessageSquare, isPremium: true },
            { href: 'traduction-automatique', label: 'Traduction Auto', icon: Languages },
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
            { href: 'backup', label: 'Backup', icon: DatabaseBackup },
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
             { href: 'controle-manuel', label: 'Contrôle manuel', icon: Voicemail },
             { href: 'vocaux-ia', label: 'IA Vocaux', icon: Mic, isPremium: true },
        ]
    },
     {
        name: 'Outils IA',
        items: [
            { href: 'constructeur-serveur-ia', label: 'Server Builder IA', icon: ToyBrick, isPremium: true },
            { href: 'assistant-moderation-ia', label: 'Assistant Modération IA', icon: Sparkles, isPremium: true },
            { href: 'formation-moderateur-ia', label: 'Formation Modérateur IA', icon: GraduationCap, isPremium: true },
            { href: 'createur-contenu-ia', label: 'Créateur de Contenu IA', icon: Palette, isPremium: true },
            { href: 'agent-conversationnel', label: 'Agent Conversationnel', icon: MessageCircleQuestion, isPremium: true },
        ]
    }
];

function SidebarHeaderSkeleton() {
    return (
        <div className="mb-6 flex items-center gap-3 px-2">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20" />
            </div>
        </div>
    );
}


export function ModuleSidebar({ serverId: serverIdProp }: { serverId: string }) {
  const pathname = usePathname();
  const params = useParams();
  const serverId = (params.serverId || serverIdProp) as string;

  const { serverInfo, loading } = useServerInfo();


  return (
    <aside className="flex h-full w-72 flex-col bg-card p-4">
      {loading ? (
        <SidebarHeaderSkeleton />
      ) : serverInfo ? (
        <div className="mb-6 flex items-center gap-3 px-2">
            <Avatar className="h-12 w-12 rounded-lg">
            {serverInfo.icon ? (
                <AvatarImage src={serverInfo.icon} />
            ) : (
                <AvatarFallback>{serverInfo.name.charAt(0)}</AvatarFallback>
            )}
            </Avatar>
            <div>
            <h2 className="font-semibold text-white">{serverInfo.name}</h2>
            {serverInfo.isPremium && <Badge className="mt-1 border-0 bg-yellow-500 text-black">Premium</Badge>}
            </div>
        </div>
      ) : (
         <SidebarHeaderSkeleton /> // Show skeleton on error or if no details
      )}
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        {navCategories.map((category) => (
            <div key={category.name}>
                <h3 className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">{category.name}</h3>
                <div className="flex flex-col gap-1">
                    {category.items.map((item) => {
                      const fullPath = serverId ? `/dashboard/${serverId}/${item.href}` : '#';
                      const isActive = pathname === fullPath;
                      return (
                        <Link key={item.label} href={fullPath} className={!serverId ? 'pointer-events-none' : ''}>
                           <Button
                             variant={isActive ? 'secondary' : 'ghost'}
                             className={cn('w-full justify-start gap-3', { 'bg-secondary text-white': isActive, 'text-muted-foreground hover:text-white': !isActive})}
                             disabled={!serverId}
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
