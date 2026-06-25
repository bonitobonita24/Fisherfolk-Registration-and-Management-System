/**
 * sms.ts — PREPARED-but-inactive SMS channel (PD-003).
 *
 * SMS_ENABLED defaults to false. To activate a real provider, set
 * SMS_ENABLED=true in the environment and replace noopSmsSender with a real
 * implementation that satisfies the SmsSender interface.
 */

export interface SmsSender {
  send(to: string, message: string): Promise<void>;
}

/** No-operation sender — logs intent and returns immediately. */
export const noopSmsSender: SmsSender = {
  send(to: string, message: string): Promise<void> {
    console.log(`[sms] (inactive) would send to ${to}: ${message}`);
    return Promise.resolve();
  },
};

/** Set to true via SMS_ENABLED=true env var to activate a real sender. */
export const SMS_ENABLED: boolean =
  process.env.SMS_ENABLED === "true";

/** Active sender — swap noopSmsSender for a real implementation when SMS_ENABLED. */
const activeSender: SmsSender = noopSmsSender;

/**
 * Send an SMS. Early-returns when SMS_ENABLED is false (no-op).
 * Never throws to the caller.
 */
export async function sendSms(to: string, message: string): Promise<void> {
  if (!SMS_ENABLED) {
    return;
  }
  try {
    await activeSender.send(to, message);
  } catch (err) {
    console.error("[sms] sendSms failed:", err);
  }
}
