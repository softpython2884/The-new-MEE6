
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
import { ToyBrick } from 'lucide-react';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const mockRoles = [
  { id: 'r1', name: '@everyone' },
  { id: 'r2', name: 'Modérateur' },
  { id: 'r3', name: 'Admin' },
];

const builderCommands = [
  {
    name: '/iacreateserv',
    description: 'Génère une structure de serveur complète.',
    defaultRole: 'Admin',
  },
  {
    name: '/iaeditserv',
    description: 'Modifie la structure du serveur.',
    defaultRole: 'Admin',
  },
   {
    name: '/iadeleteserv',
    description: 'Supprime des éléments du serveur.',
    defaultRole: 'Admin',
  },
   {
    name: '/iaresetserv',
    description: 'Réinitialise la structure du serveur.',
    defaultRole: 'Admin',
  },
];


function ServerBuilderPageContent({ isPremium }: { isPremium: boolean }) {
    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <div className="space-y-8">
            {/* Section Options */}
            <Card>
                <CardHeader>
                <h2 className="text-xl font-bold">Options du Constructeur</h2>
                <p className="text-muted-foreground">
                    Définissez les paramètres de base pour la génération de la structure du serveur.
                </p>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                    <Label
                        htmlFor="theme"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Thème de base
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                        L'IA utilisera ce thème comme point de départ.
                    </p>
                    </div>
                    <Select defaultValue="gaming">
                    <SelectTrigger id="theme" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un thème" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="pro">Professionnel</SelectItem>
                        <SelectItem value="rp">Roleplay</SelectItem>
                        <SelectItem value="community">Communauté</SelectItem>
                        <SelectItem value="stream">Streaming</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <Separator />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                    <Label
                        htmlFor="detail-level"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Niveau de détail
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                        Définit la complexité de la structure à générer.
                    </p>
                    </div>
                    <Select defaultValue="standard">
                    <SelectTrigger id="detail-level" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="full">Complet</SelectItem>
                    </SelectContent>
                    </Select>
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
                {builderCommands.map((command) => (
                    <Card key={command.name}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                        <ToyBrick className="w-5 h-5 text-primary" />
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
        </PremiumFeatureWrapper>
    );
}

export default function ServerBuilderPage() {
    const { serverInfo, loading } = useServerInfo();
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Constructeur de Serveur IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Utilisez l'IA pour créer, éditer ou réinitialiser la structure de votre serveur.
        </p>
      </div>

      <Separator />

      {loading ? (
        <Skeleton className="w-full h-[500px]" />
      ) : (
        <ServerBuilderPageContent isPremium={serverInfo?.isPremium || false} />
      )}
    </div>
  );
}
