
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This is a simplified auth page. In a real-world scenario, you'd handle
// loading states, errors, and session management more robustly.

export default function DiscordAuthPage() {
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
                // The bot's API runs on port 3001
                const response = await fetch('http://localhost:3001/api/verify-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Token invalide ou expiré.');
                }

                const { guildId } = await response.json();

                // Here, you would typically set up a user session (e.g., via a cookie or session storage)
                // For this example, we'll just redirect.
                // A more robust solution might store a list of authed guilds in localStorage.
                localStorage.setItem('authed_guild', guildId);

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <div className="flex flex-col items-center gap-4">
                {!error && <Loader2 className="w-12 h-12 animate-spin text-primary" />}
                <p className={`text-xl ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {message}
                </p>
            </div>
        </div>
    );
}
