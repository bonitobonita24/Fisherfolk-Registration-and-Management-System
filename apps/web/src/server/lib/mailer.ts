/**
 * mailer.ts — tenant-scoped email delivery (best-effort, never throws to caller).
 *
 * Loads SMTP credentials from the Tenant row at send time.
 * If smtpHost or smtpFrom are absent → silent NO-OP (email is optional per-tenant).
 */

import nodemailer from "nodemailer";

import type { ExtendedPrismaClient } from "@frms/db";

export interface TenantEmailPayload {
  to: string;
  subject: string;
  /** Provide html OR text (or both). */
  html?: string;
  text?: string;
}

/**
 * Send an email on behalf of a tenant using its configured SMTP settings.
 * Returns silently if SMTP is not configured or if sending fails.
 */
export async function sendTenantEmail(
  db: ExtendedPrismaClient,
  tenantId: string,
  payload: TenantEmailPayload,
): Promise<void> {
  try {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassword: true,
        smtpFrom: true,
      },
    });

    // Silent NO-OP when SMTP is not configured.
    if (!tenant?.smtpHost || !tenant.smtpFrom) {
      return;
    }

    const transporter = nodemailer.createTransport({
      host: tenant.smtpHost,
      port: tenant.smtpPort ?? 587,
      secure: (tenant.smtpPort ?? 587) === 465,
      auth:
        tenant.smtpUser && tenant.smtpPassword
          ? { user: tenant.smtpUser, pass: tenant.smtpPassword }
          : undefined,
    });

    await transporter.sendMail({
      from: tenant.smtpFrom,
      to: payload.to,
      subject: payload.subject,
      ...(payload.html !== undefined ? { html: payload.html } : {}),
      ...(payload.text !== undefined ? { text: payload.text } : {}),
    });
  } catch (err) {
    console.error("[mailer] sendTenantEmail failed:", err);
  }
}
