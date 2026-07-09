export const FisherfolkStatus = {
  NEW: "NEW",
  ACTIVE: "ACTIVE",
  RENEWED: "RENEWED",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type FisherfolkStatus =
  (typeof FisherfolkStatus)[keyof typeof FisherfolkStatus];

export const VesselStatus = {
  ACTIVE: "ACTIVE",
  IMPOUNDED: "IMPOUNDED",
  INACTIVE: "INACTIVE",
} as const;
export type VesselStatus = (typeof VesselStatus)[keyof typeof VesselStatus];

export const ViolationStatus = {
  ACTIVE: "ACTIVE",
  LIFTED: "LIFTED",
  ARCHIVED: "ARCHIVED",
} as const;
export type ViolationStatus =
  (typeof ViolationStatus)[keyof typeof ViolationStatus];

export const ViolationTargetType = {
  FISHERFOLK: "FISHERFOLK",
  VESSEL: "VESSEL",
  BOTH: "BOTH",
} as const;
export type ViolationTargetType =
  (typeof ViolationTargetType)[keyof typeof ViolationTargetType];

export const EditRequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type EditRequestStatus =
  (typeof EditRequestStatus)[keyof typeof EditRequestStatus];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  REQUEST: "REQUEST",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  RENEW: "RENEW",
  PRINT: "PRINT",
  VIOLATION_FILED: "VIOLATION_FILED",
  VIOLATION_LIFTED: "VIOLATION_LIFTED",
  LOGIN: "LOGIN",
  EXPORT: "EXPORT",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const UserRole = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  ENCODER: "encoder",
  VIEWER: "viewer",
  BANTAY_DAGAT: "bantay_dagat",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  DEACTIVATED: "DEACTIVATED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const TenantStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const KanbanTaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
export type KanbanTaskStatus =
  (typeof KanbanTaskStatus)[keyof typeof KanbanTaskStatus];

export const KanbanTaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type KanbanTaskPriority =
  (typeof KanbanTaskPriority)[keyof typeof KanbanTaskPriority];

export const NotificationType = {
  INFO: "INFO",
  WARNING: "WARNING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const AyudaProgramStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type AyudaProgramStatus =
  (typeof AyudaProgramStatus)[keyof typeof AyudaProgramStatus];

export const AyudaBeneficiaryStatus = {
  PENDING: "PENDING",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
} as const;
export type AyudaBeneficiaryStatus =
  (typeof AyudaBeneficiaryStatus)[keyof typeof AyudaBeneficiaryStatus];

export const AyudaUploadType = {
  SIGNED_SHEET: "SIGNED_SHEET",
  EVENT_PHOTO: "EVENT_PHOTO",
} as const;
export type AyudaUploadType =
  (typeof AyudaUploadType)[keyof typeof AyudaUploadType];

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const CivilStatus = {
  SINGLE: "SINGLE",
  MARRIED: "MARRIED",
  WIDOWED: "WIDOWED",
  SEPARATED: "SEPARATED",
  DIVORCED: "DIVORCED",
} as const;
export type CivilStatus = (typeof CivilStatus)[keyof typeof CivilStatus];

export const CategoryIconType = {
  EMOJI: "EMOJI",
  IMAGE: "IMAGE",
} as const;
export type CategoryIconType =
  (typeof CategoryIconType)[keyof typeof CategoryIconType];

export const CategoryStatus = {
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
} as const;
export type CategoryStatus =
  (typeof CategoryStatus)[keyof typeof CategoryStatus];

export const IDTemplateType = {
  FISHERFOLK: "FISHERFOLK",
  VESSEL: "VESSEL",
} as const;
export type IDTemplateType =
  (typeof IDTemplateType)[keyof typeof IDTemplateType];

export const IDTemplateStatus = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type IDTemplateStatus =
  (typeof IDTemplateStatus)[keyof typeof IDTemplateStatus];

export const CommentTicketStatus = {
  OPEN: "OPEN",
  RESOLVED: "RESOLVED",
} as const;
export type CommentTicketStatus =
  (typeof CommentTicketStatus)[keyof typeof CommentTicketStatus];

export const EntityType = {
  FISHERFOLK: "FISHERFOLK",
  VESSEL: "VESSEL",
  VIOLATION: "VIOLATION",
  USER: "USER",
  TENANT: "TENANT",
  CATEGORY: "CATEGORY",
  KANBAN_TASK: "KANBAN_TASK",
  AYUDA_PROGRAM: "AYUDA_PROGRAM",
  AYUDA_BENEFICIARY: "AYUDA_BENEFICIARY",
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const GearType = {
  GILL_NET: "GILL_NET",
  HOOK_AND_LINE: "HOOK_AND_LINE",
  HANDLINE: "HANDLINE",
  LONGLINE: "LONGLINE",
  FISH_CORRAL: "FISH_CORRAL",
  FISH_TRAP: "FISH_TRAP",
  BEACH_SEINE: "BEACH_SEINE",
  RING_NET: "RING_NET",
  CAST_NET: "CAST_NET",
  LIFT_NET: "LIFT_NET",
  SCOOP_NET: "SCOOP_NET",
  SPEAR_GUN: "SPEAR_GUN",
  FISH_POT: "FISH_POT",
  CRAB_LIFT_NET: "CRAB_LIFT_NET",
  SQUID_JIG: "SQUID_JIG",
  GLEANING: "GLEANING",
  OTHER: "OTHER",
} as const;
export type GearType = (typeof GearType)[keyof typeof GearType];

export const CatchDisposition = {
  SOLD: "SOLD",
  HOME_CONSUMED: "HOME_CONSUMED",
  BARTERED: "BARTERED",
  DRIED_PROCESSED: "DRIED_PROCESSED",
  SHARED_GIVEN: "SHARED_GIVEN",
  DISCARDED: "DISCARDED",
  MIXED: "MIXED",
} as const;
export type CatchDisposition =
  (typeof CatchDisposition)[keyof typeof CatchDisposition];

export const FishCatchSource = {
  FMO_ENUMERATOR: "FMO_ENUMERATOR",
  SELF_REPORT: "SELF_REPORT",
  NSAP_SAMPLING: "NSAP_SAMPLING",
  IMPORT: "IMPORT",
} as const;
export type FishCatchSource =
  (typeof FishCatchSource)[keyof typeof FishCatchSource];
