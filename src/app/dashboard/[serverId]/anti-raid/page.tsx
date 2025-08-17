

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface AntiRaidConfig {
    enabled: boolean;
    premium: boolean;
    raid_detection_enabled: boolean;
    raid_sensitivity: 'low' | 'medium' | 'high';
    raid_action: 'lockdown' | 'kick' | 'ban';
    link_scanner_enabled: boolean;
    link_scanner_action: 'warn' | 'delete';
    alert_channel_id: string | null;
    exempt_roles: string[];
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


function AntiRaidPageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<AntiRaidConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/adaptive-anti-raid`),
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

    const saveConfig = async (newConfig: AntiRaidConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/adaptive-anti-raid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof AntiRaidConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handleRoleToggle = (roleId: string) => {
        if (!config) return;
        const newExemptRoles = config.exempt_roles.includes(roleId)
            ? config.exempt_roles.filter(id => id !== roleId)
            : [...config.exempt_roles, roleId];
        handleValueChange('exempt_roles', newExemptRoles);
    };

    if (loading || !config) {
        return <AntiRaidPageSkeleton />;
    }
    
    return (
    <PremiumFeatureWrapper isPremium={isPremium}>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-bold">Options Générales</h2>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="enable-module" className="font-bold">Activer le module</Label>
                                <p className="text-sm text-muted-foreground/80">
                                    Active ou désactive la détection de raid ET le scanner de liens.
                                </p>
                            </div>
                            <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                    <Separator/>
                    <div className="space-y-2">
                        <Label htmlFor="alert-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon d'alertes</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Le salon où envoyer toutes les notifications de sécurité de ce module.
                        </p>
                        <Select 
                            value={config.alert_channel_id || 'none'}
                            onValueChange={(val) => handleValueChange('alert_channel_id', val === 'none' ? null : val)}
                        >
                            <SelectTrigger id="alert-channel" className="w-full md:w-[280px]">
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
                </CardContent>
            </Card>
            
            <Separator />

            {/* Section Anti-Raid */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold">Détection de Raid</h2>
                    <p className="text-muted-foreground">
                        Protège le serveur contre les arrivées massives et rapides de nouveaux membres.
                    </p>
                </div>
                <Card>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="raid-detection" className="font-bold">Activer la détection de raid</Label>
                            </div>
                            <Switch id="raid-detection" checked={config.raid_detection_enabled} onCheckedChange={(val) => handleValueChange('raid_detection_enabled', val)} />
                        </div>
                        <Separator />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                            <div>
                                <Label htmlFor="raid-sensitivity" className="font-bold text-sm uppercase text-muted-foreground">Sensibilité de détection</Label>
                            </div>
                            <Select value={config.raid_sensitivity} onValueChange={(val) => handleValueChange('raid_sensitivity', val)}>
                                <SelectTrigger id="raid-sensitivity" className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Sélectionner une sensibilité" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Basse</SelectItem>
                                    <SelectItem value="medium">Moyenne</SelectItem>
                                    <SelectItem value="high">Haute</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Separator />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                            <div>
                                <Label htmlFor="raid-action" className="font-bold text-sm uppercase text-muted-foreground">Action en cas de raid</Label>
                            </div>
                            <Select value={config.raid_action} onValueChange={(val) => handleValueChange('raid_action', val)}>
                                <SelectTrigger id="raid-action" className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Sélectionner une action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lockdown">Verrouillage du serveur</SelectItem>
                                    <SelectItem value="kick">Expulser les nouveaux membres</SelectItem>
                                    <SelectItem value="ban">Bannir les nouveaux membres</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Section Scanner de Liens */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold">Scanner de Liens</h2>
                    <p className="text-muted-foreground">
                        Analyse les liens envoyés sur le serveur pour détecter les menaces (liens non autorisés).
                    </p>
                </div>
                <Card>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="link-scanner" className="font-bold">Activer le scanner de liens</Label>
                            </div>
                            <Switch id="link-scanner" checked={config.link_scanner_enabled} onCheckedChange={(val) => handleValueChange('link_scanner_enabled', val)} />
                        </div>
                        <Separator />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                            <div>
                                <Label htmlFor="link-action" className="font-bold text-sm uppercase text-muted-foreground">Action sur lien suspect</Label>
                            </div>
                            <Select value={config.link_scanner_action} onValueChange={(val) => handleValueChange('link_scanner_action', val)}>
                                <SelectTrigger id="link-action" className="w-full md:w-[240px]">
                                    <SelectValue placeholder="Sélectionner une action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="warn">Avertir dans le salon</SelectItem>
                                    <SelectItem value="delete">Supprimer le message</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label htmlFor="exempt-roles" className="font-bold text-sm uppercase text-muted-foreground">Rôles exemptés du scan de liens</Label>
                            <p className="text-sm text-muted-foreground/80">
                                Les liens envoyés par les utilisateurs avec ces rôles ne seront pas supprimés/signalés.
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
                    </CardContent>
                </Card>
            </div>
        </div>
    </PremiumFeatureWrapper>
    )
}

function AntiRaidPageSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Separator />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
             <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AntiRaidPage() {
  const { serverInfo, loading } = useServerInfo();
  
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Anti-Raid & Scanner de Liens
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
            Détectez les raids et les liens malveillants pour protéger votre serveur.
        </p>
      </div>
      
      <Separator />

      {loading ? (
        <AntiRaidPageSkeleton />
      ) : (
        <AntiRaidPageContent isPremium={serverInfo?.isPremium || false} />
      )}
    </div>
  );
}
