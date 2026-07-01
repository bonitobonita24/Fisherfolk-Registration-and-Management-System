import { z } from "zod";

export const idPrintSubjectTypeSchema = z.enum(["FISHERFOLK", "VESSEL"]);
export const idPrintRegistrationTypeSchema = z.enum(["NEW", "RENEWED", "UPDATE"]);

export const idPrintSubjectSchema = z.object({
  subjectId: z.string().cuid(),
  subjectType: idPrintSubjectTypeSchema,
  registrationType: idPrintRegistrationTypeSchema,
});

export const idPrintValidateSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
  templateType: z.enum(["FISHERFOLK", "VESSEL"]),
});

export const idPrintRecordSchema = z.object({
  templateId: z.string().cuid(),
  templateType: z.enum(["FISHERFOLK", "VESSEL"]),
  subjects: z.array(idPrintSubjectSchema).min(1),
});

export type IdPrintSubject = z.infer<typeof idPrintSubjectSchema>;
export type IdPrintValidateInput = z.infer<typeof idPrintValidateSchema>;
export type IdPrintRecordInput = z.infer<typeof idPrintRecordSchema>;
