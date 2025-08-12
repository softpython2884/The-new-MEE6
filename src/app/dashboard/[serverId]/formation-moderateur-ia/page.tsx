
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface ModTrainingConfig {
    enabled: boolean;
    onboarding_flow_enabled: boolean;
    dm_delay: 'immediate' | 'delayed';
    mentor_messages: string;
    auto_role_assignment: boolean;
}

function ModTrainingPageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<ModTrainingConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const configRes = await fetch(`${API_URL}/get-config/${serverId}/mod-training`);
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

    const saveConfig = async (newConfig: ModTrainingConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/mod-training`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof ModTrainingConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };
    
    if (loading || !config) {
        return <Skeleton className="h-96 w-full" />;
    }

    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <Card>
                <CardHeader>
                <h2 className="text-xl font-bold">Options de Formation</h2>
                <p className="text-muted-foreground">
                    Configurez le flux d'accueil pour les nouveaux arrivants.
                </p>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                    <Label
                        htmlFor="enable-onboarding"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Activer le flux d'onboarding
                    </Label>
                    </div>
                    <Switch id="enable-onboarding" checked={config.onboarding_flow_enabled} onCheckedChange={(val) => handleValueChange('onboarding_flow_enabled', val)} />
                </div>
                <Separator />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                    <Label
                        htmlFor="dm-delay"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Délai d'envoi des messages privés
                    </Label>
                    </div>
                    <Select value={config.dm_delay} onValueChange={(val) => handleValueChange('dm_delay', val)}>
                    <SelectTrigger id="dm-delay" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un délai" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="immediate">Immédiat</SelectItem>
                        <SelectItem value="delayed">Différé (1 heure)</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label
                    htmlFor="mentor-messages"
                    className="font-bold text-sm uppercase text-muted-foreground"
                    >
                    Messages du Mentor (privé)
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                    Configurez les messages que le bot enverra. Utilisez {"{user}"} pour mentionner le membre.
                    </p>
                    <Textarea
                    id="mentor-messages"
                    placeholder="Bienvenue sur le serveur, {user} ! Voici quelques règles à connaître..."
                    rows={5}
                    defaultValue={config.mentor_messages}
                    onBlur={(e) => handleValueChange('mentor_messages', e.target.value)}
                    />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div>
                    <Label
                        htmlFor="auto-role-assignment"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Attribution automatique de rôles (Bientôt)
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                        Activer l'attribution de rôles en fonction des réponses aux Q&R.
                    </p>
                    </div>
                    <Switch id="auto-role-assignment" checked={config.auto_role_assignment} onCheckedChange={(val) => handleValueChange('auto_role_assignment', val)} disabled />
                </div>
                </CardContent>
            </Card>
        </PremiumFeatureWrapper>
    )
}

export default function ModTrainingPage() {
    const { serverInfo, loading } = useServerInfo();
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Formation Modérateur IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Créez un parcours d'onboarding pour les nouveaux membres avec des messages et des rôles automatiques.
        </p>
      </div>

      <Separator />

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <ModTrainingPageContent isPremium={serverInfo?.isPremium || false} />
      )}
    </div>
  );
}
