

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChevronDown, MessageSquare, User, Hash, Tag, Hammer, Voicemail, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface LogSetting {
    enabled: boolean;
    channel_id: string | null;
}
interface LogsConfig {
  enabled: boolean;
  main_channel_id: string | null;
  exempt_roles: string[];
  exempt_channels: string[];
  log_settings: {
      messages: LogSetting;
      members: LogSetting;
      channels: LogSetting;
      roles: LogSetting;
      moderation: LogSetting;
      voice: LogSetting;
      server: LogSetting;
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

const logOptions = [
    { id: "messages", label: "Logs des messages", description: "Messages modifiés et supprimés.", icon: MessageSquare },
    { id: "members", label: "Logs des membres", description: "Arrivées, départs et mises à jour.", icon: User },
    { id: "channels", label: "Logs des salons", description: "Création, modification, suppression.", icon: Hash },
    { id: "roles", label: "Logs des rôles", description: "Création, modification, suppression.", icon: Tag },
    { id: "moderation", label: "Logs de modération", description: "Bans, kicks, mutes, etc.", icon: Hammer },
    { id: "voice", label: "Logs vocaux", description: "Connexions, mutes, etc.", icon: Voicemail },
    { id: "server", label: "Logs du serveur", description: "Changements de nom, d'icône, etc.", icon: Server },
];


export default function LogsPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<LogsConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/logs`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);

                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');

                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();

                setConfig(configData);
                setChannels(serverDetailsData.channels);
                setRoles(serverDetailsData.roles);
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

    const saveConfig = async (newConfig: LogsConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            const response = await fetch(`${API_URL}/update-config/${serverId}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
            if (!response.ok) throw new Error('Failed to save config');
        } catch (error) {
            console.error('Failed to update config', error);
            toast({
                title: "Erreur de sauvegarde",
                variant: "destructive",
            });
        }
    };

    const handleValueChange = (key: keyof LogsConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handleLogSettingChange = (logType: keyof LogsConfig['log_settings'], field: keyof LogSetting, value: any) => {
        if (!config) return;
        const newLogSettings = { ...config.log_settings };
        newLogSettings[logType] = { ...newLogSettings[logType], [field]: value };
        saveConfig({ ...config, log_settings: newLogSettings });
    };

    const handleMultiSelectToggle = (key: 'exempt_roles' | 'exempt_channels', id: string) => {
        if (!config) return;
        const currentList = config[key] || [];
        const newList = currentList.includes(id)
            ? currentList.filter((itemId: string) => itemId !== id)
            : [...currentList, id];
        saveConfig({ ...config, [key]: newList });
    };

    if (loading || !config) {
        return <PageSkeleton />;
    }

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
        <p className="text-muted-foreground mt-2">
            Configurer les journaux d'événements du serveur.
        </p>
      </div>
      
      <Separator />

      <Card>
          <CardHeader>
              <CardTitle>Configuration Générale des Logs</CardTitle>
              <CardDescription>
                  Activez les logs, choisissez un canal principal par défaut et définissez les exceptions.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="enable-module" className="font-bold">Activer le module de logs</Label>
                    </div>
                    <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                </div>
                <Separator />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                        <Label htmlFor="log-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon de logs principal</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Canal par défaut si aucun canal dédié n'est spécifié ci-dessous.
                        </p>
                    </div>
                    <Select 
                        value={config.main_channel_id || 'none'}
                        onValueChange={(value) => handleValueChange('main_channel_id', value === 'none' ? null : value)}
                    >
                        <SelectTrigger className="w-full md:w-[280px]">
                            <SelectValue placeholder="Sélectionner un salon" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Salons textuels</SelectLabel>
                                <SelectItem value="none">Aucun</SelectItem>
                                {channels.filter(c => c.type === 0).map(channel => (
                                    <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <Separator />

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Exceptions Globales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Salons à ignorer</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        <div className="flex-1 text-left truncate">
                                            {config.exempt_channels?.length > 0
                                                ? config.exempt_channels.map((id: string) => (
                                                    <Badge key={id} variant="secondary" className="mr-1 mb-1">{channels.find(c => c.id === id)?.name || id}</Badge>
                                                ))
                                                : "Sélectionner des salons..."}
                                        </div>
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                    <DropdownMenuLabel>Choisir les salons</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {channels.map(channel => (
                                        <DropdownMenuCheckboxItem
                                            key={channel.id}
                                            checked={config.exempt_channels?.includes(channel.id)}
                                            onCheckedChange={() => handleMultiSelectToggle('exempt_channels', channel.id)}
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            # {channel.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="space-y-2">
                            <Label>Rôles à ignorer</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        <div className="flex-1 text-left truncate">
                                            {config.exempt_roles?.length > 0
                                                ? config.exempt_roles.map((id: string) => (
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
                                    {roles.filter(r => r.name !== '@everyone').map(role => (
                                        <DropdownMenuCheckboxItem
                                            key={role.id}
                                            checked={config.exempt_roles?.includes(role.id)}
                                            onCheckedChange={() => handleMultiSelectToggle('exempt_roles', role.id)}
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            {role.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </CardContent>
      </Card>
      
      <Separator />

      <div>
        <h2 className="text-2xl font-bold">Journaux d'Événements</h2>
        <p className="text-muted-foreground mt-1">
          Activez les types de logs que vous souhaitez et assignez-leur un canal dédié si nécessaire.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {logOptions.map(option => (
            <Card key={option.id}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle className="flex items-center gap-2">
                            <option.icon className="w-5 h-5 text-primary"/>
                            {option.label}
                        </CardTitle>
                        <Switch 
                            checked={config.log_settings[option.id as keyof typeof config.log_settings].enabled}
                            onCheckedChange={(val) => handleLogSettingChange(option.id as keyof typeof config.log_settings, 'enabled', val)}
                        />
                    </div>
                    <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label className="text-xs uppercase text-muted-foreground">Salon dédié</Label>
                    <Select
                        value={config.log_settings[option.id as keyof typeof config.log_settings].channel_id || 'main'}
                        onValueChange={(val) => handleLogSettingChange(option.id as keyof typeof config.log_settings, 'channel_id', val === 'main' ? null : val)}
                    >
                        <SelectTrigger>
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="main">Utiliser le salon principal</SelectItem>
                            {channels.filter(c => c.type === 0).map(channel => (
                                <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}


function PageSkeleton() {
    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-72" />
            </div>
            <Separator />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="h-10 w-64" />
                    </div>
                    <Separator />
                    <div className="grid md:grid-cols-2 gap-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                             <div className="flex items-center justify-between">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-11 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-48 mt-2"/>
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
