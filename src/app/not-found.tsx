
'use client';

import FuzzyText from "@/components/fuzzy-text";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center">
      <FuzzyText
        fontSize="clamp(8rem, 20vw, 20rem)"
        color="hsl(var(--primary))"
        baseIntensity={0.1}
        hoverIntensity={0.3}
      >
        404
      </FuzzyText>
      <h1 className="text-2xl md:text-4xl font-semibold mt-4">Page non trouvée</h1>
      <p className="text-muted-foreground mt-2 mb-6">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link href="/dashboard">
        <Button>Retourner au tableau de bord</Button>
      </Link>
    </div>
  );
}