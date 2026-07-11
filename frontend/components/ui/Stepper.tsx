import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppStep } from "@/types";

const STEPS: { key: AppStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "processing", label: "Processing" },
  { key: "results", label: "Results" },
];

export function Stepper({ current }: { current: AppStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex w-full items-center">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary text-primary",
                  !isComplete && !isActive && "border-border text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  (isComplete || isActive) ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-0.5 flex-1 rounded-full transition-colors",
                  isComplete ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
