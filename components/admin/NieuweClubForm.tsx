"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export function NieuweClubForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [naam, setNaam] = useState("");
  const [postcode, setPostcode] = useState("");
  const [regio, setRegio] = useState("");
  const [actiefSpaardoel, setActiefSpaardoel] = useState("");
  const [doelbedrag, setDoelbedrag] = useState("");
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naam,
          postcode,
          regio,
          actief_spaardoel: actiefSpaardoel,
          doelbedrag: Number(doelbedrag),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon club niet aanmaken.");
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

  const inhoud = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="naam">Clubnaam</Label>
        <Input
          id="naam"
          required
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="bijv. SV De Meteoor"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            required
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="7511 AB"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="regio">Regio/plaats</Label>
          <Input
            id="regio"
            required
            value={regio}
            onChange={(e) => setRegio(e.target.value)}
            placeholder="Enschede"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="spaardoel">Waar spaart de club voor?</Label>
        <Input
          id="spaardoel"
          required
          value={actiefSpaardoel}
          onChange={(e) => setActiefSpaardoel(e.target.value)}
          placeholder="bijv. Nieuwe jeugddoeltjes"
        />
      </div>

      <div>
        <Label htmlFor="doelbedrag">Doelbedrag (€)</Label>
        <Input
          id="doelbedrag"
          type="number"
          min={1}
          step="0.01"
          required
          value={doelbedrag}
          onChange={(e) => setDoelbedrag(e.target.value)}
          placeholder="2500"
        />
      </div>

      {foutmelding && <p className="text-sm text-red-600">{foutmelding}</p>}

      <Button type="submit" className="w-full" disabled={bezig}>
        {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        Club aanmaken
      </Button>
    </form>
  );

  if (compact) return inhoud;

  return <Card className="p-6">{inhoud}</Card>;
}
