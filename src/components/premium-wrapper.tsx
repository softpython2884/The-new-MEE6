
'use client';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import Link from 'next/link';

interface PremiumWrapperProps {
  isPremium: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PremiumFeatureWrapper({ isPremium, children, className }: PremiumWrapperProps) {
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-lg bg-black/70 backdrop-blur-sm">
        <Lock className="h-12 w-12 text-yellow-400" />
        <div className="text-center">
            <h3 className="text-xl font-bold text-white">Fonctionnalité Premium</h3>
            <p className="text-muted-foreground">Passez à la version Premium pour débloquer cette fonctionnalité.</p>
        </div>
        <Link href="/premium">
            <Button variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                Devenir Premium
            </Button>
        </Link>
      </div>
      <div className="pointer-events-none blur-sm grayscale">
        {children}
      </div>
    </div>
  );
}
