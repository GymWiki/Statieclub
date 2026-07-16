"use client";

import { FormEvent, useState } from "react";
import { Mail, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "versturen" | "verzonden" | "fout">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("versturen");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setStatus(error ? "fout" : "verzonden");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <Card className="p-8">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-brand-600" />
          <h1 className="mt-3 text-xl font-bold text-gray-900">Penningmeester-login</h1>
          <p className="mt-1 text-sm text-gray-500">Log in met een magic link via e-mail.</p>
        </div>

        {status === "verzonden" ? (
          <p className="rounded-lg bg-brand-50 px-3 py-3 text-center text-sm text-brand-700">
            Check je inbox — we hebben een inloglink gestuurd naar {email}.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mailadres</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="penningmeester@club.nl"
                />
              </div>
            </div>
            {status === "fout" && (
              <p className="text-sm text-red-600">Versturen mislukt, probeer het opnieuw.</p>
            )}
            <Button type="submit" className="w-full" disabled={status === "versturen"}>
              {status === "versturen" && <Loader2 className="h-4 w-4 animate-spin" />}
              Stuur inloglink
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
