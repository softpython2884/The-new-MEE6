

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Voicemail } from 'lucide-react';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface AutorolesConfig {
    enabled: boolean;
    on_join_roles: string[];
    on_voice_join_roles: string[];
}

interface DiscordRole {
    id: string;
    name: string;
}

function AutorolesPageSkeleton() {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Separator />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-64" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-64" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AutorolesPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<AutorolesConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/autoroles`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');

                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();

                setConfig(configData);
                setRoles(serverDetailsData.roles.filter((r: DiscordRole) => r.name !== '@everyone'));

            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: AutorolesConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/autoroles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };

    const handleValueChange = (key: keyof AutorolesConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    if (loading || !config) {
        return <AutorolesPageSkeleton />;
    }

    const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));

    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Autoroles</h1>
                <p className="text-muted-foreground mt-2">
                    Gérez l'attribution automatique de rôles sur votre serveur.
                </p>
            </div>
            <Separator />
            <Card>
                 <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle>Configuration Générale</CardTitle>
                        <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                     <CardDescription>Activez ou désactivez toutes les attributions de rôle de ce module.</CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rôles à l'arrivée d'un membre</CardTitle>
                    <CardDescription>
                        Attribuez automatiquement des rôles aux nouveaux membres qui rejoignent le serveur.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="join-roles" className="font-bold text-sm uppercase text-muted-foreground">Rôles à attribuer</Label>
                        <MultiSelectCombobox
                            options={roleOptions}
                            selected={config.on_join_roles || []}
                            onSelectedChange={(selected) => handleValueChange('on_join_roles', selected)}
                            placeholder="Sélectionner des rôles..."
                        />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Voicemail className="w-5 h-5 text-primary"/>
                        Rôles à la connexion en vocal
                    </CardTitle>
                    <CardDescription>
                        Attribuez automatiquement un ou plusieurs rôles lorsqu'un membre rejoint un salon vocal.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="voice-join-roles" className="font-bold text-sm uppercase text-muted-foreground">Rôles à attribuer</Label>
                         <MultiSelectCombobox
                            options={roleOptions}
                            selected={config.on_voice_join_roles || []}
                            onSelectedChange={(selected) => handleValueChange('on_voice_join_roles', selected)}
                            placeholder="Sélectionner des rôles..."
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
