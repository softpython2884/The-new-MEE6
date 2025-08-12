'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const mockRoles = [
  { id: 'r1', name: '@everyone' },
  { id: 'r2', name: 'Modérateur' },
  { id: 'r3', name: 'Admin' },
  { id: 'r4', name: 'Membre' },
];

const faqCommand = {
    name: '/faq',
    description: "Pose une question à l'assistant communautaire.",
    defaultRole: '@everyone'
};

export default function CommunityAssistantPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assistant Communautaire</h1>
        <p className="text-muted-foreground mt-2">
          Configurez l'IA pour répondre aux questions fréquentes de votre communauté.
        </p>
      </div>
      
      <Separator />

      {/* Section Options */}
      <Card>
          <CardHeader>
              <h2 className="text-xl font-bold">Options</h2>
              <p className="text-muted-foreground">
                  Personnalisez le comportement de l'assistant communautaire.
              </p>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                  <div>
                      <Label htmlFor="enable-assistant" className="font-bold text-sm uppercase text-muted-foreground">Activer l'assistant</Label>
                      <p className="text-sm text-muted-foreground/80">
                          Active ou désactive complètement le module.
                      </p>
                  </div>
                  <Switch id="enable-assistant" defaultChecked />
              </div>
              <Separator />
              <div className="space-y-4">
                  <Label htmlFor="confidence-threshold" className="font-bold text-sm uppercase text-muted-foreground">Seuil de confiance</Label>
                  <p className="text-sm text-muted-foreground/80">
                      Le bot ne répondra que si sa confiance est supérieure à ce seuil. (Défaut: 75%)
                  </p>
                  <div className="flex items-center gap-4">
                      <Slider id="confidence-threshold" defaultValue={[75]} max={100} step={1} className="w-full" />
                      <span className="font-mono text-lg">75%</span>
                  </div>
              </div>
          </CardContent>
      </Card>
      
      <Separator />

      {/* Section Commandes */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Commandes</h2>
          <p className="text-muted-foreground">
            Gérez les permissions pour la commande de ce module.
          </p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span>{faqCommand.name}</span>
                </CardTitle>
                <CardDescription>{faqCommand.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                     <Label htmlFor={`role-select-${faqCommand.name}`} className="text-sm font-medium">Rôle minimum requis</Label>
                    <Select defaultValue={mockRoles.find(r => r.name === faqCommand.defaultRole)?.id}>
                        <SelectTrigger id={`role-select-${faqCommand.name}`} className="w-full">
                            <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {mockRoles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Section Questions & Réponses */}
      <div className="space-y-4">
        <div>
            <h2 className="text-xl font-bold">Base de connaissances</h2>
            <p className="text-muted-foreground">
                Définissez ici les paires de questions et réponses que l'assistant utilisera.
            </p>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {/* Exemple de Q&R */}
            <div className="p-4 border rounded-lg bg-card-foreground/5">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base font-semibold">Question 1</Label>
                  <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
                <div className="space-y-2">
                  <Input placeholder="Entrez la question ou des mots-clés" defaultValue="Comment rejoindre le serveur Minecraft ?" />
                  <Textarea placeholder="Entrez la réponse que le bot doit fournir" defaultValue="Pour rejoindre notre serveur Minecraft, utilisez l'adresse IP : play.noserveur.com" />
                </div>
            </div>
          </div>
          <Button variant="default" className="mt-6 w-full">Ajouter une Question/Réponse</Button>
        </Card>
      </div>
    </div>
  );
}
