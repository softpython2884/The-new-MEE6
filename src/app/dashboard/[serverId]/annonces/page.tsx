
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Megaphone, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface AnnouncementsConfig {
    enabled: boolean;
    announcement_channel_id: string | null;
    bot_announcement_channel_id: string | null;
    command_permissions: { [key: string]: string | null };
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

const announceCommands = [
  {
    name: '/announce',
    key: 'announce',
    description: 'Crée une annonce et la publie dans le salon configuré.',
  },
  {
    name: '/adminannounce',
    key: 'adminannounce',
    description: 'Envoie une annonce du propriétaire à tous les serveurs.',
  },
];

function PageSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
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

export default function AnnouncementsPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<AnnouncementsConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/announcements`),
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
    
    const saveConfig = async (newConfig: AnnouncementsConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof AnnouncementsConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        handleValueChange('command_permissions', newPermissions);
    };

    if (loading || !config) {
        return <PageSkeleton />;
    }

    const channelOptions = [
        { value: 'none', label: 'Désactivé' },
        ...channels.map(c => ({ value: c.id, label: `# ${c.name}` }))
    ];
    const roleOptions = [
        { value: 'none', label: 'Admin seulement' },
        ...roles.filter(r => r.name !== '@everyone').map(r => ({ value: r.id, label: r.name }))
    ];


  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Annonces</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les canaux d'annonces et les permissions pour les commandes associées.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Configuration des Salons</h2>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Label htmlFor="enable-module" className="font-bold">Activer le module</Label>
                    <p className="text-sm text-muted-foreground/80">Active ou désactive la commande /announce.</p>
                </div>
                <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
            </div>
            <Separator />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                <div>
                    <Label htmlFor="announcement-channel" className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2"><Megaphone />Annonces du Serveur</Label>
                    <p className="text-sm text-muted-foreground/80">
                        Le salon où la commande `/announce` publiera les annonces.
                    </p>
                </div>
                <Combobox
                    options={channelOptions}
                    value={config.announcement_channel_id || 'none'}
                    onChange={(val) => handleValueChange('announcement_channel_id', val === 'none' ? null : val)}
                    placeholder="Sélectionner un salon"
                    searchPlaceholder="Rechercher un salon..."
                    emptyPlaceholder="Aucun salon trouvé."
                    className="w-full md:w-[280px]"
                 />
            </div>
            <Separator />
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                <div>
                    <Label htmlFor="bot-announcement-channel" className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2"><Bot />Annonces du Bot</Label>
                    <p className="text-sm text-muted-foreground/80">
                        Le salon où seront publiées les annonces importantes du propriétaire du bot.
                    </p>
                </div>
                <Combobox
                    options={channelOptions}
                    value={config.bot_announcement_channel_id || 'none'}
                    onChange={(val) => handleValueChange('bot_announcement_channel_id', val === 'none' ? null : val)}
                    placeholder="Sélectionner un salon"
                    searchPlaceholder="Rechercher un salon..."
                    emptyPlaceholder="Aucun salon trouvé."
                    className="w-full md:w-[280px]"
                 />
            </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Permissions des Commandes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announceCommands.map((command) => (
            <Card key={command.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <span>{command.name}</span>
                </CardTitle>
                <CardDescription>{command.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={`role-select-${command.key}`} className="text-sm font-medium">
                    Rôle minimum requis
                  </Label>
                  <Combobox
                        options={roleOptions}
                        value={config.command_permissions?.[command.key] || 'none'}
                        onChange={(value) => handlePermissionChange(command.key, value)}
                        placeholder="Sélectionner un rôle"
                        searchPlaceholder="Rechercher un rôle..."
                        emptyPlaceholder="Aucun rôle trouvé."
                     />
                     {command.key === 'adminannounce' && <p className="text-xs text-destructive pt-1">Cette commande est réservée au propriétaire du bot.</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
