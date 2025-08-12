'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Trash2, PlusCircle, Gamepad2, BrainCircuit, Music } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select';

const mockVoiceChannels = [
    { id: 'v1', name: 'Général' },
    { id: 'v2', name: 'Gaming 1' },
    { id: 'v3', name: 'Chill' },
    { id: 'v4', name: 'AFK' },
];

const mockInteractiveChannels = [
    { id: 'v2', name: 'Gaming 1', theme: 'gaming'},
    { id: 'v3', name: 'Chill', theme: 'social'},
]

export default function SmartVoicePage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            IA Vocaux
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
            <Badge variant="secondary">1 salon gratuit</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
            L'IA gère les salons vocaux : elle génère un nom et une bio de salon en fonction de l'activité des membres.
        </p>
      </div>

      <Separator />

      {/* Section Options */}
      <Card>
        <CardHeader>
            <h2 className="text-xl font-bold">Options Générales</h2>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                <Label htmlFor="creation-threshold" className="font-bold text-sm uppercase text-muted-foreground">Seuil de création automatique</Label>
                 <p className="text-sm text-muted-foreground/80">
                    Nombre d'utilisateurs dans un salon pour créer automatiquement un nouveau salon vocal thématique.
                </p>
                <Input id="creation-threshold" type="number" defaultValue={4} className="w-full md:w-[120px]" />
            </div>
        </CardContent>
      </Card>
      
      <Separator />

      {/* Section Salons Interactifs */}
      <div className="space-y-4">
        <div>
            <h2 className="text-xl font-bold">Salons Interactifs</h2>
            <p className="text-muted-foreground">
                Configurez ici les salons vocaux qui seront gérés par l'IA.
            </p>
        </div>
        <Card>
            <CardContent className="pt-6 space-y-4">
                {mockInteractiveChannels.map(channel => (
                    <div key={channel.id} className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg bg-card-foreground/5">
                        <div className="flex-1 w-full">
                            <Label>Salon Vocal</Label>
                             <Select defaultValue={channel.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un salon..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Salons vocaux</SelectLabel>
                                        {mockVoiceChannels.map(vc => (
                                            <SelectItem key={vc.id} value={vc.id}>{vc.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="flex-1 w-full">
                            <Label>Thème IA</Label>
                            <Select defaultValue={channel.theme}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un thème..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gaming"><Gamepad2 className="mr-2"/> Gaming</SelectItem>
                                    <SelectItem value="social"><BrainCircuit className="mr-2"/> Social & Discussion</SelectItem>
                                    <SelectItem value="music"><Music className="mr-2"/> Musique</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="ghost" size="icon" className="self-end">
                            <Trash2 className="w-5 h-5 text-destructive"/>
                        </Button>
                    </div>
                ))}
                 <Button variant="default" className="w-full mt-4">
                    <PlusCircle className="mr-2" />
                    Ajouter un salon interactif
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}