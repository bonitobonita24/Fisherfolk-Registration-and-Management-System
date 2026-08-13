import { NumberTicker } from "@/components/ui/number-ticker";
import { Reveal } from "./reveal";

const STATS: {
  value: number;
  suffix?: string;
  label: string;
}[] = [
  { value: 3000, suffix: "+", label: "Fisherfolk registered" },
  { value: 62, label: "Barangays covered" },
  { value: 8, label: "Integrated modules" },
  { value: 100, suffix: "%", label: "Digital records" },
];

export function LandingStats() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd className="flex items-baseline justify-center text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  <NumberTicker value={s.value} />
                  {s.suffix ? (
                    <span className="text-primary">{s.suffix}</span>
                  ) : null}
                </dd>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
