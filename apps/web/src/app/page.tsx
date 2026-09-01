import type { Metadata } from "next";

import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingStats } from "@/components/landing/landing-stats";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingGallery } from "@/components/landing/landing-gallery";
import { LandingProcess } from "@/components/landing/landing-process";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

const TITLE =
  "FRMS — Fisherfolk Registration & Management System | Calapan City";
const DESCRIPTION =
  "The system the City Fisheries Management Office of Calapan City runs day to day: fisherfolk registration, vessels, catch monitoring, ayuda, compliance, and analytics, all in one place.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    siteName: "FRMS",
    images: [
      {
        url: "/showcase/01-dashboard.png",
        width: 1600,
        height: 900,
        alt: "FRMS dashboard for the Calapan City Fisheries Management Office",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/showcase/01-dashboard.png"],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FRMS — Fisherfolk Registration & Management System",
  applicationCategory: "GovernmentApplication",
  operatingSystem: "Web",
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "PHP" },
  publisher: {
    "@type": "Organization",
    name: "Powerbyte IT Solutions",
    url: "https://www.powerbyteitsolutions.com/",
  },
  provider: {
    "@type": "GovernmentOrganization",
    name: "City Government of Calapan — Fisheries Management Office",
    areaServed: "Calapan City, Oriental Mindoro, Philippines",
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingNav />
      <main>
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingGallery />
        <LandingProcess />
        <LandingCta />
      </main>
      <LandingFooter />
    </>
  );
}
