/**
 * QR payload schema (v1) — encoded into the qrCode field on registration.
 *
 * Kept minimal and PII-free so future verification apps (or printed ID cards)
 * can scan the QR and resolve the fisherfolk by id within the tenant, without
 * leaking name/address/birthdate. Verification clients are expected to call
 * a tenant-scoped lookup endpoint with the decoded id.
 */

import QRCode from "qrcode";

export const QR_PAYLOAD_VERSION = 1 as const;

export interface QRPayloadInput {
  id: string;
  regNo: string;
  tenantId: string;
}

export interface QRPayload extends QRPayloadInput {
  v: typeof QR_PAYLOAD_VERSION;
}

export function buildQRPayload(input: QRPayloadInput): string {
  const payload: QRPayload = {
    v: QR_PAYLOAD_VERSION,
    id: input.id,
    regNo: input.regNo,
    tenantId: input.tenantId,
  };
  return JSON.stringify(payload);
}

export function parseQRPayload(raw: string): QRPayload | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "v" in parsed &&
      "id" in parsed &&
      "regNo" in parsed &&
      "tenantId" in parsed
    ) {
      return parsed as QRPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Render the QR payload to a PNG data URL — client-side use only.
 * Server has no need to render the image; only the payload string is stored.
 */
export async function renderQRDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
  });
}
