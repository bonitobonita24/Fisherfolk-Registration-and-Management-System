import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  current: number;
  className?: string;
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          {/* Circle */}
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                  ? "bg-primary text-primary-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {i + 1}
          </div>

          {/* Label */}
          <span
            className={cn(
              "ml-2 text-sm",
              i <= current ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
          </span>

          {/* Connector — render for all but the last step */}
          {i < steps.length - 1 ? (
            <div
              className={cn(
                "mx-3 h-px flex-1",
                i < current ? "bg-primary" : "bg-border"
              )}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
