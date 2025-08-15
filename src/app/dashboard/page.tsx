
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardRootPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("Vérification de l'authentification...");

    useEffect(() => {
        const storedGuildIds = JSON.parse(localStorage.getItem('authed_guilds') || '[]');
        if (storedGuildIds.length > 0) {
            setMessage("Redirection vers votre tableau de bord...");
            // Navigate to the first available server's page, on a default module.
            router.push(`/dashboard/${storedGuildIds[0]}/moderation`);
        } else {
            // If no servers, stop loading and show the message
            setMessage("Veuillez utiliser la commande /login sur un serveur Discord pour commencer.");
            setLoading(false);
        }
        // The redirection will cause the component to unmount, so no need to setLoading(false) in the "if" case.
    }, [router]);

    return (
        <div className="flex h-full items-center justify-center text-center p-4">
            <div className="flex flex-col items-center gap-4">
                {loading && <Loader2 className="w-12 h-12 animate-spin text-primary" />}
                <p>{message}</p>
            </div>
        </div>
    );
}
