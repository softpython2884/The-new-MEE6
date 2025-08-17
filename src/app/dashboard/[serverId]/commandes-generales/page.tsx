
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Wrench } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/ui/combobox';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface GeneralCommandsConfig {
  enabled: boolean;
  command_permissions: { [key: string]: string | null };
  command_enabled: { [key: string]: boolean };
}
interface DiscordRole {
    id: string;
    name: string;
    color: number;
}
interface ServerData {
    roles: DiscordRole[];
}

const generalCommands = [
    { name: '/invite', key: 'invite', description: 'Génère un lien d\'invitation pour le bot.' },
    { name: '/ping', key: 'ping', description: 'Vérifie la latence du bot.' },
    { name: '/traduire', key: 'traduire', description: 'Traduit un texte dans une langue spécifique.' },
    { name: '/say', key: 'say', description: 'Fait parler le bot dans le salon.' },
];

export default function GeneralCommandsPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<GeneralCommandsConfig | null>(null);
    const [serverData, setServerData] = useState<ServerData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/general-commands`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);

                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                
                setConfig(configData);
                setServerData(serverDetailsData);
            } catch (error) {
                console.error("Failed to fetch data", error);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les données.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: GeneralCommandsConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            const response = await fetch(`${API_URL}/update-config/${serverId}/general-commands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
            if (!response.ok) throw new Error('Failed to save config');
        } catch (error) {
            console.error('Failed to update config', error);
            toast({
                title: "Erreur de sauvegarde",
                description: "La configuration n'a pas pu être enregistrée.",
                variant: "destructive",
            });
        }
    };

    const handleValueChange = (key: string, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        saveConfig({ ...config, command_permissions: newPermissions });
    };
    
    const handleEnabledChange = (commandKey: string, enabled: boolean) => {
        if (!config) return;
        const newEnabled = { ...config.command_enabled, [commandKey]: enabled };
        saveConfig({ ...config, command_enabled: newEnabled });
    };

    if (loading || !config || !serverData) {
        return <PageSkeleton />;
    }

    const roleOptions = [
        { value: 'none', label: '@everyone' },
        ...serverData.roles.filter(r => r.name !== '@everyone').map(r => ({ value: r.id, label: r.name }))
    ];

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commandes Générales</h1>
        <p className="text-muted-foreground mt-2">
          Activer, désactiver et configurer les permissions des commandes générales.
        </p>
      </div>
      
      <Separator />

       <Card>
        <CardHeader>
          <CardTitle>Options Générales</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between">
                <div>
                    <Label htmlFor="enable-module" className="font-bold">Activer le module</Label>
                    <p className="text-sm text-muted-foreground/80">Active ou désactive toutes les commandes de ce module.</p>
                </div>
                <Switch 
                    id="enable-module" 
                    checked={config.enabled} 
                    onCheckedChange={(val) => handleValueChange('enabled', val)}
                />
            </div>
        </CardContent>
      </Card>

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
                            <Switch 
                                checked={config.command_enabled?.[command.key] ?? true}
                                onCheckedChange={(checked) => handleEnabledChange(command.key, checked)}
                            />
                        </CardTitle>
                        <CardDescription>{command.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor={`role-select-${command.key}`} className="text-sm font-medium">Rôle minimum requis</Label>
                            <Combobox
                                options={roleOptions}
                                value={config.command_permissions?.[command.key] || 'none'}
                                onChange={(value) => handlePermissionChange(command.key, value)}
                                placeholder="Sélectionner un rôle"
                                searchPlaceholder="Rechercher un rôle..."
                                emptyPlaceholder="Aucun rôle trouvé."
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>
            <Separator />
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-6 w-11 rounded-full" />
                                </CardTitle>
                                <Skeleton className="h-4 w-full mt-2" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

    
