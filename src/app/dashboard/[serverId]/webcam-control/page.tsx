'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function WebcamControlPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contrôle Webcam</h1>
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
        <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                <div>
                  <Label htmlFor="webcam-mode" className="font-bold text-sm uppercase text-muted-foreground">Mode de webcam</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Définit les permissions de vidéo et de stream pour les utilisateurs.
                  </p>
                </div>
                 <Select defaultValue="allow-all">
                    <SelectTrigger id="webcam-mode" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="allow-all">Tout autoriser</SelectItem>
                        <SelectItem value="webcam-only">Webcam seulement</SelectItem>
                        <SelectItem value="stream-only">Stream seulement</SelectItem>
                        <SelectItem value="disallow-all">Tout désactiver</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
