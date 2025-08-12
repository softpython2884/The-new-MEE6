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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select';
import { Voicemail } from 'lucide-react';

const mockRoles = [
  { id: 'r1', name: '@everyone' },
  { id: 'r2', name: 'Modérateur' },
  { id: 'r3', name: 'Admin' },
  { id: 'r4', name: 'Animateur' },
];

const manualVoiceCommands = [
  {
    name: '/join',
    description: 'Fait rejoindre le bot dans votre salon vocal.',
    defaultRole: 'Animateur',
  },
  {
    name: '/leave',
    description: 'Fait quitter le bot de son salon vocal.',
    defaultRole: 'Animateur',
  },
];

export default function ManualControlPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contrôle Manuel (Vocal)</h1>
        <p className="text-muted-foreground mt-2">
          Invitez ou déconnectez manuellement le bot des salons vocaux.
        </p>
      </div>

      <Separator />

      {/* Section Commandes */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Commandes</h2>
          <p className="text-muted-foreground">
            Gérez les permissions pour chaque commande de ce module. Ce module n'a pas d'autres options.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {manualVoiceCommands.map((command) => (
            <Card key={command.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Voicemail className="w-5 h-5 text-primary" />
                  <span>{command.name}</span>
                </CardTitle>
                <CardDescription>{command.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label
                    htmlFor={`role-select-${command.name}`}
                    className="text-sm font-medium"
                  >
                    Rôle minimum requis
                  </Label>
                  <Select
                    defaultValue={
                      mockRoles.find((r) => r.name === command.defaultRole)?.id
                    }
                  >
                    <SelectTrigger id={`role-select-${command.name}`} className="w-full">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {mockRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
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