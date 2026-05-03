import type {
  CivilStatus,
  FisherfolkStatus,
  Gender,
} from "./enums.js";

export interface Fisherfolk {
  id: string;
  tenantId: string;
  registrationNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  dateOfBirth: Date;
  gender: Gender;
  civilStatus: CivilStatus;
  nationality: string;
  contactNumber: string | null;
  email: string | null;
  barangay: string;
  address: string;
  educationalAttainment: string | null;
  livelihoodType: string;
  organizationMembership: string | null;
  photoUrl: string | null;
  qrCodeData: string | null;
  status: FisherfolkStatus;
  statusExpiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface FisherfolkCreateInput {
  tenantId: string;
  registrationNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  dateOfBirth: Date;
  gender: Gender;
  civilStatus: CivilStatus;
  nationality: string;
  contactNumber?: string | null;
  email?: string | null;
  barangay: string;
  address: string;
  educationalAttainment?: string | null;
  livelihoodType: string;
  organizationMembership?: string | null;
  photoUrl?: string | null;
  createdBy: string;
}

export interface FisherfolkUpdateInput {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  suffix?: string | null;
  dateOfBirth?: Date;
  gender?: Gender;
  civilStatus?: CivilStatus;
  nationality?: string;
  contactNumber?: string | null;
  email?: string | null;
  barangay?: string;
  address?: string;
  educationalAttainment?: string | null;
  livelihoodType?: string;
  organizationMembership?: string | null;
  photoUrl?: string | null;
  status?: FisherfolkStatus;
  statusExpiryDate?: Date | null;
}
