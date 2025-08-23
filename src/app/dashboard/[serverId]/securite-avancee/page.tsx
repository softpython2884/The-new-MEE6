

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Combobox } from '@/components/ui/combobox';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

interface SecurityAlertsConfig {
    enabled: boolean;
    alert_channel_id: string | null;
    account_age_check_enabled: boolean;
    account_age_threshold_days: number;
    similar_username_check_enabled: boolean;
    similar_username_sensitivity: number;
}
interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}

function PageSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
            </CardHeader>
            <CardContent className="space-y-8">
                <Skeleton className="h-10 w-full" />
                <Separator/>
                <Skeleton className="h-24 w-full" />
                <Separator/>
                <Skeleton className="h-24 w-full" />
            </CardContent>
        </Card>
    );
}

export default function AdvancedSecurityPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<SecurityAlertsConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [sliderValue, setSliderValue] = useState([80]);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/security-alerts`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                setConfig(configData);
                setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0));
                setSliderValue([configData.similar_username_sensitivity || 80]);
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);
    
    const saveConfig = async (newConfig: SecurityAlertsConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/security-alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };

    const handleValueChange = (key: keyof SecurityAlertsConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };
    
    const handleSliderCommit = (value: number[]) => {
        handleValueChange('similar_username_sensitivity', value[0]);
    };

    if (loading || !config) {
        return <PageSkeleton />;
    }

    const channelOptions = [
        { value: 'none', label: 'Aucun' },
        ...channels.map(c => ({ value: c.id, label: `# ${c.name}` }))
    ];

    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sécurité Avancée</h1>
                <p className="text-muted-foreground mt-2">
                    Détectez les comptes potentiellement malveillants lors de leur arrivée.
                </p>
            </div>
            
            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Configuration Générale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-module" className="font-bold">Activer le module</Label>
                             <p className="text-sm text-muted-foreground/80">Active ou désactive toutes les alertes de sécurité.</p>
                        </div>
                        <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                    <Separator/>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                        <div>
                            <Label htmlFor="alert-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon d'alertes</Label>
                            <p className="text-sm text-muted-foreground/80">
                                Le salon où envoyer les notifications de sécurité.
                            </p>
                        </div>
                        <Combobox
                            options={channelOptions}
                            value={config.alert_channel_id || 'none'}
                            onChange={(value) => handleValueChange('alert_channel_id', value === 'none' ? null : value)}
                            placeholder="Sélectionner un salon"
                            searchPlaceholder="Rechercher un salon..."
                            emptyPlaceholder="Aucun salon trouvé."
                            className="w-full md:w-[280px]"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Vérification de l'Âge du Compte</CardTitle>
                    <CardDescription>
                        Recevez une alerte si un compte créé trop récemment rejoint le serveur.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-age-check" className="font-bold">Activer la vérification</Label>
                        </div>
                        <Switch id="enable-age-check" checked={config.account_age_check_enabled} onCheckedChange={(val) => handleValueChange('account_age_check_enabled', val)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="age-threshold">Âge minimum du compte (en jours)</Label>
                        <Input 
                            id="age-threshold" 
                            type="number" 
                            value={config.account_age_threshold_days}
                            onChange={(e) => handleValueChange('account_age_threshold_days', parseInt(e.target.value))}
                            className="w-24"
                        />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Vérification des Noms Similaires</CardTitle>
                    <CardDescription>
                        Recevez une alerte si un membre rejoint avec un nom d'utilisateur très proche de celui d'un membre existant.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-name-check" className="font-bold">Activer la vérification</Label>
                        </div>
                        <Switch id="enable-name-check" checked={config.similar_username_check_enabled} onCheckedChange={(val) => handleValueChange('similar_username_check_enabled', val)} />
                    </div>
                    <div className="space-y-4">
                        <Label htmlFor="name-sensitivity">Seuil de sensibilité</Label>
                         <p className="text-sm text-muted-foreground/80">
                            Plus le pourcentage est élevé, plus le système sera strict pour détecter les similarités.
                        </p>
                        <div className="flex items-center gap-4">
                            <Slider 
                                id="name-sensitivity" 
                                value={sliderValue} 
                                onValueChange={setSliderValue}
                                onValueCommit={handleSliderCommit}
                                max={95}
                                min={50} 
                                step={1} 
                                className="w-full" />
                            <span className="font-mono text-lg w-16 text-center">{sliderValue[0]}%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
