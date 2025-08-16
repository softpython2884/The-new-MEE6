
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';


// Types pour la configuration et les données du serveur
interface ModerationConfig {
  enabled: boolean;
  log_channel_id: string | null;
  dm_user_on_action: boolean;
  premium: boolean;
  command_permissions: {
      [command: string]: string | null;
  }
  presets: any[];
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

interface DiscordRole {
    id: string;
    name: string;
    color: number;
}


const moderationCommands = [
    {
        name: '/ban',
        key: 'ban',
        description: 'Bannit un utilisateur du serveur.',
    },
    {
        name: '/unban',
        key: 'unban',
        description: "Révoque le bannissement d'un utilisateur.",
    },
    {
        name: '/kick',
        key: 'kick',
        description: 'Expulse un utilisateur du serveur.',
    },
    {
        name: '/mute',
        key: 'mute',
        description: 'Rend un utilisateur muet (timeout).',
    },
];

export default function ModerationPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const { toast } = useToast();

  const [config, setConfig] = useState<ModerationConfig | null>(null);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  useEffect(() => {
    if (!serverId) return;

    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch module config
        const configRes = await fetch(`${API_URL}/get-config/${serverId}/moderation`);
        if (!configRes.ok) throw new Error(`HTTP error! status: ${configRes.status}`);
        const configData = await configRes.json();
        setConfig(configData);

        // Fetch server details (which includes channels and roles)
        const serverDetailsRes = await fetch(`${API_URL}/get-server-details/${serverId}`);
        if (!serverDetailsRes.ok) throw new Error(`HTTP error! status: ${serverDetailsRes.status}`);
        const serverDetailsData = await serverDetailsRes.json();
        setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0)); // Text channels
        setRoles(serverDetailsData.roles);

      } catch (error) {
        console.error("Failed to fetch data", error);
        toast({
            title: "Erreur",
            description: "Impossible de charger les données du serveur.",
            variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serverId, toast]);

  const saveConfig = async (newConfig: ModerationConfig) => {
    setConfig(newConfig); // Optimistic UI update
    try {
      const response = await fetch(`${API_URL}/update-config/${serverId}/moderation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });
      if (!response.ok) throw new Error("Failed to save");
      // toast({
      //   title: "Succès",
      //   description: "Configuration enregistrée.",
      // });
    } catch (error) {
      console.error('Failed to update config', error);
      toast({
        title: "Erreur",
        description: "La sauvegarde a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
      // Optionally revert state here
    }
  };

  const handleValueChange = (key: keyof ModerationConfig, value: any) => {
    if (!config) return;
    saveConfig({ ...config, [key]: value });
  };
  
  const handlePermissionChange = (commandKey: string, roleId: string) => {
    if (!config) return;
    
    const newPermissions = {
      ...config.command_permissions,
      [commandKey]: roleId,
    };
    saveConfig({ ...config, command_permissions: newPermissions });
  };
  
  const getRoleColor = (color: number) => {
    if (color === 0) return '#FFFFFF';
    return `#${color.toString(16).padStart(6, '0')}`;
  }


  if (loading) {
    return <ModerationPageSkeleton />;
  }

  if (!config) {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="p-8">
                <CardTitle>Erreur de chargement</CardTitle>
                <CardDescription>Impossible de charger la configuration. Veuillez rafraîchir la page.</CardDescription>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bans & Kicks</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les sanctions de base pour votre serveur.
        </p>
      </div>
      
      <Separator />

      {/* Section Options */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Options</h2>
          <p className="text-muted-foreground">
            Personnalisez le comportement des actions de modération.
          </p>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
               <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="log-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon de logs</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Le salon où envoyer les logs de modération.
                  </p>
                </div>
                 <Select 
                    value={config.log_channel_id || 'none'}
                    onValueChange={(value) => handleValueChange('log_channel_id', value === 'none' ? null : value)}
                 >
                    <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="Sélectionner un salon" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Salons textuels</SelectLabel>
                             <SelectItem value="none">Désactivé</SelectItem>
                            {channels.map(channel => (
                                <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
              </div>
              <Separator/>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dm-sanction" className="font-bold text-sm uppercase text-muted-foreground">Notifier l'utilisateur en DM</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Envoyer un message privé à l'utilisateur lorsqu'une sanction est appliquée.
                  </p>
                </div>
                <Switch 
                    id="dm-sanction" 
                    checked={config.dm_user_on_action}
                    onCheckedChange={(checked) => handleValueChange('dm_user_on_action', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
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
            {moderationCommands.map(command => {
                 const selectedRoleId = config.command_permissions?.[command.key] || '';
                 return (
                 <Card key={command.name}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <span>{command.name}</span>
                        </CardTitle>
                        <CardDescription>{command.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                             <Label htmlFor={`role-select-${command.name}`} className="text-sm font-medium">Rôle minimum requis</Label>
                            <Select
                                value={selectedRoleId || ''}
                                onValueChange={(value) => handlePermissionChange(command.key, value)}
                            >
                                <SelectTrigger id={`role-select-${command.name}`} className="w-full">
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Rôles</SelectLabel>
                                        {roles.filter(r => r.name !== '@everyone').sort((a,b) => (a.name > b.name) ? 1 : -1).map(role => (
                                            <SelectItem key={role.id} value={role.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getRoleColor(role.color) }}></span>
                                                    {role.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )})}
        </div>
      </div>


      <Separator />

      {/* Section Sanctions prédéfinies */}
      <div className="space-y-4">
        <div>
            <h2 className="text-xl font-bold">Sanctions prédéfinies</h2>
            <p className="text-muted-foreground">
                Configurez des sanctions prédéfinies afin de faciliter et de réglementer les sanctions applicables par vos modérateurs.
            </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">Vous n'avez créé aucune sanction prédéfinie.</p>
            <Button variant="default">Créer une sanction prédéfinie</Button>
        </div>
      </div>
    </div>
  );
}


function ModerationPageSkeleton() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
        <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
        </div>
        <Separator />
        <div className="space-y-6">
            <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-80" />
            </div>
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="h-10 w-[240px]" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                         <div>
                            <Skeleton className="h-4 w-48 mb-2" />
                            <Skeleton className="h-3 w-72" />
                        </div>
                        <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
        <Separator />
        <div className="space-y-6">
           <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-6 w-32" />
                            </CardTitle>
                            <Skeleton className="h-4 w-full mt-2" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  )
}
