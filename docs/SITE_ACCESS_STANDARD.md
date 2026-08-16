# Site Access & Tenancy Bootstrap Standard

> **Status:** LOCKED 2026-08-16 (owner-approved). Source spec: owner's `NEW SITE CREDENTIALS.pdf`.
> **Scope:** Fleet-wide standard for every Powerbyte tenant-based app. FRMS is the reference implementation.
> **Authority:** This is the [WHAT] contract for per-environment tenancy topology + access routing. It
> complements the fleet RBAC backbone (`~/.claude/library/tenant-rbac-standard.md`, framework Rule 34 /
> `.ai_prompt/rbac.md`) — where those define role tiers/DDL, they remain the executable authority; this
> doc defines the **site-access topology, URL scheme, and platform-tier RBAC** on top of them.
> **HARD HOLD:** local commits only; no staging/prod/demo deploy or live re-seed without explicit owner word.
> **Secrets:** passwords live ONLY in the SOPS+age vault
> (`Server-Setups/secrets/universal-login-credentials.enc.yaml`). This doc names accounts + URLs, never passwords.

## 1 — The 3-layer model (identical shape in every real environment)

Every real deployment environment (Local Dev, Staging, Production) has the same internal shape:

```
/tm                        Tenant Management Site  — the SaaS platform/server owner (Powerbyte)
   ├─ ADMIN    tenant_manager   ← default platform role
   ├─ BILLING  tenant_billing   ← curated permission set
   └─ TECH     tenant_tech      ← curated permission set

/{client-slug}             Client Tenant — the subscriber's own space
   ├─ tenant_superadmin  → post-login landing /{slug}/admin   (client's TOP access; owner/subscriber)
   ├─ tenant_admin       → post-login landing /{slug}/admin   (the real day-to-day administrator)
   ├─ (app-design RBAC roles below tenant_admin)
   └─ regular users      → login + landing  /{slug}/login

/demo (optional)          Demo Tenant — see §4; only when the 1st tenant is Powerbyte's own
```

**Roles reference:** `tenant_manager` (platform, `tenant_id = NULL`) > `tenant_superadmin` (one per tenant,
the client's top access) > `tenant_admin` (day-to-day, no billing/user-mgmt) > app domain roles. Unchanged
from the fleet RBAC backbone — this standard ADDS the two platform-tier curated roles below.

## 2 — Tenant Management Site (`/tm`) — the platform owner

The SaaS operator (Powerbyte). Manages all tenants, billing (if applicable), and data overrides. Reached at
`<domain>.com/tm`. Has its **own internal RBAC** (first/default role = ADMIN; can create more roles/permission
sets):

| Role | Label | Account (username) | Password |
|---|---|---|---|
| `tenant_manager` | ADMIN (default) | `tenantadmin@powerbyteitsolutions.com` | → vault |
| `tenant_billing` | BILLING | `tenantbilling@powerbyteitsolutions.com` | → vault (NEW) |
| `tenant_tech` | TECH SUPPORT | `tenanttech@powerbyteitsolutions.com` | → vault (NEW) |

- **BILLING** permission set — subscription/billing management + tenant billing overrides; no destructive tech ops.
- **TECH SUPPORT** permission set — data overrides / technical support ops; no billing.
- These three platform accounts are the SAME across all real environments (Local Dev, Staging, Production).

## 3 — Client Tenant (`/{client-slug}`)

The subscriber's space. `tenant_superadmin` is the client's topmost access (owner/subscriber: subscription
billing + account management + creates the ONE real admin account + full app access + role creator). Standard
app-design RBAC applies below.

**URL scheme (post-login landing; ONE login form, role-routed):**
- Admin-tier (`tenant_superadmin`, `tenant_admin`) → `/{slug}/admin`
- Regular users (any app role) → `/{slug}/login`

**Per-environment accounts (usernames; passwords → vault):**

| Env | tenant_superadmin | tenant_admin |
|---|---|---|
| Local Dev | `webmaster@localhost.com` | `admin@admin.com` |
| Staging / Production | `webmaster@powerbyteitsolutions.com` | `admin@admin.com` |

## 4 — Demo Tenant (separate deployment)

Demo is a **separate deployment/stack** (NOT a tenant merged into prod), always reached via a **subdomain**:
- `demo.<domain>.com/admin`  OR  `{app_name}-demo.powerbyte.app/admin` (temporary domain)

Because demo is always a client-facing single-tenant subdomain, it has **NO `/tm` platform layer** — there is
no Tenant Manager on the demo site. Accounts:

| Role | Username | Password |
|---|---|---|
| `tenant_superadmin` | `superadmin@demo.com` | → vault (demo cred) |
| `tenant_admin` | `admin@admin.com` | → vault (demo cred) |

Rule: if the 1st client tenant is Powerbyte's OWN app, a separate Demo Tenant is created; otherwise the 1st
tenant IS the demo.

## 5 — URL summary

| Surface | URL |
|---|---|
| Platform management | `<domain>.com/tm` (real envs only) |
| Client tenant — admin-tier landing | `/{client-slug}/admin` |
| Client tenant — regular user login/landing | `/{client-slug}/login` |
| Demo | `demo.<domain>.com/admin` or `{app}-demo.powerbyte.app/admin` |

## 6 — Delta from current FRMS implementation (rehab scope)

| Aspect | Current | Target |
|---|---|---|
| Management slug | `platform` (`/platform/*`) | **`tm`** (`/tm/*`) |
| Platform roles | `tenant_manager` only | + **`tenant_billing`** + **`tenant_tech`** (with permission sets) |
| Per-tenant login | global `/admin`, land `/{slug}/dashboard` | admin-tier → `/{slug}/admin`; regular → `/{slug}/login` |
| Demo accounts | `admin@demo.com` + `demo-super@calapan-demo.local` | `superadmin@demo.com` + `admin@admin.com` |

## 7 — Rollout (HARD HOLD; owner-gated per phase)

- **Phase 0 — Author standard (global):** update `~/.claude/library/tenant-rbac-standard.md` +
  framework `.ai_prompt/rbac.md`; add the three platform accounts + demo rename to the SOPS vault.
- **Phase 1 — FRMS reference implementation (this repo):** enum + platform RBAC, `platform`→`tm` rename,
  role-based routing, seed — LOCAL commits only.
- **Phase 2 — Broadcast:** tailored adoption notes into each tenant app's own memory (never edit their repos here).
- **Phase 3 — Deploy:** roll FRMS dev→staging→prod→demo on explicit owner word (live re-seeds are owner-gated).
