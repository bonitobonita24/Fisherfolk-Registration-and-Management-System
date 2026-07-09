import { CatchDisposition, GearType } from "../types/enums";

// Source: BFAR/NFRDI NSAP common municipal target species + local (Filipino) names.
// Seeded suggestion list only (M2 has no Species master table — free-text commonName).
// See docs/superpowers/specs/2026-07-09-fish-catch-research.md §c.
export interface CommonFishSpecies {
  commonName: string;
  scientificName: string;
  group: string;
}

export const COMMON_FISH_SPECIES: CommonFishSpecies[] = [
  { commonName: "Galunggong", scientificName: "Decapterus macrosoma", group: "small pelagic" },
  { commonName: "Tulingan", scientificName: "Auxis rochei / A. thazard", group: "small pelagic" },
  { commonName: "Tambakol", scientificName: "Thunnus albacares / Katsuwonus pelamis", group: "large pelagic" },
  { commonName: "Tamban", scientificName: "Sardinella spp.", group: "small pelagic" },
  { commonName: "Matambaka", scientificName: "Selar crumenophthalmus", group: "small pelagic" },
  { commonName: "Alumahan", scientificName: "Rastrelliger kanagurta", group: "small pelagic" },
  { commonName: "Hasa-hasa", scientificName: "Rastrelliger brachysoma", group: "small pelagic" },
  { commonName: "Dilis", scientificName: "Stolephorus spp.", group: "small pelagic" },
  { commonName: "Bangus", scientificName: "Chanos chanos", group: "freshwater/brackish" },
  { commonName: "Tilapia", scientificName: "Oreochromis niloticus", group: "freshwater" },
  { commonName: "Lapu-lapu", scientificName: "Epinephelus spp.", group: "reef" },
  { commonName: "Maya-maya", scientificName: "Lutjanus spp.", group: "reef" },
  { commonName: "Talakitok", scientificName: "Caranx spp.", group: "reef" },
  { commonName: "Bisugo", scientificName: "Nemipterus spp.", group: "demersal" },
  { commonName: "Dalagang-bukid", scientificName: "Caesio / Pterocaesio spp.", group: "reef" },
  { commonName: "Molmol", scientificName: "Scarus spp.", group: "reef" },
  { commonName: "Danggit", scientificName: "Siganus spp.", group: "reef" },
  { commonName: "Kanduli", scientificName: "Arius spp.", group: "demersal" },
  { commonName: "Pusit", scientificName: "Uroteuthis / Sepioteuthis spp.", group: "mollusk" },
  { commonName: "Alimango", scientificName: "Scylla serrata", group: "crustacean" },
  { commonName: "Alimasag", scientificName: "Portunus pelagicus", group: "crustacean" },
  { commonName: "Hipon", scientificName: "Penaeus / Metapenaeus spp.", group: "crustacean" },
  { commonName: "Talaba", scientificName: "Crassostrea spp.", group: "mollusk" },
  { commonName: "Tahong", scientificName: "Perna viridis", group: "mollusk" },
] as const;

export const GEAR_TYPE_LABELS: Record<GearType, string> = {
  [GearType.GILL_NET]: "Gill Net (Pante)",
  [GearType.HOOK_AND_LINE]: "Hook and Line (Bingwit/Kawil)",
  [GearType.HANDLINE]: "Handline (Kitang single)",
  [GearType.LONGLINE]: "Longline (Kitang)",
  [GearType.FISH_CORRAL]: "Fish Corral (Baklad)",
  [GearType.FISH_TRAP]: "Fish Trap (Bubo)",
  [GearType.BEACH_SEINE]: "Beach Seine (Baling/Sahid)",
  [GearType.RING_NET]: "Ring Net (Kubkob)",
  [GearType.CAST_NET]: "Cast Net (Dala)",
  [GearType.LIFT_NET]: "Lift Net (Basnig/Bintol)",
  [GearType.SCOOP_NET]: "Scoop/Push Net (Sakag/Sudsod)",
  [GearType.SPEAR_GUN]: "Spear Gun (Pana)",
  [GearType.FISH_POT]: "Fish Pot (Panggal)",
  [GearType.CRAB_LIFT_NET]: "Crab Lift Net (Bintol)",
  [GearType.SQUID_JIG]: "Squid Jig (Pangawil Pusit)",
  [GearType.GLEANING]: "Gleaning (Pamamanhik)",
  [GearType.OTHER]: "Other",
};

export const CATCH_DISPOSITION_LABELS: Record<CatchDisposition, string> = {
  [CatchDisposition.SOLD]: "Sold",
  [CatchDisposition.HOME_CONSUMED]: "Home Consumed",
  [CatchDisposition.BARTERED]: "Bartered",
  [CatchDisposition.DRIED_PROCESSED]: "Dried/Processed (Tuyo/Daing/Bagoong)",
  [CatchDisposition.SHARED_GIVEN]: "Shared/Given Away",
  [CatchDisposition.DISCARDED]: "Discarded (Bycatch/Spoilage)",
  [CatchDisposition.MIXED]: "Mixed (Per-species Split)",
};
