
'use client';

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

function ModAssistantPageContent({ isPremium }: { isPremium: boolean }) {
    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <Card>
                <CardHeader>
                <h2 className="text-xl font-bold">Options de l'Assistant Modération</h2>
                <p className="text-muted-foreground">
                    Configurez comment l'IA doit intervenir sur les messages des membres.
                </p>
                </CardHeader>
                <CardContent>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                    <div>
                    <Label
                        htmlFor="mode"
                        className="font-bold text-sm uppercase text-muted-foreground"
                    >
                        Mode de fonctionnement
                    </Label>
                    <p className="text-sm text-muted-foreground/80">
                        Choisissez le niveau d'autonomie de l'IA.
                    </p>
                    </div>
                    <Select defaultValue="monitor">
                    <SelectTrigger id="mode" className="w-full md:w-[280px]">
                        <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="monitor">Surveiller seulement</SelectItem>
                        <SelectItem value="recommend">Recommander des actions</SelectItem>
                        <SelectItem value="auto-act">Agir automatiquement</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                </CardContent>
            </Card>
        </PremiumFeatureWrapper>
    )
}

export default function ModAssistantPage() {
    const { serverInfo, loading } = useServerInfo();
  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Assistant Modération IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Modération assistée par IA pour détecter les comportements toxiques. Ce module n'a pas de commandes directes.
        </p>
      </div>

      <Separator />

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <ModAssistantPageContent isPremium={serverInfo?.isPremium || false} />
      )}
    </div>
  );
}
