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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";

type Role = "admin" | "encoder" | "viewer" | "bantay_dagat";

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "encoder", label: "Encoder" },
  { value: "viewer", label: "Viewer" },
  { value: "bantay_dagat", label: "Bantay Dagat" },
];

interface CreateUserDialogProps {
  tenantId: string;
  onCreated: () => void;
}

interface FormState {
  name: string;
  username: string;
  role: Role | "";
  password: string;
}

interface FormErrors {
  name?: string;
  username?: string;
  role?: string;
  password?: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  username: "",
  role: "",
  password: "",
};

export function CreateUserDialog({ tenantId, onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const create = trpc.tenantUser.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully.");
      setOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      onCreated();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to create user.");
    },
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!form.username.trim()) {
      errs.username = "Username is required.";
    } else if (form.username.trim().length < 3) {
      errs.username = "Username must be at least 3 characters.";
    }
    if (!form.role) {
      errs.role = "Role is required.";
    }
    if (!form.password) {
      errs.password = "Password is required.";
    } else if (form.password.length < 12) {
      errs.password = "Password must be at least 12 characters.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    create.mutate({
      tenantId,
      name: form.name.trim(),
      username: form.username.trim(),
      role: form.role as Role,
      password: form.password,
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Create User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="cu-name">Full name</Label>
            <Input
              id="cu-name"
              placeholder="e.g. Juan dela Cruz"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              disabled={create.isPending}
              aria-describedby={errors.name ? "cu-name-err" : undefined}
            />
            {errors.name && (
              <p id="cu-name-err" className="text-xs text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="cu-username">Username</Label>
            <Input
              id="cu-username"
              placeholder="e.g. jdelacruz"
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              disabled={create.isPending}
              aria-describedby={errors.username ? "cu-username-err" : undefined}
            />
            {errors.username && (
              <p id="cu-username-err" className="text-xs text-destructive">
                {errors.username}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="cu-role">Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setField("role", v as Role)}
              disabled={create.isPending}
            >
              <SelectTrigger
                id="cu-role"
                aria-describedby={errors.role ? "cu-role-err" : undefined}
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p id="cu-role-err" className="text-xs text-destructive">
                {errors.role}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="cu-password">Password</Label>
            <Input
              id="cu-password"
              type="password"
              placeholder="Min. 12 characters"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              disabled={create.isPending}
              aria-describedby={errors.password ? "cu-password-err" : undefined}
            />
            {errors.password && (
              <p id="cu-password-err" className="text-xs text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          {create.error && (
            <p className="text-xs text-destructive">
              {create.error.message ?? "An error occurred."}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
