import Image from "next/image";

import { BrandMark } from "./brand-mark";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.21.0";

const MODULE_LINKS = [
  { href: "#features", label: "Modules" },
  { href: "#gallery", label: "In action" },
  { href: "#process", label: "How it works" },
  { href: "#about", label: "About" },
];

export function LandingFooter() {
  return (
    <footer className="bg-[hsl(214_52%_9%)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-7 w-7" />
              <span className="text-lg font-semibold">FRMS</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-white/60">
              Fisherfolk Registration &amp; Management System — the digital system
              of record for the City Fisheries Management Office of Calapan City,
              Oriental Mindoro.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold text-white/90">Explore</h3>
            <ul className="mt-4 space-y-2.5">
              {MODULE_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Office */}
          <div>
            <h3 className="text-sm font-semibold text-white/90">Office</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li>City Fisheries Management Office</li>
              <li>City Government of Calapan</li>
              <li>Oriental Mindoro, Philippines</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">
            FRMS · v{APP_VERSION} · © 2026 City Government of Calapan. All rights
            reserved.
          </p>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <Image
                src="/blue-alliance-logo.png"
                alt="Blue Alliance"
                width={88}
                height={34}
                className="h-7 w-auto opacity-90"
              />
              <span className="text-xs text-white/50">A Blue Alliance initiative</span>
            </div>
            <span className="hidden h-4 w-px bg-white/15 sm:block" />
            <a
              href="https://www.powerbyteitsolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm text-xs text-white/70 transition-colors hover:text-white hover:underline focus-visible:text-white focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Developed by Powerbyte IT Solutions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
