
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface CaptchaConfig {
    enabled: boolean;
    verification_channel: string | null;
    verified_role_id: string | null;
}

interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}

interface DiscordRole {
    id: string;
    name: string;
}

function CaptchaPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-72 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    )
}

function CaptchaPageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<CaptchaConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/captcha`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                setConfig(configData);
                setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0));
                setRoles(serverDetailsData.roles);

            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);
    
    const saveConfig = async (newConfig: CaptchaConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/captcha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof CaptchaConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    if (loading || !config) {
        return <CaptchaPageSkeleton />;
    }

    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <Card>
                <CardHeader>
                <h2 className="text-xl font-bold">Options du Captcha</h2>
                <p className="text-muted-foreground">
                    Configurez le système de vérification pour filtrer les raids de bots.
                </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-captcha" className="font-bold">Activer le Captcha</Label>
                            <p className="text-sm text-muted-foreground/80">
                                Active ou désactive complètement le module.
                            </p>
                        </div>
                        <Switch id="enable-captcha" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                    <Separator />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                        <div>
                        <Label htmlFor="verification-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon de vérification</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Le salon où les nouveaux membres effectueront la vérification.
                        </p>
                        </div>
                        <Select value={config.verification_channel || 'none'} onValueChange={(val) => handleValueChange('verification_channel', val === 'none' ? null : val)}>
                            <SelectTrigger id="verification-channel" className="w-full md:w-[280px]">
                                <SelectValue placeholder="Sélectionner un salon" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Salons textuels</SelectLabel>
                                    <SelectItem value="none">Aucun</SelectItem>
                                    {channels.map(channel => (
                                        <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                        <div>
                        <Label htmlFor="verified-role" className="font-bold text-sm uppercase text-muted-foreground">Rôle vérifié</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Ce rôle est attribué après une vérification réussie.
                        </p>
                        </div>
                        <Select value={config.verified_role_id || 'none'} onValueChange={(val) => handleValueChange('verified_role_id', val === 'none' ? null : val)}>
                            <SelectTrigger id="verified-role" className="w-full md:w-[280px]">
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Rôles</SelectLabel>
                                     <SelectItem value="none">Aucun</SelectItem>
                                    {roles.filter(r => r.name !== '@everyone').map(role => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </PremiumFeatureWrapper>
    );
}

export default function CaptchaPage() {
    const { serverInfo, loading } = useServerInfo();

    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    Captcha
                    <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
                </h1>
                <p className="text-muted-foreground mt-2">
                Mettez en place un système de vérification par captcha pour les nouveaux membres.
                </p>
            </div>
            
            <Separator />

            {loading ? (
                <CaptchaPageSkeleton />
            ) : (
                <CaptchaPageContent isPremium={serverInfo?.isPremium || false} />
            )}
        </div>
    );
}
