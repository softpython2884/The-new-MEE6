
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface ModAssistantConfig {
    enabled: boolean;
    mode: 'monitor' | 'recommend' | 'auto-act';
}

function ModAssistantPageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<ModAssistantConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const configRes = await fetch(`${API_URL}/get-config/${serverId}/moderation-ai`);
                if (!configRes.ok) throw new Error('Failed to fetch data');
                const configData = await configRes.json();
                setConfig(configData);
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);
    
    const saveConfig = async (newConfig: ModAssistantConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/moderation-ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof ModAssistantConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    if (loading || !config) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <Card>
                <CardHeader>
                <h2 className="text-xl font-bold">Options de l'Assistant Modération</h2>
                <p className="text-muted-foreground">
                    Configurez comment l'IA doit intervenir sur les messages des membres.
                </p>
                </CardHeader>
                <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="enable-module" className="font-bold">Activer le module</Label>
                    </div>
                    <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                </div>
                <Separator/>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                    <Label
                        htmlFor="mode"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Mode de fonctionnement
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                        Choisissez le niveau d'autonomie de l'IA.
                    </p>
                    </div>
                    <Select value={config.mode} onValueChange={(value) => handleValueChange('mode', value)}>
                    <SelectTrigger id="mode" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="monitor">Surveiller seulement</SelectItem>
                        <SelectItem value="recommend">Recommander des actions</SelectItem>
                        <SelectItem value="auto-act">Agir automatiquement</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                </CardContent>
            </Card>
        </PremiumFeatureWrapper>
    )
}

export default function ModAssistantPage() {
    const { serverInfo, loading } = useServerInfo();
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Assistant Modération IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Modération assistée par IA pour détecter les comportements toxiques. Ce module n'a pas de commandes directes.
        </p>
      </div>

      <Separator />

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <ModAssistantPageContent isPremium={serverInfo?.isPremium || false} />
      )}
    </div>
  );
}

