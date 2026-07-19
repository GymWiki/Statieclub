import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Portemonnee } from "@/components/team/Portemonnee";

export default function PortemonneePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <Portemonnee />
    </Suspense>
  );
}
