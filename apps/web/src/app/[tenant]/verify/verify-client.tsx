"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Search } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";

// FIS-13 — manual paste/entry only. No QR camera-scan library is present in
// this repo (package.json has no jsQR/zxing/etc.) and Rule 12/constraint
// forbids adding a new heavy dependency for this task — staff scan the QR
// with any phone/scanner app that copies the payload to clipboard, or type
// the fisherfolk id directly, and paste it here.
type VerifyResult =
  | { valid: true; fisherfolk: {
      id: string;
      fullName: string;
      status: string;
      registrationYear: number;
      barangay: string;
      photoKey: string | null;
    } }
  | { valid: false };

export function VerifyClient() {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [checking, setChecking] = useState(false);
  const utils = trpc.useUtils();
  const tenantHref = useTenantHref();

  async function handleVerify() {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setChecking(true);
    try {
      const data = await utils.fisherfolk.verifyByQr.fetch({ raw: trimmed });
      setResult(data);
    } catch {
      setResult({ valid: false });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <label
            htmlFor="verify-qr-input"
            className="text-sm font-medium text-foreground"
          >
            Scanned QR value or fisherfolk ID
          </label>
          <Textarea
            id="verify-qr-input"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setResult(null);
            }}
            placeholder='Paste the scanned QR payload (e.g. {"v":1,"id":"...","regNo":"...","tenantId":"..."}) or type a fisherfolk ID'
            rows={4}
            className="font-mono text-xs"
          />
          <Button
            type="button"
            onClick={() => void handleVerify()}
            disabled={checking || raw.trim().length === 0}
          >
            <Search className="mr-1.5 size-4" aria-hidden="true" />
            {checking ? "Verifying…" : "Verify"}
          </Button>
        </CardContent>
      </Card>

      {result?.valid === true && (
        <Card className="border-emerald-200 dark:border-emerald-900">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-5" aria-hidden="true" />
              <span className="font-semibold">Valid registered fisherfolk</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="col-span-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">
                  <Link
                    href={tenantHref(`/fisherfolk/${result.fisherfolk.id}`)}
                    className="underline-offset-2 hover:underline"
                  >
                    {result.fisherfolk.fullName}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={result.fisherfolk.status} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Registration year</dt>
                <dd className="font-medium">{result.fisherfolk.registrationYear}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Barangay</dt>
                <dd className="font-medium">{result.fisherfolk.barangay}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {result?.valid === false && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="flex items-center gap-2 pt-6 text-red-700 dark:text-red-400">
            <XCircle className="size-5" aria-hidden="true" />
            <span className="font-semibold">Not found / invalid</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
