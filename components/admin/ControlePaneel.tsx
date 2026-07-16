"use client";

import { useState } from "react";
import { VerificatieLijst, type TeVerifierenBonnetje } from "@/components/admin/VerificatieLijst";

export function ControlePaneel({ initialBonnetjes }: { initialBonnetjes: TeVerifierenBonnetje[] }) {
  const [bonnetjes, setBonnetjes] = useState(initialBonnetjes);

  return (
    <VerificatieLijst
      bonnetjes={bonnetjes}
      onVerwerkt={(id) => setBonnetjes((prev) => prev.filter((b) => b.id !== id))}
    />
  );
}
