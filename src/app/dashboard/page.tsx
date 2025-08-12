import { redirect } from 'next/navigation';
import { servers } from '@/components/server-sidebar';

export default function DashboardRootPage() {
    // Redirect to the first server's moderation page by default
    if (servers.length > 0) {
        redirect(`/dashboard/${servers[0].id}/moderation`);
    }
    // A fallback if there are no servers, though this case should be handled
    // by an authentication flow in a real app.
    return (
        <div className="flex h-full items-center justify-center">
            <p>Veuillez sélectionner un serveur pour commencer.</p>
        </div>
    );
}