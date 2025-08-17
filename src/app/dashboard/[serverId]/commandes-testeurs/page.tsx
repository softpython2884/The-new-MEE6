
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { TestTubeDiagonal, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useServerInfo } from '@/hooks/use-server-info';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { Badge } from '@/components/ui/badge';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface TesterCommandsConfig {
  enabled: boolean;
  command_permissions: { [key: string]: string | null };
}
interface DiscordRole {
    id: string;
    name: string;
    color: number;
}

const specialCommands = [
    { name: '/mp', key: 'mp', description: 'Envoie un message privé à un utilisateur.', type: 'tester' },
    { name: '/webhook', key: 'webhook', description: 'Envoie un message en imitant un utilisateur via un webhook.', type: 'tester' },
    { name: '/tester', key: 'tester', description: 'Gère le statut de Testeur pour les utilisateurs.', type: 'tester' },
    { name: '/givepremium', key: 'givepremium', description: 'Donne ou retire le statut premium à un serveur.', type: 'owner' },
    { name: '/genpremium', key: 'genpremium', description: 'Génère une nouvelle clé d\'activation premium.', type: 'owner' },
    { name: '/giverole', key: 'giverole', description: 'Attribue un rôle spécifié (accès restreint).', type: 'owner' },
    { name: '/disableia', key: 'disableia', description: 'Désactive toutes les fonctionnalités IA globalement.', type: 'owner' },
    { name: '/enableia', key: 'enableia', description: 'Réactive toutes les fonctionnalités IA globalement.', type: 'owner' },
];

export default function TesterCommandsPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();
    const { serverInfo } = useServerInfo();

    const [config, setConfig] = useState<TesterCommandsConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/tester-commands`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);

                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
                
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                
                setConfig(configData);
                setRoles(serverDetailsData.roles);
            } catch (error) {
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les données.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: TesterCommandsConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/tester-commands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({
                title: "Erreur de sauvegarde",
                variant: "destructive",
            });
        }
    };
    
    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        saveConfig({ ...config, command_permissions: newPermissions });
    };

    if (loading || !config) {
        return <PageSkeleton />;
    }

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Commandes Spéciales
             <Badge variant="secondary">Exclusif</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez les permissions pour les commandes réservées aux Testeurs et au Propriétaire du bot.
        </p>
      </div>
      
      <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialCommands.map(command => (
                <Card key={command.name} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                {command.type === 'owner' ? <Crown className="w-5 h-5 text-yellow-400" /> : <TestTubeDiagonal className="w-5 h-5 text-primary" />}
                                <span>{command.name}</span>
                            </span>
                            {command.type === 'owner' && <Badge variant="destructive">Propriétaire</Badge>}
                        </CardTitle>
                        <CardDescription>{command.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-end">
                        {command.type === 'tester' && (
                             <div className="space-y-2">
                                <Label htmlFor={`role-select-${command.key}`} className="text-sm font-medium">Rôle Testeur minimum requis</Label>
                                <Select 
                                    value={config.command_permissions?.[command.key] || 'none'}
                                    onValueChange={(value) => handlePermissionChange(command.key, value)}
                                >
                                    <SelectTrigger id={`role-select-${command.key}`} className="w-full">
                                        <SelectValue placeholder="Sélectionner un rôle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="none">Testeur de base</SelectItem>
                                            {roles.filter(r => r.name !== '@everyone').map(role => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                 <p className="text-xs text-muted-foreground pt-2">Seuls les utilisateurs avec le statut "Testeur" peuvent utiliser cette commande. Vous pouvez restreindre davantage l'accès à un rôle spécifique ici.</p>
                            </div>
                        )}
                         {command.type === 'owner' && (
                             <div className="pt-2">
                                 <p className="text-xs text-yellow-400/80 font-semibold">Seul le propriétaire du bot peut utiliser cette commande.</p>
                             </div>
                         )}
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}

function PageSkeleton() {
    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
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
            </div>
        </div>
    );
}
