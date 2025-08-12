'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Shield } from 'lucide-react';

// Données fictives pour les salons et les rôles. Celles-ci seront remplacées par des données réelles plus tard.
const mockChannels = [
  { id: 'c1', name: 'general' },
  { id: 'c2', name: 'annonces' },
  { id: 'c3', name: 'logs' },
  { id: 'c4', name: 'modération-logs' },
];

const mockRoles = [
  { id: 'r1', name: '@everyone', color: '#ffffff' },
  { id: 'r2', name: 'Modérateur', color: '#3498db' },
  { id: 'r3', name: 'Admin', color: '#e74c3c' },
  { id: 'r4', name: 'Membre', color: '#2ecc71' },
];

const moderationCommands = [
    {
        name: '/ban',
        description: 'Bannit un utilisateur du serveur.',
        defaultRole: 'Admin'
    },
    {
        name: '/unban',
        description: "Révoque le bannissement d'un utilisateur.",
        defaultRole: 'Admin'
    },
    {
        name: '/kick',
        description: 'Expulse un utilisateur du serveur.',
        defaultRole: 'Modérateur'
    },
    {
        name: '/mute',
        description: 'Rend un utilisateur muet (timeout).',
        defaultRole: 'Modérateur'
    },
];

export default function ModerationPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bans & Kicks</h1>
        <p className="text-muted-foreground mt-2">
            Gérer les sanctions des utilisateurs (ban, kick, mute).
        </p>
      </div>
      
      <Separator />

      {/* Section Options */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Options</h2>
          <p className="text-muted-foreground">
            Personnalisez le comportement des actions de modération.
          </p>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
               <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="log-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon de logs</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Le salon où envoyer les logs de modération.
                  </p>
                </div>
                 <Select defaultValue="c4">
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
              <Separator/>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dm-sanction" className="font-bold text-sm uppercase text-muted-foreground">Notifier l'utilisateur en DM</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Envoyer un message privé à l'utilisateur lorsqu'une sanction est appliquée.
                  </p>
                </div>
                <Switch id="dm-sanction" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Separator />

      {/* Section Commandes */}
       <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Commandes</h2>
          <p className="text-muted-foreground">
            Gérez les permissions pour chaque commande de ce module.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moderationCommands.map(command => (
                 <Card key={command.name}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <span>{command.name}</span>
                        </CardTitle>
                        <CardDescription>{command.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                             <Label htmlFor={`role-select-${command.name}`} className="text-sm font-medium">Rôle minimum requis</Label>
                            <Select defaultValue={mockRoles.find(r => r.name === command.defaultRole)?.id}>
                                <SelectTrigger id={`role-select-${command.name}`} className="w-full">
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {mockRoles.map(role => (
                                            <SelectItem key={role.id} value={role.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></span>
                                                    {role.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>


      <Separator />

      {/* Section Sanctions prédéfinies */}
      <div className="space-y-4">
        <div>
            <h2 className="text-xl font-bold">Sanctions prédéfinies</h2>
            <p className="text-muted-foreground">
                Configurez des sanctions prédéfinies afin de faciliter et de réglementer les sanctions applicables par vos modérateurs.
            </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">Vous n'avez créé aucune sanction prédéfinie.</p>
            <Button variant="default">Créer une sanction prédéfinie</Button>
        </div>
      </div>
    </div>
  );
}
