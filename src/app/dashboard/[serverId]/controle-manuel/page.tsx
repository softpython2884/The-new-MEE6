
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
import { Voicemail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface ManualVoiceConfig {
    enabled: boolean;
    command_permissions: { [key: string]: string | null };
}

interface DiscordRole {
    id: string;
    name: string;
}

const manualVoiceCommands = [
  {
    name: '/join',
    key: 'join',
    description: 'Fait rejoindre le bot dans votre salon vocal.',
  },
  {
    name: '/leave',
    key: 'leave',
    description: 'Fait quitter le bot de son salon vocal.',
  },
];

function ManualControlPageSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-64 w-full" />
        </div>
    );
}


export default function ManualControlPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<ManualVoiceConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/manual-voice-control`),
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

    const saveConfig = async (newConfig: ManualVoiceConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/manual-voice-control`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };

    const handleValueChange = (key: keyof ManualVoiceConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        handleValueChange('command_permissions', newPermissions);
    };

    if (loading || !config) {
        return <ManualControlPageSkeleton />;
    }

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contrôle Manuel (Vocal)</h1>
        <p className="text-muted-foreground mt-2">
          Invitez ou déconnectez manuellement le bot des salons vocaux.
        </p>
      </div>

      <Separator />

        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Activation du module</CardTitle>
                    <Switch
                        checked={config.enabled}
                        onCheckedChange={(val) => handleValueChange('enabled', val)}
                    />
                </div>
            </CardHeader>
        </Card>

      {/* Section Commandes */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Commandes</h2>
          <p className="text-muted-foreground">
            Gérez les permissions pour chaque commande de ce module.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {manualVoiceCommands.map((command) => (
            <Card key={command.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Voicemail className="w-5 h-5 text-primary" />
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
                        <SelectItem value="none">@everyone</SelectItem>
                        {roles.filter(r => r.name !== '@everyone').map(role => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
