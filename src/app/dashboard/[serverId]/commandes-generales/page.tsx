'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Wrench } from 'lucide-react';

const mockRoles = [
  { id: 'r1', name: '@everyone', color: '#ffffff' },
  { id: 'r2', name: 'Modérateur', color: '#3498db' },
  { id: 'r3', name: 'Admin', color: '#e74c3c' },
  { id: 'r4', name: 'Membre', color: '#2ecc71' },
];

const generalCommands = [
    {
        name: '/invite',
        description: 'Génère un lien d\'invitation pour le bot.',
        defaultRole: '@everyone'
    },
    {
        name: '/ping',
        description: 'Vérifie la latence du bot.',
        defaultRole: '@everyone'
    },
];

export default function GeneralCommandsPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commandes Générales</h1>
        <p className="text-muted-foreground mt-2">
          Activer, désactiver et configurer les permissions des commandes générales.
        </p>
      </div>
      
      <Separator />

      {/* Section Commandes */}
       <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Commandes</h2>
          <p className="text-muted-foreground">
            Gérez la disponibilité et les permissions pour chaque commande de ce module.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generalCommands.map(command => (
                 <Card key={command.name}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-primary" />
                                <span>{command.name}</span>
                            </div>
                            <Switch defaultChecked/>
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
    </div>
  );
}
