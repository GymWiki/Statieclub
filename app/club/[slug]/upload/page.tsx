import { Suspense } from "react";
import { BonnetjeUpload } from "@/components/team/BonnetjeUpload";

export default function UploadPage() {
  return (
    <Suspense>
      <BonnetjeUpload />
    </Suspense>
  );
}
