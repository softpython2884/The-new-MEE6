
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Trash2, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { InteractiveChannel } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { GlobalAiStatusAlert } from '@/components/global-ai-status-alert';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Config Type
interface SmartVoiceConfig {
    enabled: boolean;
    interactive_channels: InteractiveChannel[];
    custom_instructions: string;
}
interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}

function SmartVoicePageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<SmartVoiceConfig | null>(null);
    const [voiceChannels, setVoiceChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/smart-voice`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                
                setConfig(configData);
                setVoiceChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 2)); // Voice channels
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: SmartVoiceConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/smart-voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof SmartVoiceConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handleChannelConfigChange = (index: number, field: 'id' | 'theme', value: string) => {
        if (!config) return;
        const newChannels = [...config.interactive_channels];
        newChannels[index] = { ...newChannels[index], [field]: value };
        handleValueChange('interactive_channels', newChannels);
    };

    const addChannel = () => {
        if (!config) return;
        const newChannel: InteractiveChannel = { id: '', theme: 'Gaming' };
        handleValueChange('interactive_channels', [...config.interactive_channels, newChannel]);
    };

    const removeChannel = (indexToRemove: number) => {
        if (!config) return;
        handleValueChange('interactive_channels', config.interactive_channels.filter((_, index) => index !== indexToRemove));
    };


    if (loading || !config) {
        return <Skeleton className="w-full h-[400px]" />;
    }

    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <div className="space-y-8">
            <GlobalAiStatusAlert />
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-bold">Options Générales</h2>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-module" className="font-bold">Activer le module</Label>
                        </div>
                        <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Label htmlFor="custom-instructions" className="font-bold text-sm uppercase text-muted-foreground">Instructions Personnalisées</Label>
                        <p className="text-sm text-muted-foreground/80">
                           Donnez des instructions spécifiques à l'IA pour la génération des noms (ex: "Utilise un ton humoristique", "Fais des références à la pop culture").
                        </p>
                        <Textarea 
                            id="custom-instructions"
                            placeholder="Ex: Toujours inclure un emoji lié au jeu. Garder les noms courts et percutants."
                            defaultValue={config.custom_instructions}
                            onBlur={(e) => handleValueChange('custom_instructions', e.target.value)}
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>
            
            <Separator />

            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold">Salons Interactifs</h2>
                    <p className="text-muted-foreground">
                        Configurez ici les salons vocaux qui seront gérés par l'IA.
                    </p>
                </div>
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        {config.interactive_channels.map((channel, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg bg-card-foreground/5">
                                <div className="flex-1 w-full">
                                    <Label>Salon Vocal</Label>
                                    <Select value={channel.id} onValueChange={(id) => handleChannelConfigChange(index, 'id', id)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un salon..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Salons vocaux</SelectLabel>
                                                {voiceChannels.map(vc => (
                                                    <SelectItem key={vc.id} value={vc.id}>{vc.name}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 w-full">
                                    <Label>Thème Personnalisé</Label>
                                    <Input 
                                        placeholder="Ex: Gaming, Soirée Film, QG..." 
                                        value={channel.theme} 
                                        onChange={(e) => handleChannelConfigChange(index, 'theme', e.target.value)}
                                    />
                                </div>
                                <Button variant="ghost" size="icon" className="self-end" onClick={() => removeChannel(index)}>
                                    <Trash2 className="w-5 h-5 text-destructive"/>
                                </Button>
                            </div>
                        ))}
                        <Button variant="default" className="w-full mt-4" onClick={addChannel}>
                            <PlusCircle className="mr-2" />
                            Ajouter un salon interactif
                        </Button>
                    </CardContent>
                </Card>
            </div>
            </div>
        </PremiumFeatureWrapper>
    )
}

export default function SmartVoicePage() {
    const { serverInfo, loading } = useServerInfo();
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            IA Vocaux
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
            <Badge variant="secondary">1 salon gratuit</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
            L'IA gère les salons vocaux : elle génère un nom en fonction de l'activité des membres. Si le salon est vide, il est renommé "Vocal intéractif".
        </p>
      </div>

      <Separator />

      {loading ? (
        <Skeleton className="w-full h-[400px]" />
      ) : (
        <SmartVoicePageContent isPremium={serverInfo?.isPremium || false} />
      )}
    </div>
  );
}
