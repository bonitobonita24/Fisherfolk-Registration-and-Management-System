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
