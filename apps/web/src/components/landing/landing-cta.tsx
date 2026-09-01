import { ArrowRight, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function LandingCta() {
  return (
    <section id="about" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary to-secondary/80 px-6 py-16 text-center sm:px-16">
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <Waves className="absolute -right-6 -top-6 h-40 w-40 text-primary" />
              <Waves className="absolute -bottom-10 -left-6 h-48 w-48 text-accent" />
            </div>
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-secondary-foreground sm:text-4xl">
                Built for the fisherfolk of Calapan City
              </h2>
              <p className="mt-4 text-lg text-secondary-foreground/80">
                FRMS is the City Fisheries Management Office&apos;s system of
                record, built so every fisherfolk, vessel, and catch in
                Calapan City has one accurate, current entry instead of a
                stack of forms in a filing cabinet.
              </p>
              <div className="mt-8 flex justify-center">
                <Button asChild size="lg">
                  <a href="#features">
                    Explore the modules
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
