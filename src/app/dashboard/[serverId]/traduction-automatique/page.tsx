

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface AutoTranslateConfig {
    enabled: boolean;
    mode: 'inline' | 'replace';
    channels: string[];
}
interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}

function AutoTranslatePageContent({ serverId }: { serverId: string }) {
    const { toast } = useToast();
    const [config, setConfig] = useState<AutoTranslateConfig | null>(null);
    const [allChannels, setAllChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/auto-translation`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);

                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch initial data');

                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();

                setConfig(configData);
                setAllChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0)); // Text channels only
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);
    
    const saveConfig = async (newConfig: AutoTranslateConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/auto-translation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };

    const handleValueChange = (key: keyof AutoTranslateConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    if (loading || !config) {
        return <Skeleton className="h-72 w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-bold">Options de Traduction</h2>
                <p className="text-muted-foreground">
                    Activez et configurez le module de traduction automatique.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="enable-translation" className="font-bold text-sm uppercase text-muted-foreground">Activer la traduction</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Active ou désactive complètement le module.
                        </p>
                    </div>
                    <Switch id="enable-translation" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                </div>
                <Separator />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                    <Label htmlFor="translation-mode" className="font-bold text-sm uppercase text-muted-foreground">Mode de traduction</Label>
                    <p className="text-sm text-muted-foreground/80">
                        Choisissez comment les traductions sont affichées.
                    </p>
                    </div>
                    <Select value={config.mode} onValueChange={(val: 'inline' | 'replace') => handleValueChange('mode', val)}>
                        <SelectTrigger className="w-full md:w-[280px]">
                            <SelectValue placeholder="Sélectionner un mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="inline">En ligne (sous le message original)</SelectItem>
                            <SelectItem value="replace">Remplacement (traduit directement)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Separator/>
                <div className="space-y-2">
                    <div>
                        <Label htmlFor="translation-channels" className="font-bold text-sm uppercase text-muted-foreground">Salons de traduction</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Salons où la traduction sera active.
                        </p>
                    </div>
                    <MultiSelectCombobox
                        options={allChannels.map(c => ({ value: c.id, label: `# ${c.name}` }))}
                        selected={config.channels || []}
                        onSelectedChange={(selected) => handleValueChange('channels', selected)}
                        placeholder="Sélectionner des salons..."
                    />
                </div>
            </CardContent>
        </Card>
    )
}

export default function AutoTranslatePage() {
    const params = useParams();
    const serverId = params.serverId as string;

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Traduction Automatique
        </h1>
        <p className="text-muted-foreground mt-2">
            Traduisez les messages en temps réel dans plusieurs langues pour unifier votre communauté.
        </p>
      </div>
      
      <Separator />

      <AutoTranslatePageContent serverId={serverId} />
    </div>
  );
}
