"use client";

import { FormEvent, useState } from "react";
import { Loader2, PlusCircle, Target, Lock, LockOpen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatEuro, formatVoortgang } from "@/lib/utils";
import type { Doel } from "@/lib/types";

export function DoelenBeheer({ clubSlug, initialDoelen }: { clubSlug: string; initialDoelen: Doel[] }) {
  const [doelen, setDoelen] = useState(initialDoelen);
  const [titel, setTitel] = useState("");
  const [doelbedrag, setDoelbedrag] = useState("");
  const [bezig, setBezig] = useState(false);
  const [bezigId, setBezigId] = useState<string | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  async function doelToevoegen(e: FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFoutmelding(null);

    try {
      const res = await fetch(`/api/clubs/${clubSlug}/doelen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titel, doelbedrag: Number(doelbedrag) }),
      });
      const json = await res.json();

      if (!res.ok) {
        setFoutmelding(json.error ?? "Kon doel niet aanmaken.");
        return;
      }

      setDoelen((prev) => [...prev, json.doel]);
      setTitel("");
      setDoelbedrag("");
    } finally {
      setBezig(false);
    }
  }

  async function toggleActief(doel: Doel) {
    setBezigId(doel.id);
    try {
      const res = await fetch(`/api/doelen/${doel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_actief: !doel.is_actief }),
      });
      const json = await res.json();
      if (res.ok) {
        setDoelen((prev) => prev.map((d) => (d.id === doel.id ? json.doel : d)));
      }
    } finally {
      setBezigId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900">Nieuw doel toevoegen</h2>
        <p className="mt-1 text-sm text-gray-500">
          Een club kan meerdere doelen tegelijk (of na elkaar) hebben — elke donateur kiest zelf welk doel hij steunt.
        </p>
        <form onSubmit={doelToevoegen} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="titel">Waar spaart de club voor?</Label>
            <Input
              id="titel"
              required
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
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
          <Button type="submit" className="w-full" disabled={bezig}>
            {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Doel toevoegen
          </Button>
        </form>
        {foutmelding && <p className="mt-2 text-sm text-red-600">{foutmelding}</p>}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-gray-900">Doelen van deze club</h2>

        <div className="mt-4 space-y-3">
          {doelen.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">Nog geen doelen — voeg er hierboven één toe.</p>
          )}

          {doelen.map((doel) => {
            const percentage = formatVoortgang(doel.opgehaald_bedrag, doel.doelbedrag);
            return (
              <div key={doel.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-brand-600" />
                    <p className="font-medium text-gray-900">{doel.titel}</p>
                    {!doel.is_actief && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Gesloten
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={bezigId === doel.id}
                    onClick={() => toggleActief(doel)}
                  >
                    {bezigId === doel.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : doel.is_actief ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <LockOpen className="h-3.5 w-3.5" />
                    )}
                    {doel.is_actief ? "Sluiten" : "Heropenen"}
                  </Button>
                </div>
                <div className="mt-3 space-y-1">
                  <ProgressBar percentage={percentage} />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {formatEuro(doel.opgehaald_bedrag)} van {formatEuro(doel.doelbedrag)}
                    </span>
                    <span className="font-semibold text-brand-700">{percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
