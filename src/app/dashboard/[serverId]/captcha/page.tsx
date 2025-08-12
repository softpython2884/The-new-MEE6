
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { useServerInfo } from '@/hooks/use-server-info';
import { Skeleton } from '@/components/ui/skeleton';

const mockChannels = [
  { id: 'c1', name: 'general' },
  { id: 'c2', name: 'annonces' },
  { id: 'c3', name: 'logs' },
  { id: 'c4', name: 'verification' },
];

const mockRoles = [
  { id: 'r1', name: '@everyone' },
  { id: 'r2', name: 'Modérateur' },
  { id: 'r3', name: 'Admin' },
  { id: 'r4', name: 'Membre vérifié' },
];

function CaptchaPageContent({ isPremium }: { isPremium: boolean }) {
    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <Card>
                <CardHeader>
                <h2 className="text-xl font-bold">Options du Captcha</h2>
                <p className="text-muted-foreground">
                    Configurez le système de vérification pour filtrer les raids de bots.
                </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="enable-captcha" className="font-bold">Activer le Captcha</Label>
                            <p className="text-sm text-muted-foreground/80">
                                Active ou désactive complètement le module.
                            </p>
                        </div>
                        <Switch id="enable-captcha" defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                        <div>
                        <Label htmlFor="verification-channel" className="font-bold text-sm uppercase text-muted-foreground">Salon de vérification</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Le salon où les nouveaux membres effectueront la vérification.
                        </p>
                        </div>
                        <Select defaultValue="c4">
                            <SelectTrigger id="verification-channel" className="w-full md:w-[280px]">
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                        <div>
                        <Label htmlFor="verified-role" className="font-bold text-sm uppercase text-muted-foreground">Rôle vérifié</Label>
                        <p className="text-sm text-muted-foreground/80">
                            Ce rôle est attribué après une vérification réussie.
                        </p>
                        </div>
                        <Select defaultValue="r4">
                            <SelectTrigger id="verified-role" className="w-full md:w-[280px]">
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Rôles</SelectLabel>
                                    {mockRoles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                        <div>
                        <Label htmlFor="captcha-type" className="font-bold text-sm uppercase text-muted-foreground">Type de Captcha</Label>
                        </div>
                        <Select defaultValue="text">
                            <SelectTrigger id="captcha-type" className="w-full md:w-[280px]">
                                <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Texte simple</SelectItem>
                                <SelectItem value="image">Image avec code</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
                        <div>
                        <Label htmlFor="captcha-difficulty" className="font-bold text-sm uppercase text-muted-foreground">Difficulté</Label>
                        </div>
                        <Select defaultValue="medium">
                            <SelectTrigger id="captcha-difficulty" className="w-full md:w-[280px]">
                                <SelectValue placeholder="Sélectionner un niveau" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Facile</SelectItem>
                                <SelectItem value="medium">Moyenne</SelectItem>
                                <SelectItem value="hard">Difficile</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </PremiumFeatureWrapper>
    );
}

export default function CaptchaPage() {
    const { serverInfo, loading } = useServerInfo();

    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    Captcha
                    <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
                </h1>
                <p className="text-muted-foreground mt-2">
                Mettez en place un système de vérification par captcha pour les nouveaux membres.
                </p>
            </div>
            
            <Separator />

            {loading ? (
                <Skeleton className="h-96 w-full" />
            ) : (
                <CaptchaPageContent isPremium={serverInfo?.isPremium || false} />
            )}
        </div>
    );
}
