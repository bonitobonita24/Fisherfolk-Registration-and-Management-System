import { z } from "zod";

export const reportDomainSchema = z.enum([
  "fisherfolk",
  "household",
  "vessel",
  "violation",
  "ayuda",
  "fish-catch",
]);

export const universalReportFilterSchema = z
  .object({
    barangays: z.array(z.string().min(1)).optional(),
    categoryIds: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
    vesselTypes: z.array(z.string().min(1)).optional(),
    vesselOwner: z.enum(["yes", "no"]).optional(),
    ageMin: z.number().int().min(0).max(150).optional(),
    ageMax: z.number().int().min(0).max(150).optional(),
    programId: z.string().cuid().optional(),
    gearType: z.string().min(1).optional(),
    dateFrom: z.string().date().optional(),
    dateTo: z.string().date().optional(),
  })
  .strict()
  .refine(
    (f) => f.ageMin === undefined || f.ageMax === undefined || f.ageMin <= f.ageMax,
    { message: "ageMin must be ≤ ageMax", path: ["ageMin"] },
  );

export type ReportDomain = z.infer<typeof reportDomainSchema>;
export type UniversalReportFilter = z.infer<typeof universalReportFilterSchema>;
