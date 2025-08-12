
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface SmartEventsConfig {
    enabled: boolean;
    suggest_time: boolean;
    rsvp_tracking: boolean;
    recurring_events: boolean;
    templates: string;
    command_permissions: { [key: string]: string | null };
}

interface DiscordRole {
    id: string;
    name: string;
}

const eventCommands = [
  {
    name: '/event-create',
    key: 'event-create',
    description: 'Crée un nouvel événement sur le serveur.',
  },
  {
    name: '/event-list',
    key: 'event-list',
    description: 'Affiche la liste des événements à venir.',
  },
];

function EventsPageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<SmartEventsConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/smart-events`),
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

    const saveConfig = async (newConfig: SmartEventsConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/smart-events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof SmartEventsConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        handleValueChange('command_permissions', newPermissions);
    };

    if (loading || !config) {
        return <Skeleton className="w-full h-[500px]" />;
    }

    return (
    <PremiumFeatureWrapper isPremium={isPremium}>
        <div className="space-y-8">
            {/* Section Options */}
            <Card>
                <CardHeader>
                <h2 className="text-xl font-bold">Options des Événements</h2>
                <p className="text-muted-foreground">
                    Configurez les fonctionnalités intelligentes de planification d'événements.
                </p>
                </CardHeader>
                <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="enable-module" className="font-bold">Activer le module Événements</Label>
                    </div>
                    <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div>
                    <Label
                        htmlFor="suggest-time"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Suggérer l'heure de l'événement
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                        Suggérer automatiquement les heures optimales lors de la création d'un événement.
                    </p>
                    </div>
                    <Switch id="suggest-time" checked={config.suggest_time} onCheckedChange={(val) => handleValueChange('suggest_time', val)} />
                </div>
                <Separator />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                    <Label
                        htmlFor="event-templates"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Modèles d'événements
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                        Activer les modèles prédéfinis pour créer des événements rapidement.
                    </p>
                    </div>
                    <Select value={config.templates} onValueChange={(val) => handleValueChange('templates', val)}>
                    <SelectTrigger id="event-templates" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="tournament">Tournoi</SelectItem>
                        <SelectItem value="movie-night">Soirée Film</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div>
                    <Label
                        htmlFor="rsvp-tracking"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Suivi des participations (RSVP)
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                        Activer le suivi, les rappels et l'attribution de rôles pour les participants.
                    </p>
                    </div>
                    <Switch id="rsvp-tracking" checked={config.rsvp_tracking} onCheckedChange={(val) => handleValueChange('rsvp_tracking', val)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div>
                    <Label
                        htmlFor="recurring-events"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Événements récurrents
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                        Activer les options de récurrence pour les événements.
                    </p>
                    </div>
                    <Switch id="recurring-events" checked={config.recurring_events} onCheckedChange={(val) => handleValueChange('recurring_events', val)} />
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
                {eventCommands.map((command) => (
                    <Card key={command.key}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span>{command.name}</span>
                        </CardTitle>
                        <CardDescription>{command.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                        <Label
                            htmlFor={`role-select-${command.key}`}
                            className="text-sm font-medium"
                        >
                            Rôle minimum requis
                        </Label>
                        <Select
                            value={config.command_permissions?.[command.key] || 'none'}
                            onValueChange={(value) => handlePermissionChange(command.key, value)}
                        >
                            <SelectTrigger id={`role-select-${command.key}`} className="w-full">
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="none">@everyone</SelectItem>
                                    {roles.filter(r => r.name !== '@everyone').map(role => (
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
    </PremiumFeatureWrapper>
    );
}


export default function EventsPage() {
    const { serverInfo, loading } = useServerInfo();
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Événements &amp; Calendrier IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Planifiez des événements en vous basant sur des cartes d'activité, avec des modèles et des rappels.
        </p>
      </div>

      <Separator />

      {loading ? (
        <Skeleton className="w-full h-[500px]" />
      ) : (
        <EventsPageContent isPremium={serverInfo?.isPremium || false} />
      )}
    </div>
  );
}
