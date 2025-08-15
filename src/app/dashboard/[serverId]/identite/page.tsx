
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useServerInfo } from '@/hooks/use-server-info';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface IdentityConfig {
    enabled: boolean;
    nickname: string | null;
    avatar_url: string | null;
}

function IdentityPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Separator />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32 ml-auto" />
            </CardContent>
        </Card>
    );
}

export default function IdentityPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();
    const { serverInfo, loading: serverLoading } = useServerInfo();

    const [config, setConfig] = useState<IdentityConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const configRes = await fetch(`${API_URL}/get-config/${serverId}/server-identity`);
                if (!configRes.ok) throw new Error('Failed to fetch config');
                const configData = await configRes.json();
                setConfig(configData);
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);
    
    const handleSave = async () => {
        if (!config) return;
        try {
            await fetch(`${API_URL}/update-config/${serverId}/server-identity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            toast({ title: "Succès", description: "Identité mise à jour. Le changement peut prendre un instant." });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof IdentityConfig, value: any) => {
        setConfig(prev => prev ? { ...prev, [key]: value } : null);
    };

    if (loading || serverLoading || !config) {
        return <IdentityPageSkeleton />;
    }

    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Identité du Bot</h1>
                <p className="text-muted-foreground mt-2">
                    Personnalisez le nom et l'avatar du bot spécifiquement pour ce serveur.
                </p>
            </div>
            <Separator />
            <Card>
                <CardHeader>
                    <CardTitle>Configuration de l'Identité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-module" className="font-bold">Activer la personnalisation</Label>
                            <p className="text-sm text-muted-foreground/80">
                                Si désactivé, le bot utilisera son profil global.
                            </p>
                        </div>
                        <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                    <Separator/>
                     <div className="space-y-2">
                        <Label htmlFor="nickname" className="font-bold text-sm uppercase text-muted-foreground">
                            Surnom sur le serveur
                        </Label>
                        <Input
                            id="nickname"
                            placeholder={serverInfo?.name ? `Assistant de ${serverInfo.name}` : 'Surnom du bot'}
                            value={config.nickname || ''}
                            onChange={(e) => handleValueChange('nickname', e.target.value)}
                        />
                    </div>
                    <Separator />
                     <div className="space-y-2">
                        <Label htmlFor="avatar_url" className="font-bold text-sm uppercase text-muted-foreground">
                            URL de l'avatar
                        </Label>
                         <p className="text-sm text-muted-foreground/80">
                            Fournissez un lien direct vers une image (PNG, JPG, GIF). Pour réinitialiser, laissez vide.
                        </p>
                        <Input
                            id="avatar_url"
                            placeholder="https://example.com/mon-super-avatar.png"
                            value={config.avatar_url || ''}
                            onChange={(e) => handleValueChange('avatar_url', e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSave}>
                            <Save className="mr-2"/>
                            Enregistrer les changements
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
