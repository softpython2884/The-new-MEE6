
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import { ToyBrick } from 'lucide-react';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GlobalAiStatusAlert } from '@/components/global-ai-status-alert';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface ServerBuilderConfig {
    enabled: boolean;
    premium: boolean;
    command_permissions: { [key: string]: string | null };
}
interface DiscordRole {
    id: string;
    name: string;
}

const builderCommands = [
  {
    name: '/iacreateserv',
    key: 'iacreateserv',
    description: 'Génère une structure de serveur complète.',
  },
  {
    name: '/iaeditserv',
    key: 'iaeditserv',
    description: 'Modifie la structure du serveur.',
  },
   {
    name: '/iadeleteserv',
    key: 'iadeleteserv',
    description: 'Supprime des éléments du serveur.',
  },
   {
    name: '/iaresetserv',
    key: 'iaresetserv',
    description: 'Réinitialise la structure du serveur.',
  },
];

function ServerBuilderPageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<ServerBuilderConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/server-builder`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                
                setConfig(configData);
                setRoles(serverDetailsData.roles);
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: ServerBuilderConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/server-builder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof ServerBuilderConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        handleValueChange('command_permissions', newPermissions);
    };

    if (loading || !config) {
        return <Skeleton className="w-full h-[500px]" />;
    }

    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <div className="space-y-8">
            <GlobalAiStatusAlert />
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Options du Constructeur</h2>
                            <p className="text-muted-foreground">
                                Activez ou désactivez le module et gérez ses permissions.
                            </p>
                        </div>
                        <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                </CardHeader>
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
                    <Card key={command.key}>
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
                            htmlFor={`role-select-${command.key}`}
                            className="text-sm font-medium"
                        >
                            Rôle minimum requis
                        </Label>
                        <Select
                            value={config.command_permissions?.[command.key] || 'none'}
                            onValueChange={(value) => handlePermissionChange(command.key, value)}
                        >
                            <SelectTrigger id={`role-select-${command.key}`} className="w-full">
                            <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectGroup>
                                <SelectItem value="none">Admin seulement</SelectItem>
                                {roles.filter(r => r.name !== '@everyone').map((role) => (
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
