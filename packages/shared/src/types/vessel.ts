import type { VesselStatus } from "./enums";

export interface Vessel {
  id: string;
  tenantId: string;
  fisherfolkId: string;
  vesselName: string;
  vesselType: string;
  registrationNumber: string;
  material: string | null;
  length: number | null;
  width: number | null;
  tonnage: number | null;
  engineType: string | null;
  horsepower: number | null;
  homePort: string | null;
  status: VesselStatus;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VesselCreateInput {
  tenantId: string;
  fisherfolkId: string;
  vesselName: string;
  vesselType: string;
  registrationNumber: string;
  material?: string | null;
  length?: number | null;
  width?: number | null;
  tonnage?: number | null;
  engineType?: string | null;
  horsepower?: number | null;
  homePort?: string | null;
}

export interface VesselUpdateInput {
  vesselName?: string;
  vesselType?: string;
  registrationNumber?: string;
  material?: string | null;
  length?: number | null;
  width?: number | null;
  tonnage?: number | null;
  engineType?: string | null;
  horsepower?: number | null;
  homePort?: string | null;
  status?: VesselStatus;
  photoUrl?: string | null;
}
