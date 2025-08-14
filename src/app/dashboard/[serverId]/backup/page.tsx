

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { DatabaseBackup, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface BackupConfig {
  enabled: boolean;
  command_permissions: { [key: string]: string | null };
}

interface DiscordRole {
    id: string;
    name: string;
}

const backupCommand = {
    name: '/backup',
    key: 'backup',
    description: 'Exporte ou importe la configuration du serveur (salons & rôles).',
};

function BackupPageSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}

export default function BackupPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<BackupConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/backup`),
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
    
    const saveConfig = async (newConfig: BackupConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };

    const handleValueChange = (key: keyof BackupConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        handleValueChange('command_permissions', newPermissions);
    };
    
    if (loading || !config) {
        return <BackupPageSkeleton />;
    }

    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Backup</h1>
                <p className="text-muted-foreground mt-2">
                    Sauvegardez et restaurez la configuration de votre serveur.
                </p>
            </div>
            
            <Separator />

            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                    La fonctionnalité d'importation est une action destructive qui peut modifier radicalement votre serveur. Utilisez-la avec une extrême prudence.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle>Comment ça marche ?</CardTitle>
                    <CardDescription>
                        Utilisez les commandes directement dans votre serveur Discord.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg">Exporter</h3>
                        <p className="text-muted-foreground">
                            Tapez la commande <code className="bg-muted text-foreground px-1 py-0.5 rounded-md">/backup export</code> dans n'importe quel salon. Le bot vous enverra un fichier JSON en message privé contenant la configuration de vos salons et rôles.
                        </p>
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg">Importer</h3>
                        <p className="text-muted-foreground">
                            Tapez la commande <code className="bg-muted text-foreground px-1 py-0.5 rounded-md">/backup import</code> et attachez le fichier JSON que vous avez précédemment exporté.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-module" className="font-bold">Activer le module de Backup</Label>
                        </div>
                        <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                    <Separator/>
                    <div className="space-y-2">
                        <Label htmlFor={`role-select-${backupCommand.key}`} className="text-sm font-medium">Rôle minimum requis pour <code className="bg-muted text-foreground px-1 py-0.5 rounded-md">/backup</code></Label>
                        <Select 
                            value={config.command_permissions?.[backupCommand.key] || 'none'}
                            onValueChange={(value) => handlePermissionChange(backupCommand.key, value)}
                        >
                            <SelectTrigger id={`role-select-${backupCommand.key}`} className="w-full">
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="none">Administrateur seulement</SelectItem>
                                    {roles.filter(r => r.name !== '@everyone').map(role => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


    