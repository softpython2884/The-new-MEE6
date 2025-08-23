

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface LockConfig {
    enabled: boolean;
    exempt_roles: string[];
    command_permissions: { [key: string]: string | null };
}

interface DiscordRole {
    id: string;
    name: string;
}

const lockCommands = [
    { name: '/lock', key: 'lock', description: 'Verrouille un salon pour le rôle @everyone.' },
    { name: '/unlock', key: 'unlock', description: 'Déverrouille un salon précédemment verrouillé.' },
];

function LockPageSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-full mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function LockPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<LockConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/lock`),
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

    const saveConfig = async (newConfig: LockConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };

    const handleValueChange = (key: keyof LockConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        handleValueChange('command_permissions', newPermissions);
    };

    if (loading || !config) {
        return <LockPageSkeleton />;
    }

    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Lock/Unlock</h1>
                <p className="text-muted-foreground mt-2">
                    Verrouille ou déverrouille un salon. Les permissions exactes d'avant le verrouillage sont restaurées.
                </p>
            </div>
            
            <Separator />
            
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle>Configuration Générale</CardTitle>
                        <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                     <CardDescription>Activez ou désactivez toutes les commandes de ce module.</CardDescription>
                </CardHeader>
            </Card>

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
                        <MultiSelectCombobox
                            options={roles.map(r => ({ value: r.id, label: r.name }))}
                            selected={config.exempt_roles || []}
                            onSelectedChange={(selected) => handleValueChange('exempt_roles', selected)}
                            placeholder="Sélectionner des rôles..."
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
                        Gérez les permissions pour chaque commande de ce module.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lockCommands.map(command => (
                        <Card key={command.key}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-primary" />
                                    <span>{command.name}</span>
                                </CardTitle>
                                <CardDescription>{command.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor={`role-select-${command.key}`} className="text-sm font-medium">Rôle minimum requis</Label>
                                    <Select 
                                        value={config.command_permissions[command.key] || 'none'}
                                        onValueChange={(value) => handlePermissionChange(command.key, value)}
                                    >
                                        <SelectTrigger id={`role-select-${command.key}`} className="w-full">
                                            <SelectValue placeholder="Sélectionner un rôle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="none">Admin seulement</SelectItem>
                                                {roles.map(role => (
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
