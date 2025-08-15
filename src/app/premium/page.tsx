
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

const premiumFeatures = [
    "Accès à toutes les fonctionnalités IA (Server Builder, Assistant Modération, etc.)",
    "Support prioritaire sur notre serveur Discord",
    "Accès anticipé aux nouvelles fonctionnalités",
    "Aucune limite sur les modules Premium (ex: Salons Vocaux IA)",
    "Un badge exclusif sur notre serveur de support"
];

export default function PremiumPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <div className="max-w-3xl w-full mx-auto">
                 <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold tracking-tight text-primary">Passez à Premium</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Débloquez le plein potentiel de Marcus avec nos fonctionnalités exclusives.
                    </p>
                </div>

                <Card className="shadow-2xl shadow-primary/10">
                    <CardHeader>
                        <CardTitle className="text-2xl">Avantages Premium</CardTitle>
                        <CardDescription>En devenant Premium, vous bénéficiez de :</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-3">
                            {premiumFeatures.map((feature, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-foreground/90">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Separator className="my-6" />
                        <div className="text-center">
                            <p className="text-muted-foreground mb-4">Prêt à améliorer votre serveur ?</p>
                            <Button size="lg" className="bg-primary hover:bg-primary/90 w-full md:w-auto">
                                Rejoindre notre Discord pour acheter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                 <div className="text-center mt-8">
                    <Link href="/dashboard">
                        <Button variant="link">Retourner au tableau de bord</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
