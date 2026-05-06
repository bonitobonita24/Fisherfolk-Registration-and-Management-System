import { Worker, type Job } from "bullmq";
import { getConnection } from "../connection";
import { EMAIL_NOTIFICATION_DIGEST_QUEUE } from "../queues/email-notification-digest";
import type { EmailNotificationDigestPayload } from "../types";

async function processEmailDigest(job: Job<EmailNotificationDigestPayload>): Promise<void> {
  const { tenantId, userId, recipientEmail, pendingEditRequests } = job.data;

  if (tenantId === "" || userId === "") {
    throw new Error("tenantId and userId are required in job payload");
  }

  await job.updateProgress({ recipientEmail, pendingEditRequests, status: "sending" });

  // Implementation will be wired in Phase 7.
  // Worker composes a digest email with pending edit requests and summary items,
  // then sends via the configured SMTP transport.
  void recipientEmail;
}

let worker: Worker<EmailNotificationDigestPayload> | undefined;

export function startEmailNotificationDigestWorker(): Worker<EmailNotificationDigestPayload> {
  if (worker === undefined) {
    worker = new Worker<EmailNotificationDigestPayload>(EMAIL_NOTIFICATION_DIGEST_QUEUE, processEmailDigest, {
      connection: getConnection(),
      concurrency: 5,
    });
  }
  return worker;
}
