
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';


const mockChannels = [
  { id: 'c1', name: 'general' },
  { id: 'c2', name: 'annonces' },
  { id: 'c3', name: 'international-chat' },
  { id: 'c4', name: 'dev-talk' },
];

function AutoTranslatePageContent({ isPremium }: { isPremium: boolean }) {
    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-bold">Options de Traduction</h2>
                    <p className="text-muted-foreground">
                        Activez et configurez le module de traduction automatique.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-translation" className="font-bold text-sm uppercase text-muted-foreground">Activer la traduction</Label>
                            <p className="text-sm text-muted-foreground/80">
                                Active ou désactive complètement le module.
                            </p>
                        </div>
                        <Switch id="enable-translation" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                        <Label htmlFor="translation-mode" className="font-bold text-sm uppercase text-muted-foreground">Mode de traduction</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Choisissez comment les traductions sont affichées.
                        </p>
                        </div>
                        <Select defaultValue="inline">
                            <SelectTrigger className="w-[240px]">
                                <SelectValue placeholder="Sélectionner un mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="inline">En ligne (sous le message original)</SelectItem>
                                <SelectItem value="replace">Remplacement (traduit directement)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator/>
                    <div className="flex items-center justify-between">
                        <div>
                        <Label htmlFor="translation-channels" className="font-bold text-sm uppercase text-muted-foreground">Salons de traduction</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Salons où la traduction sera active (multi-sélection à venir).
                        </p>
                        </div>
                        <Select defaultValue="c3">
                            <SelectTrigger className="w-[240px]">
                                <SelectValue placeholder="Sélectionner un salon" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Salons textuels</SelectLabel>
                                    {mockChannels.map(channel => (
                                        <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </PremiumFeatureWrapper>
    )
}

export default function AutoTranslatePage() {
    const { serverInfo, loading } = useServerInfo();
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-4">
            Traduction Automatique <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
            Traduisez les messages en temps réel dans plusieurs langues pour unifier votre communauté.
        </p>
      </div>
      
      <Separator />

      {loading ? (
            <Skeleton className="h-72 w-full" />
        ) : (
            <AutoTranslatePageContent isPremium={serverInfo?.isPremium || false} />
        )}
    </div>
  );
}
