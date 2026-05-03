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
} from "../types/enums.js";

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
