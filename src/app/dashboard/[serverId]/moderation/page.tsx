'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ModerationPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modération</h1>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold">Options</h2>
          <p className="text-muted-foreground">
            Personnalisez le comportement des actions de modération.
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dm-sanction" className="font-bold text-sm uppercase text-muted-foreground">Envoyer un mp lors d'une sanction</Label>
              <p className="text-sm text-muted-foreground/80">
                Voulez-vous qu'un membre sanctionné en soit informé en messages privés ?
              </p>
            </div>
            <Switch id="dm-sanction" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
             <div>
                <Label htmlFor="hide-mod-response" className="font-bold text-sm uppercase text-muted-foreground">Masquer les réponses des commandes de modération</Label>
                <p className="text-sm text-muted-foreground/80">
                  Voulez-vous que les réponses aux commandes de modération soient uniquement visibles par le modérateur qui les a utilisées ?
                </p>
            </div>
            <Switch id="hide-mod-response" />
          </div>
           <div className="flex items-center justify-between">
             <div>
                <Label htmlFor="hide-mod-name" className="font-bold text-sm uppercase text-muted-foreground">Masquer le pseudo du modérateur en mp</Label>
                <p className="text-sm text-muted-foreground/80">
                  Voulez-vous que les pseudos des modérateurs soient masqués dans les messages de sanctions envoyés en MP ?
                </p>
            </div>
            <Switch id="hide-mod-name" />
          </div>
        </div>
      </div>
      
      <Separator />

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
