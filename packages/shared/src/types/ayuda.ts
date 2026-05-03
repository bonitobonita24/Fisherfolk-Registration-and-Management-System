import type {
  AyudaBeneficiaryStatus,
  AyudaProgramStatus,
} from "./enums.js";

export interface AyudaProgram {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  budget: number | null;
  startDate: Date | null;
  endDate: Date | null;
  status: AyudaProgramStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AyudaProgramCreateInput {
  tenantId: string;
  name: string;
  description?: string | null;
  budget?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: AyudaProgramStatus;
}

export interface AyudaProgramUpdateInput {
  name?: string;
  description?: string | null;
  budget?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: AyudaProgramStatus;
}

export interface AyudaBeneficiary {
  id: string;
  tenantId: string;
  programId: string;
  fisherfolkId: string;
  amountReceived: number | null;
  dateReceived: Date | null;
  status: AyudaBeneficiaryStatus;
  createdAt: Date;
}

export interface AyudaBeneficiaryCreateInput {
  tenantId: string;
  programId: string;
  fisherfolkId: string;
  amountReceived?: number | null;
  dateReceived?: Date | null;
  status?: AyudaBeneficiaryStatus;
}

export interface AyudaBeneficiaryUpdateInput {
  amountReceived?: number | null;
  dateReceived?: Date | null;
  status?: AyudaBeneficiaryStatus;
}

export interface AyudaUpload {
  id: string;
  tenantId: string;
  programId: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface AyudaUploadCreateInput {
  tenantId: string;
  programId: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
}
