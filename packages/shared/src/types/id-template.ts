export interface IDTemplate {
  id: string;
  tenantId: string;
  name: string;
  templateData: Record<string, unknown>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDTemplateCreateInput {
  tenantId: string;
  name: string;
  templateData: Record<string, unknown>;
  isDefault?: boolean;
}

export interface IDTemplateUpdateInput {
  name?: string;
  templateData?: Record<string, unknown>;
  isDefault?: boolean;
}
