'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const mockRoles = [
  { id: 'r1', name: '@everyone' },
  { id: 'r2', name: 'Modérateur' },
  { id: 'r3', name: 'Admin' },
  { id: 'r4', name: 'Membre' },
];

const eventCommands = [
  {
    name: '/event-create',
    description: 'Crée un nouvel événement sur le serveur.',
    defaultRole: 'Modérateur',
  },
  {
    name: '/event-list',
    description: 'Affiche la liste des événements à venir.',
    defaultRole: '@everyone',
  },
];

export default function EventsPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Événements & Calendrier IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Planifiez des événements en vous basant sur des cartes d'activité, avec des modèles et des rappels.
        </p>
      </div>

      <Separator />

      {/* Section Options */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Options des Événements</h2>
          <p className="text-muted-foreground">
            Configurez les fonctionnalités intelligentes de planification d'événements.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="suggest-time"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Suggérer l'heure de l'événement
              </Label>
              <p className="text-sm text-muted-foreground/80">
                Suggérer automatiquement les heures optimales lors de la création d'un événement.
              </p>
            </div>
            <Switch id="suggest-time" defaultChecked />
          </div>
          <Separator />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
            <div>
              <Label
                htmlFor="event-templates"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Modèles d'événements
              </Label>
               <p className="text-sm text-muted-foreground/80">
                Activer les modèles prédéfinis pour créer des événements rapidement.
              </p>
            </div>
            <Select defaultValue="quiz">
              <SelectTrigger id="event-templates" className="w-full md:w-[280px]">
                <SelectValue placeholder="Sélectionner un modèle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="tournament">Tournoi</SelectItem>
                <SelectItem value="movie-night">Soirée Film</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
           <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="rsvp-tracking"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Suivi des participations (RSVP)
              </Label>
              <p className="text-sm text-muted-foreground/80">
                Activer le suivi, les rappels et l'attribution de rôles pour les participants.
              </p>
            </div>
            <Switch id="rsvp-tracking" defaultChecked />
          </div>
           <Separator />
           <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="recurring-events"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Événements récurrents
              </Label>
              <p className="text-sm text-muted-foreground/80">
                Activer les options de récurrence pour les événements.
              </p>
            </div>
            <Switch id="recurring-events" />
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
          {eventCommands.map((command) => (
            <Card key={command.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
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