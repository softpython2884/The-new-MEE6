
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface ModAssistantConfig {
    enabled: boolean;
    alert_channel_id: string | null;
    alert_role_id: string | null;
    sensitivity: 'low' | 'medium' | 'high';
    exempt_roles: string[];
    actions: {
        low: string;
        medium: string;
        high: string;
        critical: string;
    }
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

const severityLevels = [
    { key: 'low', label: 'Basse' },
    { key: 'medium', label: 'Moyenne' },
    { key: 'high', label: 'Haute' },
    { key: 'critical', label: 'Critique' },
];

const actionOptions = [
    { value: 'none', label: 'Ne rien faire' },
    { value: 'warn', label: 'Avertir' },
    { value: 'delete', label: 'Supprimer le message' },
    { value: 'mute_5m', label: 'Rendre muet 5 minutes' },
    { value: 'mute_10m', label: 'Rendre muet 10 minutes' },
    { value: 'mute_1h', label: 'Rendre muet 1 heure' },
    { value: 'mute_24h', label: 'Rendre muet 24 heures' },
    { value: 'ban', label: 'Bannir' },
]

function ModAssistantPageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<ModAssistantConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/moderation-ai`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                setConfig(configData);
                setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0));
                setRoles(serverDetailsData.roles.filter((r: DiscordRole) => r.name !== '@everyone'));

            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);
    
    const saveConfig = async (newConfig: ModAssistantConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/moderation-ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof ModAssistantConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handleActionChange = (severity: 'low' | 'medium' | 'high' | 'critical', action: string) => {
        if (!config) return;
        const newActions = { ...config.actions, [severity]: action };
        handleValueChange('actions', newActions);
    };

     const handleRoleToggle = (roleId: string) => {
        if (!config) return;
        const newExemptRoles = config.exempt_roles.includes(roleId)
            ? config.exempt_roles.filter(id => id !== roleId)
            : [...config.exempt_roles, roleId];
        handleValueChange('exempt_roles', newExemptRoles);
    };

    if (loading || !config) {
        return <Skeleton className="h-96 w-full" />;
    }

    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <Card>
                <CardHeader>
                    <CardTitle>Configuration de l'Assistant Modération</CardTitle>
                    <CardDescription>
                        Configurez comment l'IA doit intervenir sur les messages des membres.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-module" className="font-bold">Activer le module</Label>
                             <p className="text-sm text-muted-foreground/80">Active ou désactive l'analyse des messages par l'IA.</p>
                        </div>
                        <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                    <Separator/>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                         <div>
                            <Label htmlFor="sensitivity" className="font-bold text-sm uppercase text-muted-foreground">Sensibilité de Détection</Label>
                            <p className="text-sm text-muted-foreground/80">
                                Un niveau élevé peut entraîner plus de faux positifs.
                            </p>
                        </div>
                        <Select value={config.sensitivity || 'medium'} onValueChange={(val: 'low' | 'medium' | 'high') => handleValueChange('sensitivity', val)}>
                            <SelectTrigger id="sensitivity" className="w-full md:w-[280px]">
                                <SelectValue placeholder="Sélectionner un niveau" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Basse (Moins de détections)</SelectItem>
                                <SelectItem value="medium">Moyenne (Recommandé)</SelectItem>
                                <SelectItem value="high">Haute (Plus de détections)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator/>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Notifications & Exceptions</h3>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                             <div>
                                <Label htmlFor="alert-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon d'alertes</Label>
                                <p className="text-sm text-muted-foreground/80">
                                   Le salon où l'IA enverra ses rapports et recommandations.
                                </p>
                            </div>
                            <Select value={config.alert_channel_id || 'none'} onValueChange={(val) => handleValueChange('alert_channel_id', val === 'none' ? null : val)}>
                                <SelectTrigger id="alert-channel" className="w-full md:w-[280px]">
                                    <SelectValue placeholder="Sélectionner un salon" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Salons Textuels</SelectLabel>
                                        <SelectItem value="none">Aucun</SelectItem>
                                        {channels.map(channel => <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                             <div>
                                <Label htmlFor="alert-role" className="font-bold text-sm uppercase text-muted-foreground">Rôle à mentionner</Label>
                                <p className="text-sm text-muted-foreground/80">
                                   Ce rôle sera mentionné dans les alertes.
                                </p>
                            </div>
                            <Select value={config.alert_role_id || 'none'} onValueChange={(val) => handleValueChange('alert_role_id', val === 'none' ? null : val)}>
                                <SelectTrigger id="alert-role" className="w-full md:w-[280px]">
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Rôles</SelectLabel>
                                        <SelectItem value="none">Aucun</SelectItem>
                                        {roles.map(role => <SelectItem key={role.id} value={role.id}>@ {role.name}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2 pt-2">
                            <Label htmlFor="exempt-roles" className="font-bold text-sm uppercase text-muted-foreground">Rôles exemptés</Label>
                             <p className="text-sm text-muted-foreground/80">
                                Les messages des utilisateurs avec ces rôles ne seront pas analysés.
                            </p>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        <div className="flex-1 text-left truncate">
                                            {config.exempt_roles.length > 0 
                                                ? config.exempt_roles.map(id => (
                                                    <Badge key={id} variant="secondary" className="mr-1 mb-1">{roles.find(r => r.id === id)?.name || id}</Badge>
                                                ))
                                                : "Sélectionner des rôles..."}
                                        </div>
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                    <DropdownMenuLabel>Choisir les rôles à exempter</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {roles.map(role => (
                                        <DropdownMenuCheckboxItem
                                            key={role.id}
                                            checked={config.exempt_roles.includes(role.id)}
                                            onCheckedChange={() => handleRoleToggle(role.id)}
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            {role.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                     <Separator/>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Sanctions Automatiques</h3>
                        <p className="text-sm text-muted-foreground">Définissez l'action à entreprendre pour chaque niveau de sévérité. Le message problématique est toujours supprimé.</p>
                        {severityLevels.map(({ key, label }) => (
                            <div key={key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                                <Label className="font-medium">{label}</Label>
                                 <Select value={config.actions[key as keyof typeof config.actions]} onValueChange={(val) => handleActionChange(key as any, val)}>
                                    <SelectTrigger className="w-full md:w-[280px]">
                                        <SelectValue placeholder="Choisir une action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {actionOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </PremiumFeatureWrapper>
    )
}

export default function ModAssistantPage() {
    const { serverInfo, loading } = useServerInfo();
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Assistant Modération IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Modération assistée par IA pour détecter et sanctionner les comportements toxiques.
        </p>
      </div>

      <Separator />

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <ModAssistantPageContent isPremium={serverInfo?.isPremium || false} />
      )}
    </div>
  );
}
