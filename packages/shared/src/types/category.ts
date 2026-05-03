export interface Category {
  id: string;
  tenantId: string;
  type: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface CategoryCreateInput {
  tenantId: string;
  type: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CategoryUpdateInput {
  type?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}
