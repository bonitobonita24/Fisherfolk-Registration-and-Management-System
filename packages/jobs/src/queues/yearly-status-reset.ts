import { Queue } from "bullmq";
import { getConnection } from "../connection.js";
import type { YearlyStatusResetPayload } from "../types.js";

export const YEARLY_STATUS_RESET_QUEUE = "yearly-status-reset" as const;

let queue: Queue<YearlyStatusResetPayload> | undefined;

export function getYearlyStatusResetQueue(): Queue<YearlyStatusResetPayload> {
  if (queue === undefined) {
    queue = new Queue<YearlyStatusResetPayload>(YEARLY_STATUS_RESET_QUEUE, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 10000,
        },
        removeOnComplete: { count: 50 },
        removeOnFail: false,
      },
    });
  }
  return queue;
}
