
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This is a simplified auth page. In a real-world scenario, you'd handle
// loading states, errors, and session management more robustly.

function AuthProcessor() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [message, setMessage] = useState('Vérification de votre session...');
    const [error, setError] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setError(true);
            setMessage('Token de connexion manquant. Veuillez réessayer de vous connecter depuis Discord.');
            return;
        }

        const verifyToken = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';
                const response = await fetch(`${apiUrl}/verify-token`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Token invalide ou expiré.');
                }

                const { guildId } = await response.json();

                // Get existing authed guilds from localStorage, or initialize a new array
                const authedGuilds = JSON.parse(localStorage.getItem('authed_guilds') || '[]');

                // Add the new guildId if it's not already in the list
                if (!authedGuilds.includes(guildId)) {
                    authedGuilds.push(guildId);
                    localStorage.setItem('authed_guilds', JSON.stringify(authedGuilds));
                }

                setMessage('Authentification réussie ! Redirection en cours...');
                router.push(`/dashboard/${guildId}/moderation`);

            } catch (err: any) {
                setError(true);
                setMessage(`Erreur d'authentification : ${err.message}. Veuillez réessayer.`);
            }
        };

        verifyToken();

    }, [searchParams, router]);

    return (
        <div className="flex flex-col items-center gap-4">
            {!error && <Loader2 className="w-12 h-12 animate-spin text-primary" />}
            <p className={`text-xl ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
                {message}
            </p>
        </div>
    );
}


export default function DiscordAuthPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <Suspense fallback={<Loader2 className="w-12 h-12 animate-spin text-primary" />}>
                <AuthProcessor />
            </Suspense>
        </div>
    );
}
