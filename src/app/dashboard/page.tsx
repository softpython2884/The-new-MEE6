
'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

    useEffect(() => {
        const storedGuildIds = JSON.parse(localStorage.getItem('authed_guilds') || '[]');
        if (storedGuildIds.length > 0) {
            setRedirectUrl(`/dashboard/${storedGuildIds[0]}/moderation`);
        } else {
            // If no servers, you could redirect to a "please connect a server" page
            // For now, we just show a message.
        }
    }, []);

    if (redirectUrl) {
        redirect(redirectUrl);
    }

    return (
        <div className="flex h-full items-center justify-center">
            <p>Veuillez utiliser la commande /login sur un serveur Discord pour commencer.</p>
        </div>
    );
}
