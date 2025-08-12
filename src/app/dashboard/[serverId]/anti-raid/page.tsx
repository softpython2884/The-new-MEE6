'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const mockChannels = [
  { id: 'c1', name: 'general' },
  { id: 'c2', name: 'annonces' },
  { id: 'c3', name: 'logs' },
  { id: 'c4', name: 'modération-logs' },
  { id: 'c5', name: 'security-alerts' },
];

export default function AntiRaidPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Anti-Raid & Scanner de Liens
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
            Détectez les raids et les liens malveillants pour protéger votre serveur.
        </p>
      </div>
      
      <Separator />

      <Card>
        <CardHeader>
            <h2 className="text-xl font-bold">Options Générales</h2>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                <Label htmlFor="alert-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon d'alertes</Label>
                 <p className="text-sm text-muted-foreground/80">
                    Le salon où envoyer toutes les notifications de sécurité de ce module.
                </p>
                <Select defaultValue="c5">
                    <SelectTrigger id="alert-channel" className="w-full md:w-[280px]">
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
      
      <Separator />

      {/* Section Anti-Raid */}
      <div className="space-y-4">
        <div>
            <h2 className="text-xl font-bold">Détection de Raid</h2>
            <p className="text-muted-foreground">
                Protège le serveur contre les arrivées massives et rapides de nouveaux membres.
            </p>
        </div>
        <Card>
            <CardContent className="pt-6 space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="raid-detection" className="font-bold">Activer la détection de raid</Label>
                    </div>
                    <Switch id="raid-detection" defaultChecked />
                </div>
                <Separator />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                        <Label htmlFor="raid-sensitivity" className="font-bold text-sm uppercase text-muted-foreground">Sensibilité de détection</Label>
                    </div>
                    <Select defaultValue="medium">
                        <SelectTrigger id="raid-sensitivity" className="w-full md:w-[240px]">
                            <SelectValue placeholder="Sélectionner une sensibilité" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Basse</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Haute</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Separator />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                        <Label htmlFor="raid-action" className="font-bold text-sm uppercase text-muted-foreground">Action en cas de raid</Label>
                    </div>
                    <Select defaultValue="lockdown">
                        <SelectTrigger id="raid-action" className="w-full md:w-[240px]">
                            <SelectValue placeholder="Sélectionner une action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lockdown">Verrouillage du serveur</SelectItem>
                            <SelectItem value="kick">Expulser les nouveaux membres</SelectItem>
                            <SelectItem value="ban">Bannir les nouveaux membres</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Section Scanner de Liens */}
      <div className="space-y-4">
        <div>
            <h2 className="text-xl font-bold">Scanner de Liens</h2>
            <p className="text-muted-foreground">
                Analyse les liens envoyés sur le serveur pour détecter les menaces (phishing, malwares).
            </p>
        </div>
        <Card>
             <CardContent className="pt-6 space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="link-scanner" className="font-bold">Activer le scanner de liens</Label>
                    </div>
                    <Switch id="link-scanner" defaultChecked />
                </div>
                <Separator />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                        <Label htmlFor="link-action" className="font-bold text-sm uppercase text-muted-foreground">Action sur lien suspect</Label>
                    </div>
                    <Select defaultValue="delete">
                        <SelectTrigger id="link-action" className="w-full md:w-[240px]">
                            <SelectValue placeholder="Sélectionner une action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="warn">Avertir dans le salon</SelectItem>
                            <SelectItem value="delete">Supprimer le message</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
