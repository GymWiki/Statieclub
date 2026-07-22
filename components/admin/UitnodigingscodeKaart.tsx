"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Toont de uitnodigingscode van deze club (migratie 0019) zodat een
 * bestaande beheerder hem buiten de app om kan delen met een nieuwe
 * mede-beheerder — die vult 'm in bij "Bestaande club selecteren" op
 * de lege staat van /admin.
 */
export function UitnodigingscodeKaart({ code }: { code: string }) {
  const [gekopieerd, setGekopieerd] = useState(false);

  async function kopieer() {
    await navigator.clipboard.writeText(code);
    setGekopieerd(true);
    setTimeout(() => setGekopieerd(false), 2000);
  }

  return (
    <Card className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-3">
        <KeyRound className="h-5 w-5 shrink-0 text-gray-400" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Uitnodigingscode voor mede-beheerders</p>
          <p className="font-mono text-lg tracking-wide text-gray-700">{code}</p>
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={kopieer}>
        {gekopieerd ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {gekopieerd ? "Gekopieerd" : "Kopieer"}
      </Button>
    </Card>
  );
}
