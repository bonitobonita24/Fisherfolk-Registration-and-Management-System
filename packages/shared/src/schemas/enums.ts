import { z } from "zod";
import {
  FisherfolkStatus,
  VesselStatus,
  ViolationStatus,
  ViolationTargetType,
  EditRequestStatus,
  AuditAction,
  UserRole,
  UserStatus,
  TenantStatus,
  KanbanTaskStatus,
  KanbanTaskPriority,
  NotificationType,
  AyudaProgramStatus,
  AyudaBeneficiaryStatus,
  AyudaUploadType,
  Gender,
  CivilStatus,
  CategoryIconType,
  CategoryStatus,
  IDTemplateType,
  IDTemplateStatus,
  CommentTicketStatus,
  EntityType,
} from "../types/enums";

export const fisherfolkStatusSchema = z.enum([
  FisherfolkStatus.NEW,
  FisherfolkStatus.ACTIVE,
  FisherfolkStatus.RENEWED,
  FisherfolkStatus.INACTIVE,
  FisherfolkStatus.ARCHIVED,
]);

export const vesselStatusSchema = z.enum([
  VesselStatus.ACTIVE,
  VesselStatus.IMPOUNDED,
  VesselStatus.INACTIVE,
]);

export const violationStatusSchema = z.enum([
  ViolationStatus.ACTIVE,
  ViolationStatus.LIFTED,
  ViolationStatus.ARCHIVED,
]);

export const violationTargetTypeSchema = z.enum([
  ViolationTargetType.FISHERFOLK,
  ViolationTargetType.VESSEL,
  ViolationTargetType.BOTH,
]);

export const editRequestStatusSchema = z.enum([
  EditRequestStatus.PENDING,
  EditRequestStatus.APPROVED,
  EditRequestStatus.REJECTED,
]);

export const auditActionSchema = z.enum([
  AuditAction.CREATE,
  AuditAction.UPDATE,
  AuditAction.DELETE,
  AuditAction.REQUEST,
  AuditAction.APPROVE,
  AuditAction.REJECT,
  AuditAction.RENEW,
  AuditAction.VIOLATION_FILED,
  AuditAction.VIOLATION_LIFTED,
  AuditAction.LOGIN,
  AuditAction.EXPORT,
]);

export const userRoleSchema = z.enum([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.ENCODER,
  UserRole.VIEWER,
  UserRole.BANTAY_DAGAT,
]);

export const userStatusSchema = z.enum([
  UserStatus.ACTIVE,
  UserStatus.DEACTIVATED,
]);

export const tenantStatusSchema = z.enum([
  TenantStatus.ACTIVE,
  TenantStatus.SUSPENDED,
]);

export const kanbanTaskStatusSchema = z.enum([
  KanbanTaskStatus.TODO,
  KanbanTaskStatus.IN_PROGRESS,
  KanbanTaskStatus.DONE,
]);

export const kanbanTaskPrioritySchema = z.enum([
  KanbanTaskPriority.LOW,
  KanbanTaskPriority.MEDIUM,
  KanbanTaskPriority.HIGH,
  KanbanTaskPriority.URGENT,
]);

export const notificationTypeSchema = z.enum([
  NotificationType.INFO,
  NotificationType.WARNING,
  NotificationType.SUCCESS,
  NotificationType.ERROR,
]);

export const ayudaProgramStatusSchema = z.enum([
  AyudaProgramStatus.DRAFT,
  AyudaProgramStatus.ACTIVE,
  AyudaProgramStatus.COMPLETED,
  AyudaProgramStatus.CANCELLED,
]);

export const ayudaBeneficiaryStatusSchema = z.enum([
  AyudaBeneficiaryStatus.PENDING,
  AyudaBeneficiaryStatus.RECEIVED,
  AyudaBeneficiaryStatus.CANCELLED,
]);

export const ayudaUploadTypeSchema = z.enum([
  AyudaUploadType.SIGNED_SHEET,
  AyudaUploadType.EVENT_PHOTO,
]);

export const genderSchema = z.enum([Gender.MALE, Gender.FEMALE]);

export const civilStatusSchema = z.enum([
  CivilStatus.SINGLE,
  CivilStatus.MARRIED,
  CivilStatus.WIDOWED,
  CivilStatus.SEPARATED,
  CivilStatus.DIVORCED,
]);

export const categoryIconTypeSchema = z.enum([
  CategoryIconType.EMOJI,
  CategoryIconType.IMAGE,
]);

export const categoryStatusSchema = z.enum([
  CategoryStatus.ACTIVE,
  CategoryStatus.DISABLED,
]);

export const idTemplateTypeSchema = z.enum([
  IDTemplateType.FISHERFOLK,
  IDTemplateType.VESSEL,
]);

export const idTemplateStatusSchema = z.enum([
  IDTemplateStatus.ACTIVE,
  IDTemplateStatus.ARCHIVED,
]);

export const commentTicketStatusSchema = z.enum([
  CommentTicketStatus.OPEN,
  CommentTicketStatus.RESOLVED,
]);

export const entityTypeSchema = z.enum([
  EntityType.FISHERFOLK,
  EntityType.VESSEL,
  EntityType.VIOLATION,
  EntityType.USER,
  EntityType.TENANT,
  EntityType.CATEGORY,
  EntityType.KANBAN_TASK,
  EntityType.AYUDA_PROGRAM,
  EntityType.AYUDA_BENEFICIARY,
]);
