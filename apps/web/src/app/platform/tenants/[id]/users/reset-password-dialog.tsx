"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

interface ResetPasswordDialogProps {
  tenantId: string;
  userId: string;
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset?: () => void;
}

interface FormState {
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

const EMPTY_FORM: FormState = {
  newPassword: "",
  confirmPassword: "",
};

export function ResetPasswordDialog({
  tenantId,
  userId,
  username,
  open,
  onOpenChange,
  onReset,
}: ResetPasswordDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form whenever the dialog opens for a (possibly different) user
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [open, userId]);

  const resetPassword = trpc.tenantUser.resetPassword.useMutation({
    onSuccess: () => {
      toast.success(`Password for "${username}" has been reset.`);
      onOpenChange(false);
      onReset?.();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to reset password.");
    },
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.newPassword) {
      errs.newPassword = "New password is required.";
    } else if (form.newPassword.length < 12) {
      errs.newPassword = "Password must be at least 12 characters.";
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = "Please confirm the password.";
    } else if (form.newPassword !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    resetPassword.mutate({
      tenantId,
      userId,
      newPassword: form.newPassword,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password — {username}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-new-password">New password</Label>
            <Input
              id="rp-new-password"
              type="password"
              placeholder="Min. 12 characters"
              value={form.newPassword}
              onChange={(e) => setField("newPassword", e.target.value)}
              disabled={resetPassword.isPending}
              aria-describedby={
                errors.newPassword ? "rp-new-password-err" : undefined
              }
              className="h-9"
            />
            {errors.newPassword && (
              <p id="rp-new-password-err" className="text-xs text-destructive">
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-confirm-password">Confirm password</Label>
            <Input
              id="rp-confirm-password"
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => setField("confirmPassword", e.target.value)}
              disabled={resetPassword.isPending}
              aria-describedby={
                errors.confirmPassword ? "rp-confirm-password-err" : undefined
              }
              className="h-9"
            />
            {errors.confirmPassword && (
              <p
                id="rp-confirm-password-err"
                className="text-xs text-destructive"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {resetPassword.error && (
            <p className="text-xs text-destructive">
              {resetPassword.error.message ?? "An error occurred."}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={resetPassword.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? "Resetting…" : "Reset Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
