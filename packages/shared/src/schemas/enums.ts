import { z } from "zod";
import {
  FisherfolkStatus,
  VesselStatus,
  ViolationStatus,
  EditRequestStatus,
  AuditAction,
  UserRole,
  KanbanTaskStatus,
  KanbanTaskPriority,
  NotificationType,
  AyudaProgramStatus,
  AyudaBeneficiaryStatus,
  Gender,
  CivilStatus,
  EntityType,
} from "../types/enums.js";

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

export const editRequestStatusSchema = z.enum([
  EditRequestStatus.PENDING,
  EditRequestStatus.APPROVED,
  EditRequestStatus.REJECTED,
]);

export const auditActionSchema = z.enum([
  AuditAction.CREATE,
  AuditAction.UPDATE,
  AuditAction.DELETE,
]);

export const userRoleSchema = z.enum([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.ENCODER,
  UserRole.VIEWER,
  UserRole.BANTAY_DAGAT,
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

export const genderSchema = z.enum([Gender.MALE, Gender.FEMALE]);

export const civilStatusSchema = z.enum([
  CivilStatus.SINGLE,
  CivilStatus.MARRIED,
  CivilStatus.WIDOWED,
  CivilStatus.SEPARATED,
  CivilStatus.DIVORCED,
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
