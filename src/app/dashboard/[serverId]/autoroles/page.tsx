
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface AutorolesConfig {
    enabled: boolean;
    on_join_roles: string[];
}

interface DiscordRole {
    id: string;
    name: string;
}

function AutorolesPageSkeleton() {
    return (
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

    const handleRoleToggle = (roleId: string) => {
        if (!config) return;
        const newRoles = config.on_join_roles.includes(roleId)
            ? config.on_join_roles.filter(id => id !== roleId)
            : [...config.on_join_roles, roleId];
        handleValueChange('on_join_roles', newRoles);
    };

    if (loading || !config) {
        return <AutorolesPageSkeleton />;
    }

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
                    <CardTitle>Rôles à l'arrivée</CardTitle>
                    <CardDescription>
                        Attribuez automatiquement des rôles aux nouveaux membres qui rejoignent le serveur.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-module" className="font-bold">Activer le module Autoroles</Label>
                            <p className="text-sm text-muted-foreground/80">Active ou désactive toutes les attributions de rôle.</p>
                        </div>
                        <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Label htmlFor="join-roles" className="font-bold text-sm uppercase text-muted-foreground">Rôles à attribuer à l'arrivée</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Sélectionnez les rôles à donner aux nouveaux membres.
                        </p>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    <div className="flex-1 text-left truncate">
                                        {config.on_join_roles.length > 0
                                            ? config.on_join_roles.map(id => (
                                                <Badge key={id} variant="secondary" className="mr-1 mb-1">{roles.find(r => r.id === id)?.name || id}</Badge>
                                            ))
                                            : "Sélectionner des rôles..."}
                                    </div>
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <DropdownMenuLabel>Choisir les rôles</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {roles.map(role => (
                                    <DropdownMenuCheckboxItem
                                        key={role.id}
                                        checked={config.on_join_roles.includes(role.id)}
                                        onCheckedChange={() => handleRoleToggle(role.id)}
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        {role.name}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
