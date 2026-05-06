import type { ViolationStatus } from "./enums";

export interface Violation {
  id: string;
  tenantId: string;
  fisherfolkId: string;
  vesselId: string | null;
  violationType: string;
  description: string;
  dateOfViolation: Date;
  location: string | null;
  reportedBy: string;
  status: ViolationStatus;
  resolution: string | null;
  penaltyAmount: number | null;
  evidenceUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ViolationCreateInput {
  tenantId: string;
  fisherfolkId: string;
  vesselId?: string | null;
  violationType: string;
  description: string;
  dateOfViolation: Date;
  location?: string | null;
  reportedBy: string;
  evidenceUrls?: string[];
}

export interface ViolationUpdateInput {
  violationType?: string;
  description?: string;
  dateOfViolation?: Date;
  location?: string | null;
  status?: ViolationStatus;
  resolution?: string | null;
  penaltyAmount?: number | null;
  evidenceUrls?: string[];
}
