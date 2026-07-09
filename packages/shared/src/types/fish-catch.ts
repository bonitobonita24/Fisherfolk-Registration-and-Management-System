import type { CatchDisposition, FishCatchSource, GearType } from "./enums";

export interface FishCatchSpeciesLine {
  id: string;
  tenantId: string;
  fishCatchId: string;
  commonName: string;
  scientificName: string | null;
  weightKg: number;
  quantityPcs: number | null;
  pricePerKgPhp: number | null;
  valuePhp: number | null;
  disposition: CatchDisposition | null;
  avgLengthCm: number | null;
  sizeClass: string | null;
  createdAt: Date;
}

export interface FishCatchListItem {
  id: string;
  tenantId: string;
  referenceNo: string;
  fisherfolkId: string;
  vesselId: string | null;
  landingDate: Date;
  gearType: GearType;
  totalCatchKg: number;
  estimatedValuePhp: number | null;
  disposition: CatchDisposition | null;
  source: FishCatchSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface FishCatchDetail extends FishCatchListItem {
  landingTime: string | null;
  departureAt: Date | null;
  returnAt: Date | null;
  fishingGroundBarangay: string | null;
  fishingGroundLabel: string | null;
  fmaCode: string | null;
  gearDetail: string | null;
  gearUnits: number | null;
  fishingHours: number | null;
  numTrips: number;
  numFishers: number | null;
  remarks: string | null;
  recordedById: string | null;
  createdById: string | null;
  updatedById: string | null;
  species: FishCatchSpeciesLine[];
}
