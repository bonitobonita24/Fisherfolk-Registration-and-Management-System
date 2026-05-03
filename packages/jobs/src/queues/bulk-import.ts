import { Queue } from "bullmq";
import { getConnection } from "../connection.js";
import type { BulkImportPayload } from "../types.js";

export const BULK_IMPORT_QUEUE = "bulk-import" as const;

let queue: Queue<BulkImportPayload> | undefined;

export function getBulkImportQueue(): Queue<BulkImportPayload> {
  if (queue === undefined) {
    queue = new Queue<BulkImportPayload>(BULK_IMPORT_QUEUE, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: false,
      },
    });
  }
  return queue;
}
