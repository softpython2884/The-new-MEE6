
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

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

interface ImageFilterConfig {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
}

function ImageFilterPageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<ImageFilterConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const configRes = await fetch(`${API_URL}/get-config/${serverId}/image-filter`);
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
        return <Skeleton className="h-48 w-full" />;
    }

    return (
      <PremiumFeatureWrapper isPremium={isPremium}>
        <Card>
            <CardHeader>
            <h2 className="text-xl font-bold">Options</h2>
            <p className="text-muted-foreground">
                Configurez le niveau de sensibilité de la modération d'images par IA.
            </p>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
        </Card>
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
            <Skeleton className="h-48 w-full" />
        ) : (
            <ImageFilterPageContent isPremium={serverInfo?.isPremium || false} />
        )}
    </div>
  );
}
