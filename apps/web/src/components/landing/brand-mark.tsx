import { cn } from "@/lib/utils";

/**
 * FRMS wave brand mark — a small coastal glyph echoing the fisheries / Blue
 * Alliance motif. Uses currentColor so it inherits text colour in any theme.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-7 w-7", className)}
    >
      <rect
        width="32"
        height="32"
        rx="9"
        className="fill-primary"
      />
      <path
        d="M5 19.5c2.4 0 2.4-2.2 4.8-2.2s2.4 2.2 4.8 2.2 2.4-2.2 4.8-2.2 2.4 2.2 4.8 2.2"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 24c2.4 0 2.4-2.2 4.8-2.2s2.4 2.2 4.8 2.2 2.4-2.2 4.8-2.2 2.4 2.2 4.8 2.2"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="16" cy="11" r="2.6" fill="hsl(var(--primary-foreground))" />
    </svg>
  );
}
