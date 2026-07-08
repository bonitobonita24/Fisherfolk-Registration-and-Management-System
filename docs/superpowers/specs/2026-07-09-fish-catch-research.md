# Fish Catch Activity — BFAR / NSAP Municipal Capture-Fisheries Research & Data Model

> **Purpose:** Ground the design of a "Fish Catch" activity feature in the LGU Calapan City Fisherfolk Registration & Management System (FRMS) in the real data requirements BFAR uses for municipal capture-fisheries monitoring, so the resulting Prisma model + Zod schema + form + reports align with how BFAR / NSAP / NFRDI actually record and aggregate landed catch and effort.
>
> **Author:** research-analyst (Spec-Driven Platform) · **Date:** 2026-07-09
> **Status:** Research spec — feeds the Fish Catch feature build (PRODUCT.md → Prisma → Zod → UI).

## (a) Overview — BFAR Municipal Catch Monitoring

**Who monitors what.** BFAR, through its research arm **NFRDI** (National Fisheries Research and Development Institute), runs the **National Stock Assessment Program (NSAP)** — a landed-catch and **catch-and-effort** monitoring system established in 1995. NSAP collects data from **~742 landing sites** nationwide and produces time-series stock-status analysis per **fishing ground**, organized under the country's **12 Fishery Management Areas (FMAs)**. Core NSAP data types are **species composition, length-frequency, and vessel catch-and-effort** at landing/port sampling sites.

**Two legally distinct tiers (RA 8550 / RA 10654, Philippine Fisheries Code):**
- **Municipal fisheries** — boats **≤ 3 gross tons** (or gear without a boat), inside **municipal waters** (0–15 km from shore). This is Calapan City FMO's tier and this feature's target. Fishers are individuals or crews of 2–3.
- **Commercial fisheries** — boats > 3 GT; file certified monthly **logsheets** recording *daily catch by fishing trip and fishing area (lat/long), quantity and value, spoilage, landing points, disposal.* Municipal monitoring mirrors these fields at barangay/zone granularity.

**The monitoring unit is a LANDING EVENT** (a catch-and-effort record): one fisher lands catch from one trip using one primary gear at one landing site on one date. Species composition (multiple species, each weighed) is recorded within that landing, and **effort** (hours fished, gear units, trip duration) is recorded so **CPUE** can be computed. So the model is: **a Catch header (landing/trip) + Catch-species line items (composition).**

**Municipal granularity for Calapan City:** fishing ground recorded at **barangay / municipal water zone** level (not lat/long), fitting FRMS's existing 62-barangay geodata and the density-map feature.

## (b) Recommended Data Model

Two related entities: a **`FishCatch`** header (one landing = one trip by one fisherfolk) and child **`FishCatchSpecies`** line items (species composition — one row per species). This normalization matches how NSAP records species composition within a landed catch and makes "total catch by species" and CPUE aggregations trivial.

### Entity 1 — `FishCatch` (landing / trip / effort header)

| Field | Type | Req? | Notes |
|---|---|---|---|
| `id` | string (cuid) | required | PK |
| `tenantId` | string | required | Multi-tenant guard (Rule 7), always scoped |
| `referenceNo` | string | required | Human ID e.g. `FC-2026-000123`, auto-gen, unique per tenant |
| `fisherfolkId` | string FK | required | The fisher who landed. **1 catch = 1 fisherfolk** |
| `vesselId` | string FK | optional | Vessel used, if any. Null = gleaning/gear-only. Same tenant |
| `landingDate` | Date | required | Primary time axis for monthly reports |
| `landingTime` | string HH:mm | optional | Time of landing/return |
| `departureAt` | DateTime | optional | Trip start — enables trip duration |
| `returnAt` | DateTime | optional | Trip end |
| `fishingGroundBarangayId` | string FK | optional | Barangay/zone fished (reuse geodata) |
| `fishingGroundLabel` | string | optional | Free-text ground/zone/named area |
| `fmaCode` | string/enum | optional | FMA code (confirm Calapan ≈ FMA with FMO) |
| `gearType` | enum `GearType` | required | Primary gear (§c). Drives CPUE-by-gear |
| `gearDetail` | string | optional | Mesh size, hook count, net length |
| `gearUnits` | int | optional | Number of gear units (nets/hooks/traps) — Category-A effort |
| `fishingHours` | decimal | optional | Hours actually fished — preferred CPUE denominator |
| `numTrips` | int | required (default 1) | Trips represented (supports daily roll-ups) |
| `numFishers` | int | optional | Crew size (per-fisher normalization) |
| `totalCatchKg` | decimal | required | Total landed kg. **Should equal Σ species `weightKg`** — validate/auto-sum |
| `estimatedValuePhp` | decimal | optional | Total est. value (PHP), may sum from species |
| `disposition` | enum `CatchDisposition` | optional | Primary disposition (§c); per-species also supported |
| `remarks` | string | optional | Field/sea-condition notes |
| `recordedById` | string FK user | required | Enumerator/staff (audit) |
| `source` | enum (`FMO_ENUMERATOR`,`SELF_REPORT`,`NSAP_SAMPLING`,`IMPORT`) | required (default `FMO_ENUMERATOR`) | Provenance |
| `createdAt`/`updatedAt` | DateTime | required | Timestamps |

**Derived (compute in queries, don't store):** `cpue = totalCatchKg / effort` (see §d); `speciesCount`.

### Entity 2 — `FishCatchSpecies` (species composition line)

| Field | Type | Req? | Notes |
|---|---|---|---|
| `id` | string cuid | required | PK |
| `tenantId` | string | required | Denormalized tenant guard |
| `fishCatchId` | string FK | required | Parent landing, `onDelete: Cascade` |
| `speciesId` | string FK | optional | FK to `Species` master (recommended) |
| `commonName` | string | required | Local name e.g. "Galunggong" (required even if no FK) |
| `scientificName` | string | optional | e.g. *Decapterus macrosoma*, auto-fill if linked |
| `weightKg` | decimal | required | This species' kg. Σ = header `totalCatchKg` |
| `quantityPcs` | int | optional | Piece count for large fish |
| `pricePerKgPhp` | decimal | optional | Unit price |
| `valuePhp` | decimal | optional | `weightKg × pricePerKgPhp` or direct |
| `disposition` | enum `CatchDisposition` | optional | Overrides header default |
| `avgLengthCm`/`sizeClass` | decimal/string | optional | Supports NSAP length-frequency later |

**Optional master `Species`:** `id`, `tenantId?`, `commonName`, `localName`, `scientificName`, `familyName?`, `fishGroup` (small pelagic/large pelagic/demersal/reef/crustacean/mollusk/freshwater), `isActive`. Seed from §c; editable via a Settings CRUD (like the barangay-alias table). Simpler build: skip table, use §c enum + free-text.

**Relationships:** `FishCatch` belongs to one `Fisherfolk` (required) and optionally one `Vessel`; has many `FishCatchSpecies`. Add `fishCatches[]` back-relations to `Fisherfolk` (profile "Related Records" grid) and `Vessel`. Optional `FishCatch → Barangay` for map/zone aggregation.

## (c) Enumerated Dropdown Lists

**`GearType`** (store as Prisma enum; UI label includes Filipino term):
`GILL_NET` (Pante), `HOOK_AND_LINE` (Bingwit/Kawil), `HANDLINE` (Kitang single), `LONGLINE` (Kitang), `FISH_CORRAL` (Baklad), `FISH_TRAP` (Bubo), `BEACH_SEINE` (Baling/Sahid), `RING_NET` (Kubkob), `CAST_NET` (Dala), `LIFT_NET` (Basnig/Bintol), `SCOOP_NET`/push net (Sakag/Sudsod), `SPEAR_GUN` (Pana), `FISH_POT` (Panggal), `CRAB_LIFT_NET` (Bintol), `SQUID_JIG` (Pangawil pusit), `GLEANING` (Pamamanhik), `OTHER`.

**Common municipal target species** (seed common → scientific → group): Galunggong/*Decapterus macrosoma*/small pelagic; Tulingan/*Auxis rochei, A. thazard*/small pelagic; Tambakol-Bariles/*Thunnus albacares, Katsuwonus pelamis*/large pelagic; Tamban/*Sardinella spp.*; Matambaka/*Selar crumenophthalmus*; Alumahan/*Rastrelliger kanagurta*; Hasa-hasa/*Rastrelliger brachysoma*; Dilis/*Stolephorus spp.*; Bangus/*Chanos chanos*; Tilapia/*Oreochromis niloticus*; Lapu-lapu/*Epinephelus spp.*/reef; Maya-maya/*Lutjanus spp.*; Talakitok/*Caranx spp.*; Bisugo/*Nemipterus spp.*; Dalagang-bukid/*Caesio/Pterocaesio spp.*; Molmol/*Scarus spp.*; Danggit/*Siganus spp.*; Kanduli/*Arius spp.*; Pusit/*Uroteuthis/Sepioteuthis spp.*/mollusk; Alimango/*Scylla serrata*/crustacean; Alimasag/*Portunus pelagicus*; Hipon/*Penaeus/Metapenaeus spp.*; Talaba-Tahong/*Crassostrea/Perna viridis*; Others (free text).

**`CatchDisposition`:** `SOLD`, `HOME_CONSUMED`, `BARTERED`, `DRIED_PROCESSED` (tuyo/daing/bagoong), `SHARED_GIVEN`, `DISCARDED` (bycatch/spoilage), `MIXED` (use per-species split).

## (d) CPUE — Definition & Effort Units

`CPUE = Total Catch (kg) / Fishing Effort` — BFAR/NSAP's key indirect index of stock abundance tracked over time.

| Effort basis | Formula | Fields |
|---|---|---|
| Per trip (default municipal roll-up) | `totalCatchKg / numTrips` | `numTrips` |
| Per gear-hour (most precise, NSAP Cat-A) | `totalCatchKg / (fishingHours × gearUnits)` | `fishingHours`, `gearUnits` |
| Per fishing-hour | `totalCatchKg / fishingHours` | `fishingHours` |
| Per boat-day (NSAP Cat-B "days fished") | `totalCatchKg / boatDays` | dates, `vesselId` |
| Per fisher-day | `totalCatchKg / (numFishers × days)` | `numFishers`, dates |

A Davao Gulf municipal study computed CPUE as *day's average catch ÷ average trip hours* (kg/fishing-hour). FAO recognizes effort tiers: **Category A** (hours fished, sets, hooks, lines — varies by gear) and **Category B** (days fished). Store raw effort components and compute CPUE at query time so the report UI picks the denominator. Chart **CPUE trend (monthly)** and **CPUE by gear** — declining CPUE is the key stock-health signal.

## (e) Recommended Reports & Charts

1. Total catch by species (top-N ranking) 2. Total catch by gear 3. Total catch by fishing ground/barangay (+density-map layer) 4. Catch trend by month 5. CPUE trend over time (selectable effort basis) 6. CPUE by gear 7. Estimated value (PHP) by species/gear/month 8. Effort summary (trips, hours, active fishers) 9. Per-fisherfolk & per-vessel catch history (profile grid) 10. Species composition (stacked). All filterable by date/barangay/gear/species/FMA/disposition, Excel/print export, plus a dashboard tile + showcase cards.

## (f) Sources

- [BFAR NSAP (Region 11)](https://region11.bfar.da.gov.ph/national-stock-assessment-program/)
- [DA-NFRDI NSAP](https://nfrdi.da.gov.ph/national-stock-assessment-program-nsap/)
- [NSAP Interactive Atlas](https://nsap.nfrdi.da.gov.ph/about)
- [NFRDI Common & Local Names of Marine Fishes](http://nfrdi.da.gov.ph/tpjf/etc/Common%20and%20Local%20Names%20of%20Marine%20Fishes%20of%20the%20Phils.PDF)
- [SEAFDEC Philippines Country Profile 2018](https://www.seafdec.org/fisheries-country-profile-philippines-2018/)
- [FAO Fishery Country Profile Philippines](https://www.fao.org/fishery/docs/DOCUMENT/fcp/en/FI_CP_PH.pdf)
- [FAO Fishery Management Data & Research (effort categories A/B)](https://www.fao.org/4/x8692e/x8692e09.htm)
- [Frontiers — Spatio-Temporal Declines in Philippine Fisheries (Davao Gulf municipal CPUE)](https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2016.00021/full)
- [Wikipedia — Catch per unit effort](https://en.wikipedia.org/wiki/Catch_per_unit_effort)
- [Philippine Fisheries Code IRR (RA 8550/10654)](http://www.oneocean.org/download/990330/fishery_code_irr.pdf)

---

## Data-model summary (for the M2 builder)

1. Two entities: `FishCatch` (landing/trip header) + `FishCatchSpecies` (composition line items, one per species).
2. `FishCatch` belongs to one `Fisherfolk` (required, 1 catch = 1 fisher) and optionally one `Vessel`; tenant-scoped (Rule 7).
3. Header captures landing date/time, fishing ground (barangay FK + free-text + FMA), and **effort** (`gearType`, `gearUnits`, `fishingHours`, `numTrips`, `numFishers`, departure/return).
4. Header totals: `totalCatchKg` (= Σ species weight, validated), `estimatedValuePhp`, `disposition`, provenance `source`, `recordedById`.
5. Each `FishCatchSpecies`: `commonName` (req) + `scientificName`, `weightKg` (req), `quantityPcs`, `pricePerKgPhp`/`valuePhp`, per-line `disposition`, optional length.
6. Enums: `GearType` (17 PH municipal gears), `CatchDisposition` (7 values); optional `Species` master (seedable, Settings-editable).
7. CPUE is **not stored** — computed at query time as `totalCatchKg / effort`, effort selectable (per-trip / gear-hour / boat-day) from stored raw components.
8. Zod: header schema + repeatable species field-array; `superRefine` enforces `totalCatchKg == Σ weightKg`.
9. Reports: catch by species/gear/ground/month, CPUE trend + by-gear, value, effort, per-fisher/vessel history; reuse Recharts + `/reports` + density-map + dashboard-tile patterns.
10. Directly Prisma/Zod/form-ready; respect TS-strict (Rule 12), tenant guard, existing barangay-geodata + shadcn patterns.
