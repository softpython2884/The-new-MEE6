

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { GlobalAiStatusAlert } from '@/components/global-ai-status-alert';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

interface ImageFilterConfig {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    exempt_roles: string[];
    exempt_channels: string[];
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

function ImageFilterPageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<ImageFilterConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/image-filter`),
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

    const saveConfig = async (newConfig: ImageFilterConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/image-filter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof ImageFilterConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    if (loading || !config) {
        return <Skeleton className="h-64 w-full" />;
    }

    return (
      <PremiumFeatureWrapper isPremium={isPremium}>
        <div className="space-y-4">
        <GlobalAiStatusAlert />
        <Card>
            <CardHeader>
            <h2 className="text-xl font-bold">Options</h2>
            <p className="text-muted-foreground">
                Configurez le niveau de sensibilité de la modération d'images par IA.
            </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="enable-module" className="font-bold text-sm uppercase text-muted-foreground">Activer le filtre d'image</Label>
                        <p className="text-sm text-muted-foreground/80">
                           Active ou désactive complètement ce module.
                        </p>
                    </div>
                    <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                </div>
                <Separator/>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                    <Label htmlFor="sensitivity" className="font-bold text-sm uppercase text-muted-foreground">Sensibilité</Label>
                    <p className="text-sm text-muted-foreground/80">
                        Un niveau élevé peut entraîner plus de faux positifs.
                    </p>
                    </div>
                    <Select 
                        value={config.sensitivity} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => handleValueChange('sensitivity', value)}
                    >
                        <SelectTrigger id="sensitivity" className="w-full md:w-[280px]">
                            <SelectValue placeholder="Sélectionner un niveau" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Basse</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Haute</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <Separator/>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="exempt-roles" className="font-bold text-sm">Rôles exemptés</Label>
                        <MultiSelectCombobox
                            options={roles.map(r => ({ value: r.id, label: r.name }))}
                            selected={config.exempt_roles || []}
                            onSelectedChange={(selected) => handleValueChange('exempt_roles', selected)}
                            placeholder="Sélectionner des rôles..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="exempt-channels" className="font-bold text-sm">Salons exemptés</Label>
                        <MultiSelectCombobox
                            options={channels.map(c => ({ value: c.id, label: `# ${c.name}` }))}
                            selected={config.exempt_channels || []}
                            onSelectedChange={(selected) => handleValueChange('exempt_channels', selected)}
                            placeholder="Sélectionner des salons..."
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
        </div>
      </PremiumFeatureWrapper>
    )
}

export default function ImageFilterPage() {
    const { serverInfo, loading } = useServerInfo();
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Filtre d'Image IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Scannez les images envoyées par les membres pour détecter du contenu potentiellement indésirable.
        </p>
      </div>
      
      <Separator />

       {loading ? (
            <Skeleton className="h-64 w-full" />
        ) : (
            <ImageFilterPageContent isPremium={serverInfo?.isPremium || false} />
        )}
    </div>
  );
}
