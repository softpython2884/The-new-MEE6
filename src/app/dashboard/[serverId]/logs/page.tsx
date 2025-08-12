'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';

const mockChannels = [
  { id: 'c1', name: 'general' },
  { id: 'c2', name: 'annonces' },
  { id: 'c3', name: 'logs' },
  { id: 'c4', name: 'modération-logs' },
];

const logOptions = [
    { id: "log-messages", label: "Logs des messages", description: "Journaliser les messages modifiés et supprimés.", defaultChecked: true },
    { id: "log-members", label: "Logs des membres", description: "Journaliser les arrivées, départs et mises à jour des membres.", defaultChecked: true },
    { id: "log-channels", label: "Logs des salons", description: "Journaliser la création, modification et suppression des salons.", defaultChecked: false },
    { id: "log-roles", label: "Logs des rôles", description: "Journaliser la création, modification et suppression des rôles.", defaultChecked: false },
    { id: "log-moderation", label: "Logs de modération", description: "Journaliser les actions de modération (bans, kicks, mutes).", defaultChecked: true },
];

export default function LogsPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs & Notifications</h1>
        <p className="text-muted-foreground mt-2">
            Choisissez les actions à enregistrer et où envoyer les notifications de log.
        </p>
      </div>
      
      <Separator />

      {/* Section Options */}
      <Card>
          <CardHeader>
              <h2 className="text-xl font-bold">Configuration des Logs</h2>
              <p className="text-muted-foreground">
                  Personnalisez les événements à journaliser et leur destination.
              </p>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="log-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon de logs principal</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Le salon où envoyer tous les logs par défaut.
                  </p>
                </div>
                 <Select defaultValue="c3">
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Sélectionner un salon" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Salons textuels</SelectLabel>
                            {mockChannels.map(channel => (
                                <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-6">
                {logOptions.map((option, index) => (
                    <React.Fragment key={option.id}>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor={option.id} className="font-bold">{option.label}</Label>
                                <p className="text-sm text-muted-foreground/80">
                                    {option.description}
                                </p>
                            </div>
                            <Switch id={option.id} defaultChecked={option.defaultChecked} />
                        </div>
                        {index < logOptions.length - 1 && <Separator />}
                    </React.Fragment>
                ))}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
