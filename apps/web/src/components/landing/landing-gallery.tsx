"use client";

import Image from "next/image";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Reveal } from "./reveal";
import { BrowserFrame } from "./browser-frame";

const SHOTS: { key: string; label: string; src: string; alt: string }[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    src: "/showcase/01-dashboard.png",
    alt: "FRMS dashboard with registration KPIs, demographic charts and a barangay density map",
  },
  {
    key: "analytics",
    label: "Analytics",
    src: "/showcase/02-analytics.png",
    alt: "Analytics view with fisherfolk demographic and livelihood charts",
  },
  {
    key: "map",
    label: "Density map",
    src: "/showcase/03-map.png",
    alt: "Interactive barangay fisherfolk-density map of Calapan City",
  },
  {
    key: "profile",
    label: "Fisherfolk profile",
    src: "/showcase/05-fisherfolk-detail.png",
    alt: "Detailed fisherfolk profile with photo, gear and household links",
  },
  {
    key: "register",
    label: "Registration",
    src: "/showcase/06-fisherfolk-register.png",
    alt: "Fisherfolk registration form",
  },
  {
    key: "reports",
    label: "Reports",
    src: "/showcase/19-reports.png",
    alt: "Report generation hub with multiple report types",
  },
  {
    key: "id",
    label: "ID generator",
    src: "/showcase/21-id-generator.png",
    alt: "Fisherfolk ID card generator preview",
  },
  {
    key: "catch",
    label: "Fish catch",
    src: "/showcase/29-fish-catch-analytics.png",
    alt: "Fish catch monitoring analytics by species and volume",
  },
];

export function LandingGallery() {
  return (
    <section id="gallery" className="scroll-mt-20 border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">
              See it in action
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              A polished, purpose-built interface
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Clear screens designed for LGU staff — from daily registration to
              city-wide analytics.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Tabs defaultValue="dashboard" className="mt-12">
            <div className="flex justify-center">
              <TabsList className="flex h-auto flex-wrap justify-center gap-1 bg-transparent p-0">
                {SHOTS.map((s) => (
                  <TabsTrigger
                    key={s.key}
                    value={s.key}
                    className="rounded-full border border-border bg-card px-4 py-1.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {s.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {SHOTS.map((s) => (
              <TabsContent key={s.key} value={s.key} className="mt-8">
                <BrowserFrame url="frms.powerbyte.app" className="mx-auto max-w-4xl shadow-xl">
                  <Image
                    src={s.src}
                    alt={s.alt}
                    width={1600}
                    height={900}
                    className="w-full"
                  />
                </BrowserFrame>
              </TabsContent>
            ))}
          </Tabs>
        </Reveal>
      </div>
    </section>
  );
}
