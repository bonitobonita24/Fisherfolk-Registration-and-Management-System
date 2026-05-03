export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  logoUrl: string | null;
  accentColor: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPasswordEncrypted: string | null;
  smtpFrom: string | null;
  smtpFromName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantCreateInput {
  name: string;
  slug: string;
  isActive?: boolean;
  logoUrl?: string | null;
  accentColor?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPasswordEncrypted?: string | null;
  smtpFrom?: string | null;
  smtpFromName?: string | null;
}

export interface TenantUpdateInput {
  name?: string;
  slug?: string;
  isActive?: boolean;
  logoUrl?: string | null;
  accentColor?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPasswordEncrypted?: string | null;
  smtpFrom?: string | null;
  smtpFromName?: string | null;
}
