import { ClipboardList, BadgeCheck, LayoutDashboard, LineChart } from "lucide-react";

import { Reveal } from "./reveal";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Register",
    body: "Enrol fisherfolk, households, and vessels in the field or at the office, with photos, documents, and a location pinned on the spot.",
  },
  {
    icon: BadgeCheck,
    title: "Verify",
    body: "Review and approve records with role-based access, so every change is traceable to who made it.",
  },
  {
    icon: LayoutDashboard,
    title: "Manage",
    body: "Handle ayuda distribution, catch logs, violations, and ID issuance from one workspace instead of four.",
  },
  {
    icon: LineChart,
    title: "Analyze & report",
    body: "Turn live records into density maps, dashboards, and the reports the city actually needs to submit.",
  },
];

export function LandingProcess() {
  return (
    <section id="process" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From the first record to the final report
            </h2>
          </div>
        </Reveal>

        <div className="relative mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connecting line on large screens */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1} className="relative">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <div className="relative z-10 mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-sm">
                  <s.icon className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
