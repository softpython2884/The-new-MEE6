'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lock } from 'lucide-react';

const mockRoles = [
  { id: 'r1', name: '@everyone' },
  { id: 'r2', name: 'Modérateur' },
  { id: 'r3', name: 'Admin' },
  { id: 'r4', name: 'Membre' },
  { id: 'r5', name: 'VIP' },
];

const lockCommands = [
    {
        name: '/lock',
        description: 'Verrouille un salon pour le rôle @everyone.',
        defaultRole: 'Modérateur'
    },
    {
        name: '/unlock',
        description: 'Déverrouille un salon précédemment verrouillé.',
        defaultRole: 'Modérateur'
    },
];

export default function LockPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lock/Unlock</h1>
        <p className="text-muted-foreground mt-2">
          Verrouille ou déverrouille un salon. Les permissions exactes d'avant le verrouillage sont restaurées.
        </p>
      </div>
      
      <Separator />

      {/* Section Options */}
      <Card>
        <CardHeader>
            <h2 className="text-xl font-bold">Options de Verrouillage</h2>
            <p className="text-muted-foreground">
                Configurez les rôles qui ne seront pas affectés par la commande /lock.
            </p>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                <Label htmlFor="exempt-roles" className="font-bold text-sm uppercase text-muted-foreground">Rôles exemptés du verrouillage (IDs)</Label>
                <p className="text-sm text-muted-foreground/80">
                    Les utilisateurs avec ces rôles ne seront pas affectés. Entrez les IDs de rôles, séparés par une virgule.
                </p>
                <Textarea id="exempt-roles" placeholder="Ex: 86383348842...
, 92149...
" />
            </div>
        </CardContent>
      </Card>
      
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
            {lockCommands.map(command => (
                 <Card key={command.name}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
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
                                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
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