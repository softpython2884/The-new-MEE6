
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Shield, Settings, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// --- Types ---
interface SanctionPreset {
    name: string;
    action: 'warn' | 'mute' | 'kick' | 'ban';
    duration?: string; // e.g., '10m', '1h'
    reason: string;
}
interface ModerationConfig {
  enabled: boolean;
  log_channel_id: string | null;
  dm_user_on_action: boolean;
  command_permissions: { [command: string]: string | null };
  presets: SanctionPreset[];
  auto_sanctions: {
      warn_count: number;
      action: 'mute' | 'kick' | 'ban';
      duration?: string;
  }[];
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
    { name: '/ban', key: 'ban', description: 'Bannit un utilisateur.' },
    { name: '/unban', key: 'unban', description: "Révoque un bannissement." },
    { name: '/kick', key: 'kick', description: 'Expulse un utilisateur.' },
    { name: '/mute', key: 'mute', description: 'Rend un utilisateur muet.' },
    { name: '/warn', key: 'warn', description: 'Avertit un utilisateur.' },
    { name: '/listwarns', key: 'listwarns', description: "Liste les avertissements d'un utilisateur." },
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
        const [configRes, serverDetailsRes] = await Promise.all([
          fetch(`${API_URL}/get-config/${serverId}/moderation`),
          fetch(`${API_URL}/get-server-details/${serverId}`)
        ]);
        if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch data');
        const configData = await configRes.json();
        const serverDetailsData = await serverDetailsRes.json();
        setConfig(configData);
        setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0));
        setRoles(serverDetailsData.roles);
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [serverId, toast]);

  const saveConfig = async (newConfig: ModerationConfig) => {
    setConfig(newConfig); // Optimistic update
    try {
      await fetch(`${API_URL}/update-config/${serverId}/moderation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    } catch (error) {
      toast({ title: "Erreur", description: "La sauvegarde a échoué.", variant: "destructive" });
    }
  };

  const handleValueChange = (key: keyof ModerationConfig, value: any) => {
    if (!config) return;
    saveConfig({ ...config, [key]: value });
  };
  
  const handlePermissionChange = (commandKey: string, roleId: string) => {
    if (!config) return;
    const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
    saveConfig({ ...config, command_permissions: newPermissions });
  };

  // --- Preset Handlers ---
  const addPreset = () => {
    if (!config) return;
    const newPreset: SanctionPreset = { name: 'Nouvelle Sanction', action: 'warn', reason: '' };
    handleValueChange('presets', [...config.presets, newPreset]);
  };
  const updatePreset = (index: number, updatedPreset: SanctionPreset) => {
    if (!config) return;
    const newPresets = [...config.presets];
    newPresets[index] = updatedPreset;
    handleValueChange('presets', newPresets);
  };
  const removePreset = (index: number) => {
    if (!config) return;
    handleValueChange('presets', config.presets.filter((_, i) => i !== index));
  };

  if (loading || !config) {
    return <ModerationPageSkeleton />;
  }

  const channelOptions = [
      { value: 'none', label: 'Désactivé' },
      ...channels.map(c => ({ value: c.id, label: `# ${c.name}` }))
  ];
  
  const roleOptions = [
      { value: 'none', label: 'Admin seulement' },
      ...roles.filter(r => r.name !== '@everyone').map(r => ({ value: r.id, label: r.name }))
  ];

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modération de Base</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les sanctions, permissions et automatisez les avertissements.
        </p>
      </div>
      
      <Separator />

      {/* Section Options */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings />Options Générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="enable-module" className="font-bold">Activer le module</Label>
                        <p className="text-sm text-muted-foreground/80">Active ou désactive toutes les commandes de modération.</p>
                    </div>
                    <Switch id="enable-module" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                </div>
               <Separator />
               <div className="flex items-center justify-between">
                <div>
                  <Label className="font-bold">Salon de logs</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Le salon où envoyer les logs de modération.
                  </p>
                </div>
                 <Combobox
                    options={channelOptions}
                    value={config.log_channel_id || 'none'}
                    onChange={(value) => handleValueChange('log_channel_id', value === 'none' ? null : value)}
                    placeholder="Sélectionner un salon"
                    searchPlaceholder="Rechercher un salon..."
                    emptyPlaceholder="Aucun salon trouvé."
                    className="w-[240px]"
                 />
              </div>
              <Separator/>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-bold">Notifier l'utilisateur en DM</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Envoyer un message privé à l'utilisateur lorsqu'une sanction est appliquée.
                  </p>
                </div>
                <Switch 
                    checked={config.dm_user_on_action}
                    onCheckedChange={(checked) => handleValueChange('dm_user_on_action', checked)}
                />
              </div>
          </CardContent>
      </Card>
      
      {/* Section Sanctions Prédéfinies */}
       <Card>
        <CardHeader>
          <CardTitle>Sanctions Prédéfinies</CardTitle>
          <CardDescription>
            Configurez des sanctions rapides pour vos modérateurs. Celles-ci seront disponibles dans les commandes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.presets.map((preset, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-4 border rounded-lg bg-card-foreground/5">
              <div className="space-y-1">
                <Label className="text-xs">Nom du preset</Label>
                <Input placeholder="Ex: Spam" value={preset.name} onChange={e => updatePreset(index, {...preset, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <Label className="text-xs">Action</Label>
                <Select value={preset.action} onValueChange={(val: any) => updatePreset(index, {...preset, action: val})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="warn">Avertir</SelectItem>
                    <SelectItem value="mute">Rendre Muet</SelectItem>
                    <SelectItem value="kick">Expulser</SelectItem>
                    <SelectItem value="ban">Bannir</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                 <Label className="text-xs">Raison</Label>
                 <Input placeholder="Raison de la sanction" value={preset.reason} onChange={e => updatePreset(index, {...preset, reason: e.target.value})} />
              </div>

              <div className="flex items-end gap-2">
                {preset.action === 'mute' && (
                    <div className="space-y-1 flex-grow">
                        <Label className="text-xs">Durée</Label>
                        <Input placeholder="Ex: 10m, 1h" value={preset.duration || ''} onChange={e => updatePreset(index, {...preset, duration: e.target.value})} />
                    </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => removePreset(index)}><Trash2 className="text-destructive"/></Button>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={addPreset}><PlusCircle/>Ajouter une sanction</Button>
        </CardContent>
      </Card>

      {/* Section Commandes */}
       <Card>
        <CardHeader>
            <CardTitle>Permissions des Commandes</CardTitle>
            <CardDescription>Gérez les permissions pour chaque commande de modération.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {moderationCommands.map(command => (
                 <div key={command.name} className="space-y-2">
                     <Label htmlFor={`role-select-${command.name}`} className="font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {command.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">{command.description}</p>
                    <Combobox
                        options={roleOptions}
                        value={config.command_permissions?.[command.key] || 'none'}
                        onChange={(value) => handlePermissionChange(command.key, value)}
                        placeholder="Sélectionner un rôle"
                        searchPlaceholder="Rechercher un rôle..."
                        emptyPlaceholder="Aucun rôle trouvé."
                     />
                </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ModerationPageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Separator />
      <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
      <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
    </div>
  )
}
