
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface PrivateRoomsConfig {
    enabled: boolean;
    creation_channel: string | null;
    category_id: string | null;
    embed_message: string;
    archive_summary: boolean;
    command_permissions: { [key: string]: string | null };
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

const privateRoomCommands = [
  {
    name: '/addprivate',
    key: 'addprivate',
    description: 'Envoie le panneau de création de salon privé.',
  },
  {
    name: '/privateresum',
    key: 'privateresum',
    description: "Génère un résumé IA d'un salon avant son archivage.",
  },
];

function PrivateRoomsPageSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-full mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default function PrivateRoomsPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<PrivateRoomsConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [categories, setCategories] = useState<DiscordChannel[]>([]);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/private-rooms`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');

                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();

                setConfig(configData);
                setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0)); // Text channels
                setCategories(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 4)); // Category channels
                setRoles(serverDetailsData.roles);

            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);
    
    const saveConfig = async (newConfig: PrivateRoomsConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/private-rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof PrivateRoomsConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        handleValueChange('command_permissions', newPermissions);
    };

    if (loading || !config) {
        return <PrivateRoomsPageSkeleton />;
    }

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Salons Privés</h1>
        <p className="text-muted-foreground mt-2">
          Configurez le système de création de salons privés pour les tickets ou
          les groupes.
        </p>
      </div>

      <Separator />

      {/* Section Options */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Options des Salons Privés</h2>
          <p className="text-muted-foreground">
            Personnalisez le fonctionnement de la création de salons.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
              <div>
                  <Label htmlFor="enable-module" className="font-bold">Activer le module</Label>
              </div>
              <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
          </div>
          <Separator />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
            <div>
              <Label
                htmlFor="creation-channel"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Salon de création
              </Label>
              <p className="text-sm text-muted-foreground/80">
                Salon où poster le message permettant de créer un salon privé.
              </p>
            </div>
            <Select 
                value={config.creation_channel || 'none'} 
                onValueChange={(val) => handleValueChange('creation_channel', val === 'none' ? null : val)}
            >
              <SelectTrigger
                id="creation-channel"
                className="w-full md:w-[280px]"
              >
                <SelectValue placeholder="Sélectionner un salon" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Salons textuels</SelectLabel>
                  <SelectItem value="none">Aucun</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      # {channel.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
            <div>
              <Label
                htmlFor="private-category"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Catégorie des salons
              </Label>
              <p className="text-sm text-muted-foreground/80">
                Catégorie où les nouveaux salons privés seront créés.
              </p>
            </div>
            <Select 
                value={config.category_id || 'none'}
                onValueChange={(val) => handleValueChange('category_id', val === 'none' ? null : val)}
            >
              <SelectTrigger
                id="private-category"
                className="w-full md:w-[280px]"
              >
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Catégories</SelectLabel>
                   <SelectItem value="none">Aucune</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label
              htmlFor="embed-message"
              className="font-bold text-sm uppercase text-muted-foreground"
            >
              Message de l'embed
            </Label>
            <p className="text-sm text-muted-foreground/80">
              Le texte à afficher dans l'embed de création de ticket.
            </p>
            <Textarea
              id="embed-message"
              placeholder="Cliquez sur le bouton pour créer un nouveau ticket..."
              rows={4}
              defaultValue={config.embed_message}
              onBlur={(e) => handleValueChange('embed_message', e.target.value)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="enable-ai-summary"
                className="font-bold text-sm uppercase text-muted-foreground"
              >
                Résumé IA pour l'archivage (Bientôt)
              </Label>
              <p className="text-sm text-muted-foreground/80">
                Générer un résumé par l'IA lors de l'archivage d'un salon.
              </p>
            </div>
            <Switch 
                id="enable-ai-summary" 
                checked={config.archive_summary} 
                onCheckedChange={(val) => handleValueChange('archive_summary', val)}
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
            Gérez les permissions pour chaque commande de ce module.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {privateRoomCommands.map((command) => (
            <Card key={command.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  <span>{command.name}</span>
                </CardTitle>
                <CardDescription>{command.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label
                    htmlFor={`role-select-${command.key}`}
                    className="text-sm font-medium"
                  >
                    Rôle minimum requis
                  </Label>
                  <Select
                    value={config.command_permissions[command.key] || 'none'}
                    onValueChange={(val) => handlePermissionChange(command.key, val)}
                  >
                    <SelectTrigger id={`role-select-${command.key}`} className="w-full">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="none">Admin seulement</SelectItem>
                            {roles.filter(r => r.name !== '@everyone').map(role => (
                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
