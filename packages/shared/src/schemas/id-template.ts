import { z } from "zod";
import { idTemplateTypeSchema, idTemplateStatusSchema } from "./enums";

// ─── Card geometry constants ────────────────────────────────────────────────
// Owner spec 2026-07-01: CUT/TRIM size = 86×54mm (finished ID after cutting);
// BACKGROUND/BLEED size = 88×56mm (design extends 1mm past the cut on all sides so it
// overlaps the cut line — no white gaps when cut). See DECISIONS_LOG.md.
export const ID_CARD_GEOMETRY = {
  contentWidthMm: 86,
  contentHeightMm: 54,
  bleedWidthMm: 88,   // 86 + 2×1mm bleed
  bleedHeightMm: 56,  // 54 + 2×1mm bleed
  bleedMarginMm: 1,
  sheetWidthMm: 200,
  sheetHeightMm: 300,
  maxPairsPerSheet: 4,
} as const;

// ─── Template variable catalog ──────────────────────────────────────────────
export interface TemplateVariable {
  key: string;
  label: string;
  group: "FISHERFOLK" | "VESSEL" | "SHARED";
  kind: "text" | "image";
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // FISHERFOLK
  { key: "{{photo}}", label: "Photo", group: "FISHERFOLK", kind: "image" },
  { key: "{{signature}}", label: "Signature", group: "FISHERFOLK", kind: "image" },
  { key: "{{qr_code}}", label: "QR Code", group: "FISHERFOLK", kind: "image" },
  { key: "{{registration_number}}", label: "Registration Number", group: "FISHERFOLK", kind: "text" },
  { key: "{{full_name}}", label: "Full Name", group: "FISHERFOLK", kind: "text" },
  { key: "{{last_name}}", label: "Last Name", group: "FISHERFOLK", kind: "text" },
  { key: "{{first_name}}", label: "First Name", group: "FISHERFOLK", kind: "text" },
  { key: "{{middle_name}}", label: "Middle Name", group: "FISHERFOLK", kind: "text" },
  { key: "{{date_of_birth}}", label: "Date of Birth", group: "FISHERFOLK", kind: "text" },
  { key: "{{sex}}", label: "Sex", group: "FISHERFOLK", kind: "text" },
  { key: "{{address}}", label: "Address", group: "FISHERFOLK", kind: "text" },
  { key: "{{barangay}}", label: "Barangay", group: "FISHERFOLK", kind: "text" },
  { key: "{{rsbsa_number}}", label: "RSBSA Number", group: "FISHERFOLK", kind: "text" },
  { key: "{{categories}}", label: "Categories", group: "FISHERFOLK", kind: "text" },
  { key: "{{date_joined}}", label: "Date Joined", group: "FISHERFOLK", kind: "text" },
  // VESSEL
  { key: "{{vessel_photo}}", label: "Vessel Photo", group: "VESSEL", kind: "image" },
  { key: "{{vessel_qr_code}}", label: "Vessel QR Code", group: "VESSEL", kind: "image" },
  { key: "{{mfvr_number}}", label: "MFVR Number", group: "VESSEL", kind: "text" },
  { key: "{{vessel_name}}", label: "Vessel Name", group: "VESSEL", kind: "text" },
  { key: "{{vessel_type}}", label: "Vessel Type", group: "VESSEL", kind: "text" },
  { key: "{{hull_material}}", label: "Hull Material", group: "VESSEL", kind: "text" },
  { key: "{{place_built}}", label: "Place Built", group: "VESSEL", kind: "text" },
  { key: "{{year_built}}", label: "Year Built", group: "VESSEL", kind: "text" },
  { key: "{{homeport}}", label: "Homeport", group: "VESSEL", kind: "text" },
  { key: "{{gross_tonnage}}", label: "Gross Tonnage", group: "VESSEL", kind: "text" },
  { key: "{{horsepower}}", label: "Horsepower", group: "VESSEL", kind: "text" },
  // SHARED
  { key: "{{mayor_name}}", label: "Mayor Name", group: "SHARED", kind: "text" },
  { key: "{{mayor_signature}}", label: "Mayor Signature", group: "SHARED", kind: "image" },
  { key: "{{registration_year}}", label: "Registration Year", group: "SHARED", kind: "text" },
];

const VARIABLE_KEYS = TEMPLATE_VARIABLES.map((v) => v.key) as [string, ...string[]];
export const templateVariableKeySchema = z.enum(VARIABLE_KEYS);
export type TemplateVariableKey = z.infer<typeof templateVariableKeySchema>;

// ─── Element shared base ────────────────────────────────────────────────────
const elementBaseSchema = z.object({
  id: z.string().min(1),
  xMm: z.number(),
  yMm: z.number(),
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  rotation: z.number().default(0),
  zIndex: z.number().int(),
});

const typographyFields = {
  fontFamily: z.string().min(1),
  fontSizePt: z.number().positive(),
  fontWeight: z.union([
    z.literal(400),
    z.literal(500),
    z.literal(600),
    z.literal(700),
  ]),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a 6-digit hex colour (#RRGGBB)"),
  align: z.enum(["left", "center", "right"]),
};

// ─── ID element discriminated union ────────────────────────────────────────
export const idElementSchema = z.discriminatedUnion("type", [
  // Static literal text
  elementBaseSchema.extend({
    type: z.literal("text"),
    content: z.string(),
    ...typographyFields,
  }),
  // Dynamic variable — resolved at print time from the template-variable catalog
  elementBaseSchema.extend({
    type: z.literal("variable"),
    variableKey: templateVariableKeySchema,
    ...typographyFields,
  }),
  // Uploaded image asset (logo, seal, decoration)
  elementBaseSchema.extend({
    type: z.literal("image"),
    url: z.string().url(),
  }),
  // Icon — emoji or url; presence of at least one enforced at the application layer
  // (z.discriminatedUnion members must be ZodObject; refine wraps in ZodEffects)
  elementBaseSchema.extend({
    type: z.literal("icon"),
    emoji: z.string().optional(),
    url: z.string().url().optional(),
  }),
  // Placeholder: fisherfolk portrait photo
  elementBaseSchema.extend({ type: z.literal("photo") }),
  // Placeholder: fisherfolk ink signature
  elementBaseSchema.extend({ type: z.literal("signature") }),
  // Placeholder: QR code generated from registration data
  elementBaseSchema.extend({ type: z.literal("qr") }),
]);

export type IdElement = z.infer<typeof idElementSchema>;

// ─── Template CRUD schemas ──────────────────────────────────────────────────
export const idTemplateCreateSchema = z.object({
  name: z.string().min(1),
  templateType: idTemplateTypeSchema,
  frontBackgroundUrl: z.string().optional(),
  backBackgroundUrl: z.string().optional(),
  frontElements: z.array(idElementSchema),
  backElements: z.array(idElementSchema),
  status: idTemplateStatusSchema.optional(),
});

export const idTemplateUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).optional(),
  templateType: idTemplateTypeSchema.optional(),
  frontBackgroundUrl: z.string().nullable().optional(),
  backBackgroundUrl: z.string().nullable().optional(),
  frontElements: z.array(idElementSchema).optional(),
  backElements: z.array(idElementSchema).optional(),
  status: idTemplateStatusSchema.optional(),
});

export const idTemplateDuplicateSchema = z.object({ id: z.string().cuid() });
