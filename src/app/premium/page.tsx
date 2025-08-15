
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

const premiumFeatures = [
    "Accès à toutes les fonctionnalités IA",
    "Commandes exclusives",
    "Support prioritaire",
    "Et bien plus encore à venir..."
];

export default function PremiumPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <Card className="max-w-2xl w-full bg-card shadow-lg border-primary/20">
                <CardHeader className="text-center">
                    <h1 className="text-4xl font-bold text-primary">Passez à Marcus Premium</h1>
                    <CardDescription className="text-lg text-muted-foreground mt-2">
                        Débloquez tout le potentiel de votre serveur Discord.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ul className="space-y-3 text-card-foreground">
                        {premiumFeatures.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                                <span className="text-base">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="text-center">
                        <p className="text-muted-foreground">Pour souscrire à un abonnement et obtenir votre clé d'activation, veuillez rejoindre notre serveur Discord de support.</p>
                        <a href="https://discord.gg/votre-serveur" target="_blank" rel="noopener noreferrer">
                            <Button className="mt-6 w-full text-lg py-6 bg-primary hover:bg-primary/90">
                                Rejoindre le Discord
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>
             <Link href="/dashboard">
                <Button variant="link" className="mt-8 text-muted-foreground">
                    Retour au tableau de bord
                </Button>
            </Link>
        </div>
    );
}
