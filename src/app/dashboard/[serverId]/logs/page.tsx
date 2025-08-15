
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
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface LogsConfig {
  enabled: boolean;
  log_channel_id: string | null;
  exempt_roles: string[];
  exempt_channels: string[];
  [key: string]: any; // for dynamic log options
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
    { id: "log-messages", label: "Logs des messages", description: "Journaliser les messages modifiés et supprimés." },
    { id: "log-members", label: "Logs des membres", description: "Journaliser les arrivées, départs et mises à jour des membres." },
    { id: "log-channels", label: "Logs des salons", description: "Journaliser la création, modification et suppression des salons." },
    { id: "log-roles", label: "Logs des rôles", description: "Journaliser la création, modification et suppression des rôles." },
    { id: "log-moderation", label: "Logs de modération", description: "Journaliser les actions de modération (bans, kicks, mutes)." },
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
              <CardTitle>Configuration des Logs</CardTitle>
              <CardDescription>
                  Personnalisez les événements à journaliser, leur destination et les exceptions.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                <div>
                  <Label htmlFor="log-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon de logs principal</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Le salon où envoyer tous les logs par défaut.
                  </p>
                </div>
                 <Select 
                    value={config.log_channel_id || 'none'}
                    onValueChange={(value) => handleValueChange('log_channel_id', value === 'none' ? null : value)}
                 >
                    <SelectTrigger className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un salon" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Salons textuels</SelectLabel>
                            <SelectItem value="none">Désactivé</SelectItem>
                            {channels.filter(c => c.type === 0).map(channel => (
                                <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
              </div>
              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Exceptions</h3>
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

              <Separator />
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Événements à Journaliser</h3>
                {logOptions.map((option, index) => (
                    <React.Fragment key={option.id}>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor={option.id} className="font-bold">{option.label}</Label>
                                <p className="text-sm text-muted-foreground/80">
                                    {option.description}
                                </p>
                            </div>
                            <Switch 
                                id={option.id} 
                                checked={config[option.id] ?? false}
                                onCheckedChange={(checked) => handleValueChange(option.id, checked)}
                            />
                        </div>
                        {index < logOptions.length - 1 && <Separator />}
                    </React.Fragment>
                ))}
              </div>
          </CardContent>
      </Card>
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
                     <div className="space-y-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-72" />
                                </div>
                                <Skeleton className="h-6 w-11 rounded-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
