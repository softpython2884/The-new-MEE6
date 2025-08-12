
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Palette } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface ContentAiConfig {
    enabled: boolean;
    premium: boolean;
    default_tone: 'familiar' | 'professional' | 'narrative';
    custom_instructions: string;
    command_permissions: { [key: string]: string | null };
}
interface DiscordRole {
    id: string;
    name: string;
}

const contentCommand = {
    name: '/iacontent',
    key: 'iacontent',
    description: 'Rédige des règles, annonces et génère des images avec l\'IA.',
};

function AiContentCreatorPageContent({ isPremium }: { isPremium: boolean }) {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<ContentAiConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/content-ai`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                
                setConfig(configData);
                setRoles(serverDetailsData.roles);
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: ContentAiConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/content-ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof ContentAiConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        handleValueChange('command_permissions', newPermissions);
    };
    
    if (loading || !config) {
        return <Skeleton className="w-full h-[500px]" />;
    }

    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <div className="space-y-8">
            {/* Section Options */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Options du Créateur</h2>
                            <p className="text-muted-foreground">
                                Définissez le ton et les instructions par défaut pour la génération de contenu.
                            </p>
                        </div>
                        <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                    <Label
                        htmlFor="default-tone"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Ton par défaut
                    </Label>
                    </div>
                    <Select value={config.default_tone} onValueChange={(val: 'familiar' | 'professional' | 'narrative') => handleValueChange('default_tone', val)}>
                    <SelectTrigger id="default-tone" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un ton" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="familiar">Familier</SelectItem>
                        <SelectItem value="professional">Professionnel</SelectItem>
                        <SelectItem value="narrative">Narratif (RP)</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label
                    htmlFor="custom-tone"
                    className="font-bold text-sm uppercase text-muted-foreground"
                    >
                    Instructions de ton personnalisé
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                    Décrivez ici le ton personnalisé que l'IA doit adopter.
                    </p>
                    <Textarea
                    id="custom-tone"
                    placeholder="Adopte un ton humoristique et utilise beaucoup d'emojis..."
                    rows={4}
                    defaultValue={config.custom_instructions}
                    onBlur={(e) => handleValueChange('custom_instructions', e.target.value)}
                    />
                </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Section Commandes */}
            <div className="space-y-6">
                <div>
                <h2 className="text-xl font-bold">Commandes</h2>
                <p className="text-muted-foreground">
                    Gérez la permission pour la commande de ce module.
                </p>
                </div>
                <Card key={contentCommand.name}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    <span>{contentCommand.name}</span>
                    </CardTitle>
                    <CardDescription>{contentCommand.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                    <Label
                        htmlFor={`role-select-${contentCommand.name}`}
                        className="text-sm font-medium"
                    >
                        Rôle minimum requis
                    </Label>
                    <Select
                        value={config.command_permissions[contentCommand.key] || 'none'}
                        onValueChange={(value) => handlePermissionChange(contentCommand.key, value)}
                    >
                        <SelectTrigger id={`role-select-${contentCommand.name}`} className="w-full">
                        <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectGroup>
                             <SelectItem value="none">Admin seulement</SelectItem>
                             {roles.filter(r => r.name !== '@everyone').map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                        </SelectContent>
                    </Select>
                    </div>
                </CardContent>
                </Card>
            </div>
            </div>
        </PremiumFeatureWrapper>
    );
}

export default function AiContentCreatorPage() {
    const { serverInfo, loading } = useServerInfo();
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Créateur de Contenu IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Générez des annonces, des règles ou des images directement avec l'IA.
        </p>
      </div>

      <Separator />

      {loading ? (
        <Skeleton className="w-full h-[500px]" />
      ) : (
        <AiContentCreatorPageContent isPremium={serverInfo?.isPremium || false} />
      )}
    </div>
  );
}
