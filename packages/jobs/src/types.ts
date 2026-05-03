export interface BaseJobPayload {
  tenantId: string;
  userId: string;
}

export interface BulkImportPayload extends BaseJobPayload {
  fileKey: string;
  entityType: "fisherfolk" | "vessel" | "gear";
  resumeFromRow?: number | undefined;
  totalRows?: number | undefined;
}

export interface YearlyStatusResetPayload extends BaseJobPayload {
  targetYear: number;
  dryRun?: boolean | undefined;
}

export interface EmailNotificationDigestPayload extends BaseJobPayload {
  recipientEmail: string;
  recipientName: string;
  pendingEditRequests: number;
  pendingSummaryItems: ReadonlyArray<{
    entityType: string;
    entityName: string;
    requestedAt: string;
  }>;
}
