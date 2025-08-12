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
import { Textarea } from '@/components/ui/textarea';
import { Palette } from 'lucide-react';

const mockRoles = [
  { id: 'r1', name: '@everyone' },
  { id: 'r2', name: 'Modérateur' },
  { id: 'r3', name: 'Admin' },
];

const contentCommand = {
    name: '/iacontent',
    description: 'Rédige des règles, annonces et génère des images avec l\'IA.',
    defaultRole: 'Admin'
};

export default function AiContentCreatorPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Créateur de Contenu IA</h1>
        <p className="text-muted-foreground mt-2">
          Générez des annonces, des règles ou des images directement avec l'IA.
        </p>
      </div>

      <Separator />

      {/* Section Options */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Options du Créateur</h2>
          <p className="text-muted-foreground">
            Définissez le ton et les instructions par défaut pour la génération de contenu.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
            <div>
              <Label
                htmlFor="default-tone"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Ton par défaut
              </Label>
            </div>
            <Select defaultValue="familiar">
              <SelectTrigger id="default-tone" className="w-full md:w-[280px]">
                <SelectValue placeholder="Sélectionner un ton" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="familiar">Familier</SelectItem>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="narrative">Narratif (RP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label
              htmlFor="custom-tone"
              className="font-bold text-sm uppercase text-muted-foreground"
            >
              Instructions de ton personnalisé
            </Label>
            <p className="text-sm text-muted-foreground/80">
              Décrivez ici le ton personnalisé que l'IA doit adopter.
            </p>
            <Textarea
              id="custom-tone"
              placeholder="Adopte un ton humoristique et utilise beaucoup d'emojis..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section Commandes */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Commandes</h2>
          <p className="text-muted-foreground">
            Gérez la permission pour la commande de ce module.
          </p>
        </div>
        <Card key={contentCommand.name}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <span>{contentCommand.name}</span>
            </CardTitle>
            <CardDescription>{contentCommand.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label
                htmlFor={`role-select-${contentCommand.name}`}
                className="text-sm font-medium"
              >
                Rôle minimum requis
              </Label>
              <Select
                defaultValue={
                  mockRoles.find((r) => r.name === contentCommand.defaultRole)?.id
                }
              >
                <SelectTrigger id={`role-select-${contentCommand.name}`} className="w-full">
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
      </div>
    </div>
  );
}
