
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface AutoModConfig {
  enabled: boolean;
  exempt_roles: string[];
  scanned_channels: string[];
  [key: string]: any; // for dynamic rules
}

interface DiscordRole {
  id: string;
  name: string;
}

interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}

const ruleDefinitions = {
    forbidden_vocabulary: { label: 'Vocabulaire interdit' },
    discord_invites: { label: 'Invitations Discord' },
    external_links: { label: 'Liens externes' },
    excessive_caps: { label: 'Majuscules excessives' },
    excessive_emojis: { label: 'Émojis excessifs' },
    excessive_mentions: { label: 'Mentions excessives' },
    message_spam: { label: 'Spam de messages' },
};

function AutoModerationPageSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

export default function AutoModerationPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<AutoModConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/auto-moderation`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                setConfig(configData);
                setRoles(serverDetailsData.roles);
                setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0));
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: AutoModConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/auto-moderation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };

    const handleValueChange = (key: string, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handleRoleChange = (index: number, roleId: string) => {
        if (!config) return;
        const newRoles = [...config.exempt_roles];
        newRoles[index] = roleId;
        handleValueChange('exempt_roles', newRoles);
    };

    const addRole = () => {
        if (!config) return;
        handleValueChange('exempt_roles', [...config.exempt_roles, '']);
    };

    const removeRole = (index: number) => {
        if (!config) return;
        handleValueChange('exempt_roles', config.exempt_roles.filter((_, i) => i !== index));
    };

     const handleChannelChange = (index: number, channelId: string) => {
        if (!config) return;
        const newChannels = [...config.scanned_channels];
        newChannels[index] = channelId;
        handleValueChange('scanned_channels', newChannels);
    };

    const addChannel = () => {
        if (!config) return;
        handleValueChange('scanned_channels', [...config.scanned_channels, '']);
    };

    const removeChannel = (index: number) => {
        if (!config) return;
        handleValueChange('scanned_channels', config.scanned_channels.filter((_, i) => i !== index));
    };

    if (loading || !config) {
        return <AutoModerationPageSkeleton />;
    }

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auto-Modération</h1>
        <p className="text-muted-foreground mt-2">
            Définir des règles pour détecter et sanctionner automatiquement les comportements indésirables.
        </p>
      </div>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Options Générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Label htmlFor="enable-automod" className="font-bold">Activer l'Auto-Modération</Label>
                    <p className="text-sm text-muted-foreground/80">Active ou désactive toutes les règles ci-dessous.</p>
                </div>
                <Switch id="enable-automod" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
            </div>
            <Separator />
            <div className="space-y-4">
                <Label className="font-bold">Salons à surveiller</Label>
                <p className="text-sm text-muted-foreground/80">L'auto-modération ne sera active que dans les salons sélectionnés. Si la liste est vide, aucun salon ne sera surveillé.</p>
                {config.scanned_channels?.map((channelId, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Select value={channelId} onValueChange={(id) => handleChannelChange(index, id)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un salon..." />
                            </SelectTrigger>
                            <SelectContent>
                                {channels.map(channel => (
                                    <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => removeChannel(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addChannel}><PlusCircle className="mr-2 h-4 w-4"/>Ajouter un salon</Button>
            </div>
            <Separator />
            <div className="space-y-4">
                <Label className="font-bold">Rôles exemptés</Label>
                <p className="text-sm text-muted-foreground/80">Les membres avec ces rôles ne seront pas affectés par l'auto-modération.</p>
                {config.exempt_roles.map((roleId, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Select value={roleId} onValueChange={(id) => handleRoleChange(index, id)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un rôle..." />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.filter(r => r.name !== '@everyone').map(role => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => removeRole(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addRole}><PlusCircle className="mr-2 h-4 w-4"/>Ajouter un rôle</Button>
            </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <h2 className="text-xl font-bold">Règles d'Auto-Modération</h2>
              <p className="text-muted-foreground">
                  Activez et configurez les règles de modération pour le serveur.
              </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(ruleDefinitions).map(([key, { label }]) => (
                <React.Fragment key={key}>
                <Separator />
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor={`${key}_enabled`} className="text-lg font-semibold">{label}</Label>
                        <Switch id={`${key}_enabled`} checked={config[`${key}_enabled`] ?? false} onCheckedChange={(val) => handleValueChange(`${key}_enabled`, val)} />
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <Label>Action</Label>
                        <Select value={config[`${key}_action`] || 'delete'} onValueChange={(val) => handleValueChange(`${key}_action`, val)}>
                            <SelectTrigger className="w-full md:w-1/2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="warn">Avertir l'utilisateur</SelectItem>
                                <SelectItem value="delete">Supprimer le message</SelectItem>
                                <SelectItem value="mute">Rendre muet</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {key === 'forbidden_vocabulary' && (
                        <div>
                            <Label>Mots/phrases interdits (séparés par une virgule)</Label>
                            <Textarea 
                                placeholder="mot1,expression 2,mot3" 
                                defaultValue={(config.forbidden_vocabulary_words || []).join(',')}
                                onBlur={(e) => handleValueChange('forbidden_vocabulary_words', e.target.value.split(',').map(w => w.trim()).filter(Boolean))}
                            />
                        </div>
                    )}
                    {key === 'external_links' && (
                        <div>
                            <Label>Domaines autorisés (séparés par une virgule)</Label>
                            <Textarea 
                                placeholder="youtube.com,twitter.com"
                                defaultValue={(config.external_links_allowed_domains || []).join(',')}
                                onBlur={(e) => handleValueChange('external_links_allowed_domains', e.target.value.split(',').map(d => d.trim()).filter(Boolean))}
                             />
                        </div>
                    )}
                    {key === 'excessive_caps' && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <Label>Pourcentage maximum de majuscules</Label>
                            <Input 
                                type="number" 
                                className="w-full md:w-1/2"
                                defaultValue={config.excessive_caps_threshold_percentage || 70}
                                onBlur={(e) => handleValueChange('excessive_caps_threshold_percentage', parseInt(e.target.value, 10))}
                            />
                        </div>
                    )}
                    {key === 'excessive_emojis' && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <Label>Nombre maximum d'émojis</Label>
                            <Input 
                                type="number" 
                                className="w-full md:w-1/2" 
                                defaultValue={config.excessive_emojis_max_emojis || 10}
                                onBlur={(e) => handleValueChange('excessive_emojis_max_emojis', parseInt(e.target.value, 10))}
                            />
                        </div>
                    )}
                     {key === 'excessive_mentions' && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <Label>Nombre maximum de mentions</Label>
                            <Input 
                                type="number" 
                                className="w-full md:w-1/2" 
                                defaultValue={config.excessive_mentions_max_mentions || 5}
                                onBlur={(e) => handleValueChange('excessive_mentions_max_mentions', parseInt(e.target.value, 10))}
                            />
                        </div>
                    )}
                </div>
                </React.Fragment>
            ))}
          </CardContent>
      </Card>
    </div>
  );
}
