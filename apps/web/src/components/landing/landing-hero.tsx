"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Anchor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrowserFrame } from "./browser-frame";

export function LandingHero() {
  const reduced = useReducedMotion();

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Decorative coastal backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-[-10rem] top-32 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl" />
        <WaveField reduced={reduced ?? false} />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:px-6 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={reduced === true ? false : { opacity: 0, y: 16 }}
            animate={reduced === true ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
          >
            <Anchor className="h-3.5 w-3.5 text-accent" />
            City Government of Calapan · Fisheries Management Office
          </motion.div>

          <motion.h1
            initial={reduced === true ? false : { opacity: 0, y: 20 }}
            animate={reduced === true ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Every fisherfolk, vessel, and catch —{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              registered and managed
            </span>{" "}
            in one place.
          </motion.h1>

          <motion.p
            initial={reduced === true ? false : { opacity: 0, y: 20 }}
            animate={reduced === true ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground"
          >
            The Fisherfolk Registration &amp; Management System digitizes
            registration, vessels, subsidies, catch monitoring, and compliance
            for the coastal communities of Calapan City — accurate records,
            faster service, better decisions.
          </motion.p>

          <motion.div
            initial={reduced === true ? false : { opacity: 0, y: 20 }}
            animate={reduced === true ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="#features">
                Explore the platform
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <a href="#gallery">See it in action</a>
            </Button>
          </motion.div>
        </div>

        {/* Hero product shot */}
        <motion.div
          initial={reduced === true ? false : { opacity: 0, y: 40 }}
          animate={reduced === true ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <BrowserFrame url="frms.powerbyte.app" className="shadow-2xl shadow-primary/10">
            <Image
              src="/showcase/01-dashboard.png"
              alt="FRMS dashboard showing fisherfolk registration statistics, demographic charts, and a barangay density map"
              width={1600}
              height={900}
              priority
              className="w-full"
            />
          </BrowserFrame>
        </motion.div>
      </div>
    </section>
  );
}

function WaveField({ reduced }: { reduced: boolean }) {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full text-primary/[0.07]"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        fill="currentColor"
        initial={false}
        animate={
          reduced
            ? false
            : {
                d: [
                  "M0,160 C240,240 480,80 720,160 C960,240 1200,80 1440,160 L1440,320 L0,320 Z",
                  "M0,180 C240,100 480,240 720,150 C960,80 1200,220 1440,140 L1440,320 L0,320 Z",
                  "M0,160 C240,240 480,80 720,160 C960,240 1200,80 1440,160 L1440,320 L0,320 Z",
                ],
              }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        d="M0,160 C240,240 480,80 720,160 C960,240 1200,80 1440,160 L1440,320 L0,320 Z"
      />
    </svg>
  );
}
