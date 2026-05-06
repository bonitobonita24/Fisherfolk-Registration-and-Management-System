import { Worker, type Job } from "bullmq";
import { getConnection } from "../connection";
import { YEARLY_STATUS_RESET_QUEUE } from "../queues/yearly-status-reset";
import type { YearlyStatusResetPayload } from "../types";

async function processYearlyStatusReset(job: Job<YearlyStatusResetPayload>): Promise<void> {
  const { tenantId, userId, targetYear, dryRun } = job.data;

  if (tenantId === "" || userId === "") {
    throw new Error("tenantId and userId are required in job payload");
  }

  await job.updateProgress({ targetYear, dryRun: dryRun ?? false, status: "processing" });

  // Implementation will be wired in Phase 7.
  // Worker iterates over all fisherfolk with status Active/Renewed for the tenant,
  // sets status to Inactive for the target year, and logs each change to AuditLog.
  void targetYear;
}

let worker: Worker<YearlyStatusResetPayload> | undefined;

export function startYearlyStatusResetWorker(): Worker<YearlyStatusResetPayload> {
  if (worker === undefined) {
    worker = new Worker<YearlyStatusResetPayload>(YEARLY_STATUS_RESET_QUEUE, processYearlyStatusReset, {
      connection: getConnection(),
      concurrency: 1,
    });
  }
  return worker;
}
