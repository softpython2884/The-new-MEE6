

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface WebcamConfig {
    enabled: boolean;
    mode: 'allowed' | 'webcam_only' | 'stream_only' | 'disallowed';
}

function WebcamControlPageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-72 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Separator />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
}

export default function WebcamControlPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<WebcamConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const configRes = await fetch(`${API_URL}/get-config/${serverId}/webcam`);
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

    const saveConfig = async (newConfig: WebcamConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/webcam`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof WebcamConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    if (loading || !config) {
        return <WebcamControlPageSkeleton />;
    }

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contrôle Webcam</h1>
        <p className="text-muted-foreground mt-2">
          Contrôlez l'utilisation de la webcam et du partage d'écran dans les salons vocaux.
        </p>
      </div>
      
      <Separator />

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Options</h2>
          <p className="text-muted-foreground">
            Appliquez une politique globale pour tous les membres dans les salons vocaux.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-module" className="font-bold">Activer le module</Label>
                  <p className="text-sm text-muted-foreground/80">Active ou désactive la gestion des webcams.</p>
                </div>
                <Switch
                    id="enable-module"
                    checked={config.enabled}
                    onCheckedChange={(val) => handleValueChange('enabled', val)}
                />
            </div>
            <Separator />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                <div>
                  <Label htmlFor="webcam-mode" className="font-bold text-sm uppercase text-muted-foreground">Mode de webcam</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Définit les permissions de vidéo et de stream pour les utilisateurs.
                  </p>
                </div>
                 <Select value={config.mode} onValueChange={(value) => handleValueChange('mode', value)}>
                    <SelectTrigger id="webcam-mode" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="allowed">Tout autoriser</SelectItem>
                        <SelectItem value="webcam_only">Webcam seulement</SelectItem>
                        <SelectItem value="stream_only">Stream seulement</SelectItem>
                        <SelectItem value="disallowed">Tout désactiver</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    