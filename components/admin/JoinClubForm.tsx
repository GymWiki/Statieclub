"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

/**
 * "Bestaande club selecteren" — het tweede pad in de lege staat van
 * /admin naast NieuweClubForm. Een club is hier niet uit een lijst te
 * kiezen (dat zou iedereen toegang geven tot een andere club z'n
 * financiële dashboard); in plaats daarvan voert de gebruiker de
 * uitnodigingscode in die een bestaande beheerder met hem/haar deelde
 * (zie clubs.uitnodigingscode, migratie 0019).
 */
export function JoinClubForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch("/api/clubs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon niet aan deze club koppelen.");
        setBezig(false);
        return;
      }

      router.push(`/admin/${json.club.slug}`);
      router.refresh();
    } catch {
      setFoutmelding("Kon geen verbinding maken. Probeer het opnieuw.");
      setBezig(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="uitnodigingscode">Uitnodigingscode</Label>
          <Input
            id="uitnodigingscode"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="bijv. 4f9a2c1d"
          />
        </div>

        {foutmelding && <p className="text-sm text-red-600">{foutmelding}</p>}

        <Button type="submit" className="w-full" variant="secondary" disabled={bezig}>
          {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Bij club aansluiten
        </Button>
        <p className="text-center text-xs text-gray-400">
          Vraag deze code aan een bestuurslid dat al beheerder is van de club.
        </p>
      </form>
    </Card>
  );
}
