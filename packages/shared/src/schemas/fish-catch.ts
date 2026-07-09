import { z } from "zod";
import {
  GearType,
  CatchDisposition,
  FishCatchSource,
} from "../types/enums";

export const gearTypeSchema = z.enum([
  GearType.GILL_NET,
  GearType.HOOK_AND_LINE,
  GearType.HANDLINE,
  GearType.LONGLINE,
  GearType.FISH_CORRAL,
  GearType.FISH_TRAP,
  GearType.BEACH_SEINE,
  GearType.RING_NET,
  GearType.CAST_NET,
  GearType.LIFT_NET,
  GearType.SCOOP_NET,
  GearType.SPEAR_GUN,
  GearType.FISH_POT,
  GearType.CRAB_LIFT_NET,
  GearType.SQUID_JIG,
  GearType.GLEANING,
  GearType.OTHER,
]);

export const catchDispositionSchema = z.enum([
  CatchDisposition.SOLD,
  CatchDisposition.HOME_CONSUMED,
  CatchDisposition.BARTERED,
  CatchDisposition.DRIED_PROCESSED,
  CatchDisposition.SHARED_GIVEN,
  CatchDisposition.DISCARDED,
  CatchDisposition.MIXED,
]);

export const fishCatchSourceSchema = z.enum([
  FishCatchSource.FMO_ENUMERATOR,
  FishCatchSource.SELF_REPORT,
  FishCatchSource.NSAP_SAMPLING,
  FishCatchSource.IMPORT,
]);

export const fishCatchSpeciesInputSchema = z.object({
  commonName: z.string().min(1),
  scientificName: z.string().optional(),
  weightKg: z.number().nonnegative(),
  quantityPcs: z.number().int().nonnegative().optional(),
  pricePerKgPhp: z.number().nonnegative().optional(),
  valuePhp: z.number().nonnegative().optional(),
  disposition: catchDispositionSchema.optional(),
  avgLengthCm: z.number().nonnegative().optional(),
  sizeClass: z.string().optional(),
});

const CATCH_WEIGHT_TOLERANCE = 0.01;

export const fishCatchCreateSchema = z
  .object({
    fisherfolkId: z.string().cuid(),
    vesselId: z.string().cuid().optional(),
    landingDate: z.coerce.date(),
    landingTime: z.string().optional(),
    departureAt: z.coerce.date().optional(),
    returnAt: z.coerce.date().optional(),
    fishingGroundBarangay: z.string().optional(),
    fishingGroundLabel: z.string().optional(),
    fmaCode: z.string().optional(),
    gearType: gearTypeSchema,
    gearDetail: z.string().optional(),
    gearUnits: z.number().int().nonnegative().optional(),
    fishingHours: z.number().nonnegative().optional(),
    numTrips: z.number().int().min(1).default(1),
    numFishers: z.number().int().nonnegative().optional(),
    totalCatchKg: z.number().nonnegative(),
    estimatedValuePhp: z.number().nonnegative().optional(),
    disposition: catchDispositionSchema.optional(),
    remarks: z.string().optional(),
    source: fishCatchSourceSchema.default(FishCatchSource.FMO_ENUMERATOR),
    species: z.array(fishCatchSpeciesInputSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const speciesTotal = data.species.reduce(
      (sum, s) => sum + s.weightKg,
      0,
    );
    if (Math.abs(speciesTotal - data.totalCatchKg) > CATCH_WEIGHT_TOLERANCE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalCatchKg"],
        message: `totalCatchKg (${data.totalCatchKg}) must equal the sum of species weightKg (${speciesTotal})`,
      });
    }
  });

const fishCatchUpdateDataSchema = z.object({
  fisherfolkId: z.string().cuid().optional(),
  vesselId: z.string().cuid().nullable().optional(),
  landingDate: z.coerce.date().optional(),
  landingTime: z.string().nullable().optional(),
  departureAt: z.coerce.date().nullable().optional(),
  returnAt: z.coerce.date().nullable().optional(),
  fishingGroundBarangay: z.string().nullable().optional(),
  fishingGroundLabel: z.string().nullable().optional(),
  fmaCode: z.string().nullable().optional(),
  gearType: gearTypeSchema.optional(),
  gearDetail: z.string().nullable().optional(),
  gearUnits: z.number().int().nonnegative().nullable().optional(),
  fishingHours: z.number().nonnegative().nullable().optional(),
  numTrips: z.number().int().min(1).optional(),
  numFishers: z.number().int().nonnegative().nullable().optional(),
  totalCatchKg: z.number().nonnegative().optional(),
  estimatedValuePhp: z.number().nonnegative().nullable().optional(),
  disposition: catchDispositionSchema.nullable().optional(),
  remarks: z.string().nullable().optional(),
  source: fishCatchSourceSchema.optional(),
  species: z.array(fishCatchSpeciesInputSchema).min(1).optional(),
});

export const fishCatchUpdateSchema = z.object({
  id: z.string().cuid(),
  data: fishCatchUpdateDataSchema,
});
