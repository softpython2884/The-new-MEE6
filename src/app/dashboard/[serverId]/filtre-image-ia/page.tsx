'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function ImageFilterPage() {
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Filtre d'Image IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Scannez les images envoyées par les membres pour détecter du contenu potentiellement indésirable.
        </p>
      </div>
      
      <Separator />

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Options</h2>
           <p className="text-muted-foreground">
            Configurez le niveau de sensibilité de la modération d'images par IA.
          </p>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                <div>
                  <Label htmlFor="sensitivity" className="font-bold text-sm uppercase text-muted-foreground">Sensibilité</Label>
                  <p className="text-sm text-muted-foreground/80">
                    Un niveau élevé peut entraîner plus de faux positifs.
                  </p>
                </div>
                 <Select defaultValue="medium">
                    <SelectTrigger id="sensitivity" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
