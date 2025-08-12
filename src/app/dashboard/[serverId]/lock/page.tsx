
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Lock, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const mockRoles = [
  { id: 'r1', name: '@everyone' },
  { id: 'r2', name: 'Modérateur' },
  { id: 'r3', name: 'Admin' },
  { id: 'r4', name: 'Membre' },
  { id: 'r5', name: 'VIP' },
  { id: 'r6', name: 'Partenaire' },
  { id: 'r7', name: 'Testeur' },
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['r5']); // VIP is selected by default

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const getRoleName = (roleId: string) => mockRoles.find(r => r.id === roleId)?.name || '';

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
                <Label htmlFor="exempt-roles" className="font-bold text-sm uppercase text-muted-foreground">Rôles exemptés du verrouillage</Label>
                <p className="text-sm text-muted-foreground/80">
                    Les utilisateurs avec ces rôles pourront toujours parler dans les salons verrouillés.
                </p>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                           <div className="flex-1 text-left truncate">
                                {selectedRoles.length > 0 
                                    ? selectedRoles.map(id => (
                                        <Badge key={id} variant="secondary" className="mr-1 mb-1">{getRoleName(id)}</Badge>
                                    ))
                                    : "Sélectionner des rôles..."}
                            </div>
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        <DropdownMenuLabel>Choisir les rôles</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {mockRoles.map(role => (
                             <DropdownMenuCheckboxItem
                                key={role.id}
                                checked={selectedRoles.includes(role.id)}
                                onCheckedChange={() => handleRoleToggle(role.id)}
                                onSelect={(e) => e.preventDefault()} // Prevent closing menu on select
                             >
                                {role.name}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
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
