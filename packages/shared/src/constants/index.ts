import {
  UserRole,
  FisherfolkStatus,
  VesselStatus,
  ViolationStatus,
  EditRequestStatus,
  AuditAction,
  KanbanTaskStatus,
  KanbanTaskPriority,
  NotificationType,
  AyudaProgramStatus,
  AyudaBeneficiaryStatus,
  Gender,
  CivilStatus,
  EntityType,
} from "../types/enums";

export const USER_ROLES = Object.values(UserRole);
export const FISHERFOLK_STATUSES = Object.values(FisherfolkStatus);
export const VESSEL_STATUSES = Object.values(VesselStatus);
export const VIOLATION_STATUSES = Object.values(ViolationStatus);
export const EDIT_REQUEST_STATUSES = Object.values(EditRequestStatus);
export const AUDIT_ACTIONS = Object.values(AuditAction);
export const KANBAN_TASK_STATUSES = Object.values(KanbanTaskStatus);
export const KANBAN_TASK_PRIORITIES = Object.values(KanbanTaskPriority);
export const NOTIFICATION_TYPES = Object.values(NotificationType);
export const AYUDA_PROGRAM_STATUSES = Object.values(AyudaProgramStatus);
export const AYUDA_BENEFICIARY_STATUSES = Object.values(AyudaBeneficiaryStatus);
export const GENDERS = Object.values(Gender);
export const CIVIL_STATUSES = Object.values(CivilStatus);
export const ENTITY_TYPES = Object.values(EntityType);

export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 200,
} as const;

// Source: PSA Philippine Standard Geographic Code (Calapan City, Oriental Mindoro — 62 barangays).
// Admin MUST verify before production go-live — barangay names occasionally change.
// Future: tenant-managed barangay list in Settings (per municipality, with edit + auto-seed).
export const CALAPAN_BARANGAYS = [
  "Balingayan",
  "Balite",
  "Baruyan",
  "Batino",
  "Bayanan I",
  "Bayanan II",
  "Biga",
  "Bondoc",
  "Bucayao",
  "Buhuan",
  "Bulusan",
  "Calero",
  "Camansihan",
  "Camilmil",
  "Canubing I",
  "Canubing II",
  "Comunal",
  "Guinobatan",
  "Gulod",
  "Gutad",
  "Ibaba East",
  "Ibaba West",
  "Ilaya",
  "Lalud",
  "Lazareto",
  "Libis",
  "Lumang Bayan",
  "Mahal na Pangalan",
  "Maidlang",
  "Malad",
  "Malamig",
  "Managpi",
  "Masipit",
  "Nag-iba I",
  "Nag-iba II",
  "Navotas",
  "Pachoca",
  "Palhi",
  "Panggalaan",
  "Parang",
  "Patas",
  "Personas",
  "Putingtubig",
  "Sabang",
  "Salong",
  "San Antonio",
  "San Vicente Central",
  "San Vicente East",
  "San Vicente North",
  "San Vicente South",
  "San Vicente West",
  "Santa Cruz",
  "Santa Isabel",
  "Santa Maria Village",
  "Santa Rita",
  "Santo Niño",
  "Sapul",
  "Silonay",
  "Suqui",
  "Tawagan",
  "Tawiran",
  "Tibag",
] as const;

export type CalapanBarangay = (typeof CALAPAN_BARANGAYS)[number];
