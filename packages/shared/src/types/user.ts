import type { UserRole } from "./enums";

export interface User {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  securityVersion: number;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  tenantId: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}
