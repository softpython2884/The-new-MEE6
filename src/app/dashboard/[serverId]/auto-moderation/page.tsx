'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bot, Link as LinkIcon, CaseUpper, Smile, AtSign, Pilcrow, MessagesSquare, Code } from 'lucide-react';

const autoModRules = [
    { id: 'forbidden-vocabulary', label: 'Vocabulaire interdit', icon: Bot, defaultChecked: false },
    { id: 'discord-invites', label: 'Invitations Discord', icon: LinkIcon, defaultChecked: true },
    { id: 'external-links', label: 'Liens externes', icon: LinkIcon, defaultChecked: false },
    { id: 'excessive-caps', label: 'Majuscules excessives', icon: CaseUpper, defaultChecked: true },
    { id: 'excessive-emojis', label: 'Émojis excessifs', icon: Smile, defaultChecked: false },
    { id: 'excessive-mentions', label: 'Mentions excessives', icon: AtSign, defaultChecked: true },
    { id: 'forbidden-pings', label: 'Pings interdits', icon: AtSign, defaultChecked: false },
    { id: 'message-spam', label: 'Spam de messages', icon: MessagesSquare, defaultChecked: true },
    { id: 'forbidden-markdown', label: 'Markdown interdit', icon: Code, defaultChecked: false },
];

export default function AutoModerationPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auto-Modération</h1>
        <p className="text-muted-foreground mt-2">
            Définir des règles pour détecter et sanctionner automatiquement les comportements indésirables.
        </p>
      </div>
      
      <Separator />

      {/* Section Options */}
      <Card>
          <CardHeader>
              <h2 className="text-xl font-bold">Règles d'Auto-Modération</h2>
              <p className="text-muted-foreground">
                  Activez ou désactivez les règles de modération automatique pour le serveur. Chaque règle peut avoir des options avancées (à venir).
              </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {autoModRules.map((rule) => (
                <Card key={rule.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <rule.icon className="w-6 h-6 text-primary" />
                    <Label htmlFor={rule.id} className="text-base font-medium">{rule.label}</Label>
                  </div>
                  <Switch id={rule.id} defaultChecked={rule.defaultChecked} />
                </Card>
              ))}
            </div>
          </CardContent>
      </Card>

      {/* D'autres sections pour les actions et les exceptions pourraient être ajoutées ici */}

    </div>
  );
}