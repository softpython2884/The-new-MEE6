
'use client';

import { useGlobalAiStatus } from '@/hooks/use-global-ai-status';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Power } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function GlobalAiStatusAlert() {
  const { status, loading } = useGlobalAiStatus();

  if (loading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (status.disabled) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Fonctionnalités IA Désactivées Globalement</AlertTitle>
        <AlertDescription>
          Un administrateur a désactivé toutes les fonctionnalités IA du bot. Raison : "{status.reason || 'Aucune raison spécifiée'}".
          Cette alerte prévaut sur les configurations individuelles des modules.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
