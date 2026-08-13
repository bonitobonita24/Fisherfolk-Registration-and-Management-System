import {
  Users,
  Home,
  Ship,
  HandHeart,
  Fish,
  ShieldAlert,
  BarChart3,
  IdCard,
  type LucideIcon,
} from "lucide-react";

import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

const FEATURES: {
  icon: LucideIcon;
  title: string;
  body: string;
  span?: boolean;
}[] = [
  {
    icon: Users,
    title: "Fisherfolk Registration",
    body: "A complete municipal registry — profiles, photos, gear, and livelihood details, verified and searchable.",
    span: true,
  },
  {
    icon: Home,
    title: "Household Management",
    body: "Group fisherfolk by household for accurate demographics and fair subsidy targeting.",
  },
  {
    icon: Ship,
    title: "Vessel Registration",
    body: "Track boats and gear with owner links, specifications, and documents.",
  },
  {
    icon: HandHeart,
    title: "Ayuda & Subsidies",
    body: "Plan, target, and record assistance distribution with a transparent audit trail.",
  },
  {
    icon: Fish,
    title: "Fish Catch Monitoring",
    body: "Log catch volumes and species to power fisheries analytics and policy.",
  },
  {
    icon: ShieldAlert,
    title: "Violations & Compliance",
    body: "Record infractions and enforcement actions to keep coastal waters sustainable.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    body: "Dashboards, density maps, and one-click reports for evidence-based decisions.",
    span: true,
  },
  {
    icon: IdCard,
    title: "Fisherfolk ID Generation",
    body: "Issue official, printable fisherfolk IDs straight from verified records.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">
              One platform, every workflow
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for the full fisheries lifecycle
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Eight integrated modules replace scattered spreadsheets and paper
              forms with one connected system of record.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={(i % 3) * 0.06}
              className={cn(f.span === true && "lg:col-span-2")}
            >
              <article className="group relative h-full overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
