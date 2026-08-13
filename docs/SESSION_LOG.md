# FRMS — Session Log

Human-readable per-session accomplishment ledger (newest on top). The dense reload
handoff lives in `docs/STATE.md`; open owner decisions in `PENDING_DECISIONS.md`.

## 2026-08-14 — Public landing page + login moved to /admin

**In your words:** resume/merge the held branches, then build an awesome, stunning public landing page
promoting the app's features (using the shadcnstudio "Craft" template as the basis), move the staff login
off the front page to a manually-typed `/admin`, and credit Blue Alliance + Powerbyte in the footer.

✅ **Done**
- Merged the 3 held branches into `main` (2 CGC refactors + Traefik fix), **local only** — verified green (tsc + 59 tests).
- Built the public landing page at `/`: animated coastal-wave hero, live-counting stats, 8-module feature grid, tabbed screenshot gallery (your existing app screenshots), how-it-works, and a footer crediting **Blue Alliance** (logo from Marine-Guardian) + **Powerbyte IT Solutions**. Light + dark, full SEO.
- Moved staff sign-in to **`/admin`** (not shown on the public page); `/login` still works (redirects to `/admin`); the app stays behind auth exactly as before.
- Verified it live in your real dev container — **open `localhost:44387`** to click through it. Passed the full production build gate.

🔨 **Partial / parked**
- All of it sits on branch `feat/public-landing-page` (commit `6268bc5`), **local only** — you said leave it on the branch.

⏳ **Next / your call**
- Merge + push the landing branch, and/or push `main` (12 commits ahead, held). Both are owner-gated.
- Optional: make the public landing default to **light** (it currently opens dark, matching the app). Copy/section tweaks (testimonials, contact block, different screenshots).

💬 **Notes**
- The landing's sections fade in as you scroll — that's intentional; the first screen (hero) shows instantly.
- Login is used by *all* staff roles, not just the tenant manager — so `/admin` is the entry for everyone; `/login` bookmarks keep working via redirect.
