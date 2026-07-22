"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function UitloggenKnop() {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);

  async function uitloggen() {
    setBezig(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/aanbieder/login");
    router.refresh();
  }

  return (
    <button
      onClick={uitloggen}
      disabled={bezig}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
    >
      {bezig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />} Uitloggen
    </button>
  );
}
