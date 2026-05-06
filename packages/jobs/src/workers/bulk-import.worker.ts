import { Worker, type Job } from "bullmq";
import { getConnection } from "../connection";
import { BULK_IMPORT_QUEUE } from "../queues/bulk-import";
import type { BulkImportPayload } from "../types";

async function processBulkImport(job: Job<BulkImportPayload>): Promise<void> {
  const { tenantId, userId, fileKey, entityType, resumeFromRow } = job.data;

  if (tenantId === "" || userId === "") {
    throw new Error("tenantId and userId are required in job payload");
  }

  const startRow = resumeFromRow ?? 0;

  await job.updateProgress({ startRow, fileKey, entityType, status: "processing" });

  // Implementation will be wired in Phase 7 when the import service is built.
  // Worker reads CSV from storage (tenant-scoped path), validates each row,
  // writes to DB in batches, and updates progress for resumability.
  void startRow;
}

let worker: Worker<BulkImportPayload> | undefined;

export function startBulkImportWorker(): Worker<BulkImportPayload> {
  if (worker === undefined) {
    worker = new Worker<BulkImportPayload>(BULK_IMPORT_QUEUE, processBulkImport, {
      connection: getConnection(),
      concurrency: 1,
      limiter: {
        max: 1,
        duration: 1000,
      },
    });
  }
  return worker;
}
