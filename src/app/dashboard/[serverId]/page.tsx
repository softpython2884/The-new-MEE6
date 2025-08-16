'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RotatingText from '@/components/ui/rotating-text';
import { useServerInfo } from '@/hooks/use-server-info';
import { Bot, Hammer, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ServerDashboardPage() {
  const { serverInfo, loading } = useServerInfo();

  const welcomeText = loading
    ? 'Chargement...'
    : serverInfo
      ? `Bienvenue sur le panel de ${serverInfo.name}`
      : 'Bienvenue sur votre panel';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white">{welcomeText}</h1>
        <div className="text-muted-foreground mt-2 text-lg flex items-center gap-1.5">
          <span>Marcus est prêt à</span>
          <RotatingText 
            texts={["modérer.", "automatiser.", "sécuriser.", "innover.", "animer."]}
            elementLevelClassName='text-primary font-semibold'
            mainClassName='text-lg'
            staggerDuration={0.02}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors">
          <Link href="moderation">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="rounded-lg bg-primary/10 p-3">
                <Hammer className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Modération</CardTitle>
                <CardDescription>Bans, kicks, et mutes.</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
           <Link href="auto-moderation">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
               <div className="rounded-lg bg-primary/10 p-3">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Auto-Modération</CardTitle>
                <CardDescription>Règles natives de Discord.</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>
         <Card className="hover:border-primary/50 transition-colors">
           <Link href="personnages-ia">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
               <div className="rounded-lg bg-primary/10 p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Personnages IA</CardTitle>
                <CardDescription>Créez des IA uniques.</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>
       <div className="pt-8">
        <h2 className="text-2xl font-semibold tracking-tight">À Propos de Marcus</h2>
        <p className="mt-2 text-muted-foreground">
          Marcus est une solution complète conçue pour simplifier et améliorer la gestion de votre serveur Discord. Combinant un bot puissant et un panel de configuration web moderne, Marcus intègre des fonctionnalités IA de pointe pour offrir une expérience de gestion inégalée. Explorez les modules via la barre latérale pour configurer chaque aspect du bot.
        </p>
      </div>
    </div>
  );
}
