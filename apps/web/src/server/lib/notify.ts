/**
 * notify.ts — unified notification dispatch (in-app + email + SMS).
 *
 * All channels are best-effort and non-blocking.
 * A failure in email or SMS must NEVER prevent in-app rows or throw to caller.
 */

import type { ExtendedPrismaClient, NotificationType } from "@frms/db";

import { sendTenantEmail } from "./mailer";
import { sendSms } from "./sms";

/**
 * Escape HTML special chars before interpolating user-controlled text (fisherfolk
 * names, rejection reasons, etc.) into an email HTML body — prevents stored XSS in
 * the recipient's email client.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface NotifyUsersInput {
  tenantId: string;
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  /** When true, also send an email to each user's email address. */
  email?: boolean;
}

/**
 * Bulk-creates in-app Notification rows, then fires email + SMS channels
 * best-effort for each user.
 */
export async function notifyUsers(
  db: ExtendedPrismaClient,
  input: NotifyUsersInput,
): Promise<void> {
  const { tenantId, userIds, type, title, message, entityType, entityId } = input;
  const sendEmail = input.email === true;

  if (userIds.length === 0) return;

  // ── 1. In-app notifications (single bulk insert) ──────────────────────────
  try {
    await db.notification.createMany({
      data: userIds.map((userId) => ({
        tenantId,
        userId,
        type,
        title,
        message,
        ...(entityType !== undefined ? { entityType } : {}),
        ...(entityId !== undefined ? { entityId } : {}),
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error("[notify] createMany failed:", err);
    // Still attempt other channels even if in-app write failed.
  }

  // ── 2. Email + SMS (best-effort per user) ────────────────────────────────
  if (!sendEmail) return;

  let users: Array<{ id: string; email: string }> = [];
  try {
    users = await db.user.findMany({
      where: { id: { in: userIds }, tenantId },
      select: { id: true, email: true },
    });
  } catch (err) {
    console.error("[notify] user lookup failed:", err);
    return;
  }

  await Promise.allSettled(
    users.map(async (user) => {
      if (sendEmail) {
        await sendTenantEmail(db, tenantId, {
          to: user.email,
          subject: title,
          text: message,
          html: `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
        });
      }
      // SMS always goes through (no-op while disabled).
      await sendSms(user.email, message);
    }),
  );
}

/**
 * Returns user IDs with role super_admin or admin for the given tenant.
 * Used to target admin recipients without the caller needing to query users.
 */
export async function getTenantAdminUserIds(
  db: ExtendedPrismaClient,
  tenantId: string,
): Promise<string[]> {
  const admins = await db.user.findMany({
    where: {
      tenantId,
      role: { in: ["super_admin", "admin"] },
      status: "ACTIVE",
    },
    select: { id: true },
  });
  return admins.map((u) => u.id);
}
