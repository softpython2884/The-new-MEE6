
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardRootPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedGuildIds = JSON.parse(localStorage.getItem('authed_guilds') || '[]');
        if (storedGuildIds.length > 0) {
            // Navigate to the first available server's page
            router.push(`/dashboard/${storedGuildIds[0]}/moderation`);
        } else {
            // If no servers, stop loading and show the message
            setLoading(false);
        }
        // The redirection will cause the component to unmount, so no need to setLoading(false) in the "if" case.
    }, [router]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-full items-center justify-center">
            <p>Veuillez utiliser la commande /login sur un serveur Discord pour commencer.</p>
        </div>
    );
}
