
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface WebcamConfig {
    enabled: boolean;
    mode: 'allowed' | 'video_allowed' | 'disallowed';
    exempt_roles: string[];
}

interface DiscordRole {
    id: string;
    name: string;
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
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/webcam`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');

                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                
                // --- Migration de l'ancienne configuration ---
                if (['webcam_only', 'stream_only'].includes(configData.mode)) {
                    configData.mode = 'video_allowed';
                }
                // -----------------------------------------

                setConfig(configData);
                setRoles(serverDetailsData.roles.filter((r: DiscordRole) => r.name !== '@everyone'));

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

    const handleRoleToggle = (roleId: string) => {
        if (!config) return;
        const newExemptRoles = config.exempt_roles.includes(roleId)
            ? config.exempt_roles.filter(id => id !== roleId)
            : [...config.exempt_roles, roleId];
        handleValueChange('exempt_roles', newExemptRoles);
    };

    if (loading || !config) {
        return <WebcamControlPageSkeleton />;
    }

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contrôle Vidéo</h1>
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
                  <p className="text-sm text-muted-foreground/80">Active ou désactive la gestion de la vidéo.</p>
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
                  <Label htmlFor="webcam-mode" className="font-bold text-sm uppercase text-muted-foreground">Politique d'utilisation de la vidéo</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Choisissez une politique globale qui s'appliquera à tous les membres (non exemptés).
                  </p>
                </div>
                 <Select value={config.mode} onValueChange={(value) => handleValueChange('mode', value)}>
                    <SelectTrigger id="webcam-mode" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="allowed">Tout autoriser</SelectItem>
                        <SelectItem value="video_allowed">Vidéo autorisée</SelectItem>
                        <SelectItem value="disallowed">Vidéo interdite</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Separator />
             <div className="space-y-2">
                <Label htmlFor="exempt-roles" className="font-bold text-sm uppercase text-muted-foreground">Rôles exemptés</Label>
                 <p className="text-sm text-muted-foreground/80">
                    Les utilisateurs avec ces rôles ne seront pas affectés par la politique ci-dessus.
                </p>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <div className="flex-1 text-left truncate">
                                {config.exempt_roles.length > 0 
                                    ? config.exempt_roles.map(id => (
                                        <Badge key={id} variant="secondary" className="mr-1 mb-1">{roles.find(r => r.id === id)?.name || id}</Badge>
                                    ))
                                    : "Sélectionner des rôles..."}
                            </div>
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        <DropdownMenuLabel>Choisir les rôles</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {roles.map(role => (
                            <DropdownMenuCheckboxItem
                                key={role.id}
                                checked={config.exempt_roles.includes(role.id)}
                                onCheckedChange={() => handleRoleToggle(role.id)}
                                onSelect={(e) => e.preventDefault()} // Prevent closing menu on select
                            >
                                {role.name}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
