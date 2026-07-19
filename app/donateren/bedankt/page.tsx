"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const POLL_INTERVAL_MS = 1500;
const MAX_POGINGEN = 12;

/**
 * Landt hier na een geslaagde Stripe Checkout-betaling
 * (success_url=/donateren/bedankt?session_id={CHECKOUT_SESSION_ID}).
 * Het bijbehorende ophaalverzoek ontstaat asynchroon — pas zodra
 * `/api/stripe/webhook` het `checkout.session.completed`-event heeft
 * verwerkt — dus deze pagina pollt kort totdat de rij bestaat en stuurt
 * dan door naar de bestaande "magic link"-statuspagina.
 */
function BedanktInhoud() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [pogingen, setPogingen] = useState(0);
  const [mislukt, setMislukt] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setMislukt(true);
      return;
    }

    let actief = true;

    async function controleer() {
      try {
        const res = await fetch(`/api/stripe/checkout-session-status?session_id=${encodeURIComponent(sessionId!)}`);
        const json = await res.json();
        if (!actief) return;

        if (json.ophaalverzoekId) {
          router.replace(`/status/${json.ophaalverzoekId}`);
          return;
        }
      } catch {
        // val hieronder terug op een volgende poging
      }

      setPogingen((prev) => prev + 1);
    }

    if (pogingen >= MAX_POGINGEN) {
      setMislukt(true);
      return;
    }

    const timeout = setTimeout(controleer, pogingen === 0 ? 0 : POLL_INTERVAL_MS);
    return () => {
      actief = false;
      clearTimeout(timeout);
    };
  }, [sessionId, pogingen, router]);

  if (!sessionId || mislukt) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <TriangleAlert className="h-10 w-10 text-amber-500" />
        <h1 className="text-lg font-bold text-gray-900">Betaling wordt nog verwerkt</h1>
        <p className="text-sm text-gray-600">
          Je betaling is gelukt, maar het duurt iets langer dan verwacht om te bevestigen. Check zo meteen je
          e-mail, of ververs deze pagina over een paar minuten.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <CheckCircle2 className="h-10 w-10 text-brand-600" />
      <h1 className="text-lg font-bold text-gray-900">Betaling gelukt!</h1>
      <p className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Even je bevestiging ophalen…
      </p>
    </Card>
  );
}

export default function BedanktPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-8">
      <Suspense
        fallback={
          <Card className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </Card>
        }
      >
        <BedanktInhoud />
      </Suspense>
      <Button variant="ghost" className="mt-4" onClick={() => (window.location.href = "/")}>
        Terug naar home
      </Button>
    </div>
  );
}
