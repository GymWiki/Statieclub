"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

type Modus = "inloggen" | "aanmelden";

/**
 * Optioneel donateur-account (Punt 6) — volledig los van de bestaande
 * anonieme donatieflow (`/donateren`), die ongewijzigd blijft werken
 * zonder ooit een account te vereisen. Zelfde Supabase Auth-patroon als
 * `/admin/login`: één pagina met inloggen/aanmelden-toggle. Na
 * aanmelden/inloggen koppelt `vereisDonateurToegang()` (lib/
 * donateurAuth.ts) op `/aanbieder` automatisch de `donateurs`-rij van
 * dit account op e-mailadres — bestaande donatiegeschiedenis op
 * hetzelfde adres wordt zo geclaimd, geen dubbele rij.
 */
export default function AanbiederLoginPage() {
  const router = useRouter();
  const [modus, setModus] = useState<Modus>("inloggen");
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [toonWachtwoord, setToonWachtwoord] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [bevestigEmail, setBevestigEmail] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFoutmelding(null);

    const supabase = createClient();

    if (modus === "inloggen") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord });
      setBezig(false);

      if (error) {
        setFoutmelding("E-mailadres of wachtwoord klopt niet.");
        return;
      }
      router.push("/aanbieder");
      router.refresh();
      return;
    }

    // modus === "aanmelden"
    const { data, error } = await supabase.auth.signUp({
      email,
      password: wachtwoord,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/aanbieder` },
    });
    setBezig(false);

    if (error) {
      setFoutmelding(error.message);
      return;
    }
    if (data.session) {
      // E-mailbevestiging staat uit in dit Supabase-project: direct ingelogd.
      router.push("/aanbieder");
      router.refresh();
      return;
    }
    setBevestigEmail(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <Card className="p-8">
        <div className="mb-6 text-center">
          <Heart className="mx-auto h-10 w-10 text-brand-600" />
          <h1 className="mt-3 text-xl font-bold text-gray-900">Mijn donaties</h1>
          <p className="mt-1 text-sm text-gray-500">
            {modus === "inloggen"
              ? "Log in om je ophaalacties en totaal gedoneerd bedrag te zien."
              : "Maak een optioneel account aan — doneren zonder account blijft ook gewoon mogelijk."}
          </p>
        </div>

        {bevestigEmail ? (
          <p className="rounded-lg bg-brand-50 px-3 py-3 text-center text-sm text-brand-700">
            Check je inbox — bevestig je e-mailadres via de link die we naar {email} hebben gestuurd.
          </p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mailadres</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="pl-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jij@voorbeeld.nl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="wachtwoord">Wachtwoord</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="wachtwoord"
                    type={toonWachtwoord ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={modus === "inloggen" ? "current-password" : "new-password"}
                    className="pl-11 pr-11"
                    value={wachtwoord}
                    onChange={(e) => setWachtwoord(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setToonWachtwoord((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={toonWachtwoord ? "Verberg wachtwoord" : "Toon wachtwoord"}
                  >
                    {toonWachtwoord ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {foutmelding && <p className="text-sm text-red-600">{foutmelding}</p>}

              <Button type="submit" className="w-full" disabled={bezig}>
                {bezig && <Loader2 className="h-4 w-4 animate-spin" />}
                {modus === "inloggen" ? "Inloggen" : "Account aanmaken"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              {modus === "inloggen" ? (
                <>
                  Nog geen account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setModus("aanmelden");
                      setFoutmelding(null);
                    }}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    Account aanmaken
                  </button>
                </>
              ) : (
                <>
                  Al een account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setModus("inloggen");
                      setFoutmelding(null);
                    }}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    Inloggen
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
