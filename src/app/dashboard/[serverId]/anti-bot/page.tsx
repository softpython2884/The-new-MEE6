'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const mockChannels = [
  { id: 'c1', name: 'general' },
  { id: 'c2', name: 'annonces' },
  { id: 'c3', name: 'logs' },
  { id: 'c4', name: 'bot-approval' },
];

export default function AntiBotPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Anti-Bot</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les règles d’ajout de bots sur le serveur pour renforcer la sécurité.
        </p>
      </div>
      
      <Separator />

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Options</h2>
          <p className="text-muted-foreground">
            Personnalisez le comportement du module Anti-Bot.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                <div>
                  <Label htmlFor="mode" className="font-bold text-sm uppercase text-muted-foreground">Mode de fonctionnement</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Choisissez comment le bot doit réagir à l'ajout de nouveaux bots.
                  </p>
                </div>
                 <Select defaultValue="disabled">
                    <SelectTrigger id="mode" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="disabled">Désactivé</SelectItem>
                        <SelectItem value="auto-block">Blocage automatique</SelectItem>
                        <SelectItem value="approval-required">Approbation requise</SelectItem>
                        <SelectItem value="whitelist-only">Liste blanche seulement</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Separator/>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                <div>
                  <Label htmlFor="approval-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon d'approbation</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Requis si le mode "Approbation requise" est actif.
                  </p>
                </div>
                 <Select defaultValue="c4">
                    <SelectTrigger id="approval-channel" className="w-full md:w-[280px]">
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
            <Separator/>
            <div className="space-y-2">
                <Label htmlFor="whitelist" className="font-bold text-sm uppercase text-muted-foreground">Liste blanche de bots (IDs)</Label>
                 <p className="text-sm text-muted-foreground/80">
                    Les bots listés ici seront toujours autorisés, quel que soit le mode. Séparez les IDs par une virgule.
                </p>
                <Textarea id="whitelist" placeholder="789012345678901234,987654321098765432..." rows={3} />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
