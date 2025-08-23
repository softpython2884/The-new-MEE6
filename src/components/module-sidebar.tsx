
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
  MessageCircleQuestion,
  Lightbulb,
  Users,
  UserSquare,
  BadgePlus,
  ShieldAlert,
  TestTubeDiagonal,
  X,
  UserPlus,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { useServerInfo } from '@/hooks/use-server-info';
import GradientText from './ui/gradient-text';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

const navCategories = [
    {
        name: 'Général',
        items: [
            { href: 'commandes-generales', label: 'Commandes Générales', icon: Wrench },
            { href: 'identite', label: 'Identité du Bot', icon: UserSquare },
            { href: 'annonces', label: 'Annonces', icon: Megaphone },
            { href: 'assistant-communautaire', label: 'Assistant Communautaire', icon: MessageSquare, isPremium: true },
            { href: 'suggestions', label: 'Suggestions', icon: Lightbulb },
            { href: 'traduction-automatique', label: 'Traduction Auto', icon: Languages },
        ]
    },
    {
        name: 'Modération',
        items: [
            { href: 'moderation', label: 'Bans & Kicks', icon: Hammer },
            { href: 'auto-moderation', label: 'Auto-Modération', icon: Bot },
            { href: 'lock', label: 'Lock/Unlock', icon: Lock },
            { href: 'logs', label: 'Logs', icon: FileClock },
        ]
    },
    {
        name: 'Sécurité',
        items: [
            { href: 'anti-bot', label: 'Anti-Bot', icon: ShieldCheck },
            { href: 'filtre-image-ia', label: 'Filtre d\'Image IA', icon: ScanSearch, isPremium: true },
            { href: 'anti-raid', label: 'Anti-Raid & Liens', icon: Fingerprint, isPremium: true },
            { href: 'captcha', label: 'Captcha', icon: Fingerprint, isPremium: true },
            { href: 'backup', label: 'Backup', icon: DatabaseBackup },
            { href: 'securite-avancee', label: 'Sécurité Avancée', icon: ShieldAlert },
        ]
    },
    {
        name: 'Automatisation',
        items: [
            { href: 'salons-prives', label: 'Salons Privés', icon: Ticket },
            { href: 'evenements', label: 'Événements & Calendrier', icon: Calendar, isPremium: true },
            { href: 'autoroles', label: 'Autoroles', icon: BadgePlus },
            { href: 'accueil-integration', label: 'Accueil & Intégration', icon: UserPlus },
        ]
    },
    {
        name: 'Vocaux',
        items: [
             { href: 'controle-manuel', label: 'Contrôle manuel', icon: Voicemail },
             { href: 'vocaux-ia', label: 'IA Vocaux', icon: Mic, isPremium: true },
             { href: 'webcam-control', label: 'Contrôle Vidéo', icon: Camera },
        ]
    },
     {
        name: 'Outils IA',
        items: [
            { href: 'constructeur-serveur-ia', label: 'Server Builder IA', icon: ToyBrick, isPremium: true },
            { href: 'assistant-moderation-ia', label: 'Assistant Modération IA', icon: Sparkles, isPremium: true },
            { href: 'createur-contenu-ia', label: 'Créateur de Contenu IA', icon: Palette, isPremium: true },
            { href: 'agent-conversationnel', label: 'Agent Conversationnel', icon: MessageCircleQuestion, isPremium: true },
            { href: 'personnages-ia', label: 'Personnages IA', icon: Users, isPremium: true },
            { href: 'commandes-testeurs', label: 'Commandes Testeurs', icon: TestTubeDiagonal, isPremium: true },
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


export function ModuleSidebar({ serverId: serverIdProp, isOpen, setOpen }: { serverId: string, isOpen: boolean, setOpen: (isOpen: boolean) => void }) {
  const pathname = usePathname();
  const params = useParams();
  const serverId = (params.serverId || serverIdProp) as string;

  const { serverInfo, loading } = useServerInfo();
  
  useEffect(() => {
    // Close sidebar on route change on mobile
    setOpen(false);
  }, [pathname, setOpen]);


  return (
    <>
    {/* Overlay for mobile */}
    {isOpen && <div className="fixed inset-0 z-20 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}

    <aside className={cn(
        "fixed md:relative inset-y-0 left-0 z-30 flex h-full w-72 flex-col bg-card/80 backdrop-blur-xl p-4 border-r border-border/10 transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 px-2">
            {loading ? (
            <SidebarHeaderSkeleton />
            ) : serverInfo ? (
            <>
                <Avatar className="h-12 w-12 rounded-lg">
                {serverInfo.icon ? (
                    <AvatarImage src={serverInfo.icon} />
                ) : (
                    <AvatarFallback>{serverInfo.name.charAt(0)}</AvatarFallback>
                )}
                </Avatar>
                <div>
                <GradientText className="text-lg font-semibold">{serverInfo.name}</GradientText>
                {serverInfo.isPremium && <Badge className="mt-1 border-0 bg-yellow-500 text-black">Premium</Badge>}
                </div>
            </>
            ) : (
            <SidebarHeaderSkeleton /> // Show skeleton on error or if no details
            )}
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-6 w-6" />
        </Button>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 no-scrollbar">
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
      <div className="mt-auto pt-4 text-center">
          <a href="https://forgenet.fr" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-white transition-colors">
              Développé par NightForge
          </a>
      </div>
    </aside>
    </>
  );
}
