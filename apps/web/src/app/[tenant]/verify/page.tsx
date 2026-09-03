import { VerifyClient } from "./verify-client";

// FIS-13 — authed QR verify page. Staff paste/type a scanned QR payload (or
// a bare fisherfolk id) and get back a safe verification summary. Protected
// by [tenant]/layout.tsx's session guard like every other tenant page — no
// route-level auth needed here.
export default function VerifyPage() {
  return (
    <div className="space-y-6">
      <div className="shrink-0 pt-4 pb-4">
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
          Verify ID
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Scan or paste a fisherfolk ID QR code to confirm it is a valid,
          registered record.
        </p>
      </div>
      <VerifyClient />
    </div>
  );
}
