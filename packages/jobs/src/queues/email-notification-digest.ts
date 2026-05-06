import { Queue } from "bullmq";
import { getConnection } from "../connection";
import type { EmailNotificationDigestPayload } from "../types";

export const EMAIL_NOTIFICATION_DIGEST_QUEUE = "email-notification-digest" as const;

let queue: Queue<EmailNotificationDigestPayload> | undefined;

export function getEmailNotificationDigestQueue(): Queue<EmailNotificationDigestPayload> {
  if (queue === undefined) {
    queue = new Queue<EmailNotificationDigestPayload>(EMAIL_NOTIFICATION_DIGEST_QUEUE, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { count: 200 },
        removeOnFail: false,
      },
    });
  }
  return queue;
}
