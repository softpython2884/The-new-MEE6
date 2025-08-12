import { redirect } from 'next/navigation';
import { servers } from '@/components/server-sidebar';

export default function RootPage() {
  // Redirect to the first server in the list by default
  if (servers.length > 0) {
    redirect(`/dashboard/${servers[0].id}/moderation`);
  }
  // Fallback if no servers are available
  redirect('/dashboard');
}
