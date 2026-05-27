import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ExecutiveContent } from "./executive-content";

export default function ExecutivePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <ExecutiveContent />
    </Suspense>
  );
}
