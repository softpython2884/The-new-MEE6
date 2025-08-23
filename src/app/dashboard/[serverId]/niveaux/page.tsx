
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Shield, Gem } from 'lucide-react';
import type { RoleReward, XPBoost } from '@/types';
import { Combobox } from '@/components/ui/combobox';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

interface LevelingConfig {
    enabled: boolean;
    xp_per_message: number;
    xp_per_minute_in_voice: number;
    cooldown_seconds: number;
    level_up_message: string;
    level_up_channel_id: string | null;
    level_card_background_url: string | null;
    ignored_channels: string[];
    role_rewards: RoleReward[];
    xp_boost_roles: XPBoost[];
    xp_boost_channels: XPBoost[];
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

function PageSkeleton() {
    return <Skeleton className="h-screen w-full" />;
}

export default function LevelingPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<LevelingConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/leveling`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();

                setConfig(configData);
                setChannels(serverDetailsData.channels);
                setRoles(serverDetailsData.roles);
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: LevelingConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/leveling`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };

    const handleValueChange = (key: keyof LevelingConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handleListChange = <T extends RoleReward | XPBoost>(
        key: 'role_rewards' | 'xp_boost_roles' | 'xp_boost_channels' | 'ignored_channels',
        index: number,
        field: keyof T,
        value: string | number
    ) => {
        if (!config) return;
        const list = [...(config[key] as T[])];
        (list[index] as any)[field] = value;
        handleValueChange(key, list);
    };
    
    const addListItem = (key: 'role_rewards' | 'xp_boost_roles' | 'xp_boost_channels' | 'ignored_channels') => {
        if (!config) return;
        const list = [...(config[key] as any[])];
        let newItem: any = {};
        if (key === 'role_rewards') newItem = { level: 1, role_id: '' };
        if (key === 'xp_boost_roles') newItem = { role_id: '', multiplier: 1.5 };
        if (key === 'xp_boost_channels') newItem = { channel_id: '', multiplier: 1.5 };
        if (key === 'ignored_channels') newItem = '';
        handleValueChange(key, [...list, newItem]);
    };
    
    const removeListItem = (key: 'role_rewards' | 'xp_boost_roles' | 'xp_boost_channels' | 'ignored_channels', index: number) => {
        if (!config) return;
        const list = [...(config[key] as any[])];
        list.splice(index, 1);
        handleValueChange(key, list);
    };

    if (loading || !config) {
        return <PageSkeleton />;
    }
    
    const channelOptions = channels.map(c => ({ value: c.id, label: `# ${c.name}` }));
    const roleOptions = roles.map(r => ({ value: r.id, label: `@ ${r.name}` }));


    return (
    <div className="space-y-8 text-white max-w-4xl">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Système de Niveaux</h1>
            <p className="text-muted-foreground mt-2">
                Configurez l'engagement de votre communauté en récompensant l'activité.
            </p>
        </div>
        <Separator />
        
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Configuration Générale</CardTitle>
                    <Switch checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>XP par message</Label>
                        <Input type="number" value={config.xp_per_message} onChange={(e) => handleValueChange('xp_per_message', parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                        <Label>XP par minute en vocal</Label>
                        <Input type="number" value={config.xp_per_minute_in_voice} onChange={(e) => handleValueChange('xp_per_minute_in_voice', parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Cooldown (secondes)</Label>
                        <Input type="number" value={config.cooldown_seconds} onChange={(e) => handleValueChange('cooldown_seconds', parseInt(e.target.value))} />
                    </div>
                </div>
                <Separator />
                 <div className="space-y-2">
                    <Label>URL de l'image de fond pour la carte de niveau (Embed)</Label>
                    <Input placeholder="https://example.com/background.png" value={config.level_card_background_url || ''} onChange={(e) => handleValueChange('level_card_background_url', e.target.value)} />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Annonces de Montée de Niveau</CardTitle>
            </CardHeader>
             <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Salon des annonces</Label>
                    <Combobox options={channelOptions} value={config.level_up_channel_id || ''} onChange={(val) => handleValueChange('level_up_channel_id', val)} placeholder="Sélectionner un salon..." />
                </div>
                <div className="space-y-2">
                    <Label>Message de montée de niveau</Label>
                    <p className="text-sm text-muted-foreground">Variables: {'{user}'} (mention), {'{level}'}</p>
                    <Textarea value={config.level_up_message} onChange={(e) => handleValueChange('level_up_message', e.target.value)} />
                </div>
             </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gem/> Rôles Récompenses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                     {config.role_rewards.map((reward, index) => (
                        <div key={index} className="flex items-end gap-2">
                            <Input className="w-20" type="number" placeholder="Niv." value={reward.level} onChange={e => handleListChange('role_rewards', index, 'level', parseInt(e.target.value))} />
                            <Combobox className="flex-1" options={roleOptions} value={reward.role_id} onChange={val => handleListChange('role_rewards', index, 'role_id', val)} placeholder="Sélectionner un rôle..." />
                            <Button variant="ghost" size="icon" onClick={() => removeListItem('role_rewards', index)}><Trash2 className="text-destructive"/></Button>
                        </div>
                    ))}
                </CardContent>
                <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => addListItem('role_rewards')}><PlusCircle /> Ajouter une récompense</Button>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield/> Rôles Boost d'XP</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                    {config.xp_boost_roles.map((boost, index) => (
                        <div key={index} className="flex items-end gap-2">
                            <Combobox className="flex-1" options={roleOptions} value={boost.role_id} onChange={val => handleListChange('xp_boost_roles', index, 'role_id', val)} placeholder="Sélectionner un rôle..." />
                            <Input className="w-24" type="number" step="0.1" placeholder="Ex: 1.5" value={boost.multiplier} onChange={e => handleListChange('xp_boost_roles', index, 'multiplier', parseFloat(e.target.value))} />
                            <Button variant="ghost" size="icon" onClick={() => removeListItem('xp_boost_roles', index)}><Trash2 className="text-destructive"/></Button>
                        </div>
                    ))}
                </CardContent>
                 <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => addListItem('xp_boost_roles')}><PlusCircle /> Ajouter un boost de rôle</Button>
                </CardContent>
            </Card>
        </div>

    </div>
  )
}
