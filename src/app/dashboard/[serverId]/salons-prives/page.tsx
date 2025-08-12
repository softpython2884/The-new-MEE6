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
  SelectLabel,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Ticket, MessageSquare } from 'lucide-react';

const mockChannels = [
  { id: 'c1', name: 'general' },
  { id: 'c2', name: 'bienvenue' },
  { id: 'c3', name: 'tickets' },
  { id: 'c4', name: 'aide' },
];

const mockCategories = [
  { id: 'cat1', name: 'Salons textuels' },
  { id: 'cat2', name: 'Support Tickets' },
  { id: 'cat3', name: 'Salons vocaux' },
];

const mockRoles = [
  { id: 'r1', name: '@everyone' },
  { id: 'r2', name: 'Modérateur' },
  { id: 'r3', name: 'Admin' },
  { id: 'r4', name: 'Membre' },
];

const privateRoomCommands = [
  {
    name: '/addprivate',
    description: 'Envoie le panneau de création de salon privé.',
    defaultRole: 'Admin',
  },
  {
    name: '/privateresum',
    description: "Génère un résumé IA d'un salon avant son archivage.",
    defaultRole: 'Modérateur',
  },
];

export default function PrivateRoomsPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Salons Privés</h1>
        <p className="text-muted-foreground mt-2">
          Configurez le système de création de salons privés pour les tickets ou
          les groupes.
        </p>
      </div>

      <Separator />

      {/* Section Options */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Options des Salons Privés</h2>
          <p className="text-muted-foreground">
            Personnalisez le fonctionnement de la création de salons.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
            <div>
              <Label
                htmlFor="creation-channel"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Salon de création
              </Label>
              <p className="text-sm text-muted-foreground/80">
                Salon où poster le message permettant de créer un salon privé.
              </p>
            </div>
            <Select defaultValue="c3">
              <SelectTrigger
                id="creation-channel"
                className="w-full md:w-[280px]"
              >
                <SelectValue placeholder="Sélectionner un salon" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Salons textuels</SelectLabel>
                  {mockChannels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      # {channel.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
            <div>
              <Label
                htmlFor="private-category"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Catégorie des salons
              </Label>
              <p className="text-sm text-muted-foreground/80">
                Catégorie où les nouveaux salons privés seront créés.
              </p>
            </div>
            <Select defaultValue="cat2">
              <SelectTrigger
                id="private-category"
                className="w-full md:w-[280px]"
              >
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Catégories</SelectLabel>
                  {mockCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label
              htmlFor="embed-message"
              className="font-bold text-sm uppercase text-muted-foreground"
            >
              Message de l'embed
            </Label>
            <p className="text-sm text-muted-foreground/80">
              Le texte à afficher dans l'embed de création de ticket.
            </p>
            <Textarea
              id="embed-message"
              placeholder="Cliquez sur le bouton pour créer un nouveau ticket..."
              rows={4}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="enable-ai-summary"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Résumé IA pour l'archivage
              </Label>
              <p className="text-sm text-muted-foreground/80">
                Générer un résumé par l'IA lors de l'archivage d'un salon.
              </p>
            </div>
            <Switch id="enable-ai-summary" defaultChecked />
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
          {privateRoomCommands.map((command) => (
            <Card key={command.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
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