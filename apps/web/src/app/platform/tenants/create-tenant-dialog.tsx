"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

// Slugify: lowercase, spaces → `-`, strip anything not `[a-z0-9-]`
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const SLUG_REGEX = /^[a-z0-9-]+$/;

interface CreateTenantDialogProps {
  onCreated: () => void;
}

interface FormState {
  name: string;
  slug: string;
  adminUsername: string;
  adminFullName: string;
  adminPassword: string;
}

interface FormErrors {
  name?: string;
  slug?: string;
  adminUsername?: string;
  adminFullName?: string;
  adminPassword?: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  adminUsername: "",
  adminFullName: "",
  adminPassword: "",
};

export function CreateTenantDialog({ onCreated }: CreateTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  // Track whether the user has manually edited the slug so auto-suggest stops
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const create = trpc.tenant.create.useMutation({
    onSuccess: () => {
      toast.success("Tenant created successfully.");
      setOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      setSlugManuallyEdited(false);
      onCreated();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to create tenant.");
    },
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear the error for this field on change
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleNameChange(value: string) {
    setField("name", value);
    if (!slugManuallyEdited) {
      setField("slug", slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setField("slug", value);
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Tenant name is required.";
    if (!form.slug.trim()) {
      errs.slug = "Slug is required.";
    } else if (!SLUG_REGEX.test(form.slug)) {
      errs.slug = "Slug may only contain lowercase letters, digits, and hyphens.";
    }
    if (!form.adminUsername.trim()) {
      errs.adminUsername = "Admin username is required.";
    } else if (form.adminUsername.trim().length < 3) {
      errs.adminUsername = "Username must be at least 3 characters.";
    }
    if (!form.adminFullName.trim()) errs.adminFullName = "Full name is required.";
    if (!form.adminPassword) {
      errs.adminPassword = "Password is required.";
    } else if (form.adminPassword.length < 12) {
      errs.adminPassword = "Password must be at least 12 characters.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    create.mutate({
      name: form.name.trim(),
      slug: form.slug.trim(),
      admin: {
        username: form.adminUsername.trim(),
        fullName: form.adminFullName.trim(),
        password: form.adminPassword,
      },
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSlugManuallyEdited(false);
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">Create Tenant</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Tenant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Tenant name */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-name">Tenant name</Label>
            <Input
              id="ct-name"
              placeholder="e.g. Calapan City"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={create.isPending}
              aria-describedby={errors.name ? "ct-name-err" : undefined}
              className="h-9"
            />
            {errors.name && (
              <p id="ct-name-err" className="text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-slug">
              Slug{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (auto-suggested, editable)
              </span>
            </Label>
            <Input
              id="ct-slug"
              placeholder="e.g. calapan-city"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={create.isPending}
              aria-describedby={errors.slug ? "ct-slug-err" : undefined}
              className="h-9 font-mono"
            />
            {errors.slug && (
              <p id="ct-slug-err" className="text-xs text-destructive">
                {errors.slug}
              </p>
            )}
          </div>

          <hr className="border-border" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Initial admin account
          </p>

          {/* Admin username */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-username">Username</Label>
            <Input
              id="ct-username"
              placeholder="e.g. admin"
              value={form.adminUsername}
              onChange={(e) => setField("adminUsername", e.target.value)}
              disabled={create.isPending}
              aria-describedby={
                errors.adminUsername ? "ct-username-err" : undefined
              }
              className="h-9"
            />
            {errors.adminUsername && (
              <p id="ct-username-err" className="text-xs text-destructive">
                {errors.adminUsername}
              </p>
            )}
          </div>

          {/* Admin full name */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-fullname">Full name</Label>
            <Input
              id="ct-fullname"
              placeholder="e.g. Juan dela Cruz"
              value={form.adminFullName}
              onChange={(e) => setField("adminFullName", e.target.value)}
              disabled={create.isPending}
              aria-describedby={
                errors.adminFullName ? "ct-fullname-err" : undefined
              }
              className="h-9"
            />
            {errors.adminFullName && (
              <p id="ct-fullname-err" className="text-xs text-destructive">
                {errors.adminFullName}
              </p>
            )}
          </div>

          {/* Admin password */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-password">Password</Label>
            <Input
              id="ct-password"
              type="password"
              placeholder="Min. 12 characters"
              value={form.adminPassword}
              onChange={(e) => setField("adminPassword", e.target.value)}
              disabled={create.isPending}
              aria-describedby={
                errors.adminPassword ? "ct-password-err" : undefined
              }
              className="h-9"
            />
            {errors.adminPassword && (
              <p id="ct-password-err" className="text-xs text-destructive">
                {errors.adminPassword}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create Tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
