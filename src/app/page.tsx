
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Always redirect to the dashboard root, which will handle auth logic.
  redirect('/dashboard');
}
