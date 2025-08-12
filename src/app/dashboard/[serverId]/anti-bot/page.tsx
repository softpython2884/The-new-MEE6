
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface AntiBotConfig {
    enabled: boolean;
    mode: 'disabled' | 'auto-block' | 'approval-required' | 'whitelist-only';
    approval_channel_id: string | null;
    whitelisted_bots: string[];
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

function AntiBotPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-72 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-10 w-full md:w-[280px]" />
                </div>
                <Separator/>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-10 w-full md:w-[280px]" />
                </div>
                <Separator/>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function AntiBotPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<AntiBotConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/anti-bot`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                setConfig(configData);
                setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0));
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: AntiBotConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/anti-bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };

    const handleValueChange = (key: keyof AntiBotConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    if (loading || !config) {
        return <AntiBotPageSkeleton />;
    }

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Anti-Bot</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les règles d’ajout de bots sur le serveur pour renforcer la sécurité.
        </p>
      </div>
      
      <Separator />

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Options</h2>
          <p className="text-muted-foreground">
            Personnalisez le comportement du module Anti-Bot.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                <div>
                  <Label htmlFor="mode" className="font-bold text-sm uppercase text-muted-foreground">Mode de fonctionnement</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Choisissez comment le bot doit réagir à l'ajout de nouveaux bots.
                  </p>
                </div>
                 <Select value={config.mode} onValueChange={(value) => handleValueChange('mode', value)}>
                    <SelectTrigger id="mode" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="disabled">Désactivé</SelectItem>
                        <SelectItem value="auto-block">Blocage automatique</SelectItem>
                        <SelectItem value="approval-required">Approbation requise</SelectItem>
                        <SelectItem value="whitelist-only">Liste blanche seulement</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Separator/>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                <div>
                  <Label htmlFor="approval-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon d'approbation</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Requis si le mode "Approbation requise" est actif.
                  </p>
                </div>
                 <Select value={config.approval_channel_id || 'none'} onValueChange={(value) => handleValueChange('approval_channel_id', value === 'none' ? null : value)}>
                    <SelectTrigger id="approval-channel" className="w-full md:w-[280px]">
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
            <Separator/>
            <div className="space-y-2">
                <Label htmlFor="whitelist" className="font-bold text-sm uppercase text-muted-foreground">Liste blanche de bots (IDs)</Label>
                 <p className="text-sm text-muted-foreground/80">
                    Les bots listés ici seront toujours autorisés, quel que soit le mode. Séparez les IDs par une virgule.
                </p>
                <Textarea 
                    id="whitelist"
                    placeholder="789012345678901234,987654321098765432..." 
                    rows={3} 
                    value={(config.whitelisted_bots || []).join(',')}
                    onBlur={(e) => handleValueChange('whitelisted_bots', e.target.value.split(',').map(id => id.trim()).filter(Boolean))}
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
