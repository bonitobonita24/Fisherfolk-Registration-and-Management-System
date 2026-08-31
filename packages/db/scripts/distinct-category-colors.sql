-- Assign a distinct, accessible display_color per category.
--
-- Why: every category row in `categories` currently carries the SAME
-- display_color ('#4F8EF7'), because the seed scripts hardcode that one hex
-- for every default category (packages/db/prisma/seed.ts, apps/web/scripts/
-- seed-demo-calapan.ts, seed-demo-calapan-extras.ts, align-demo-categories.ts).
-- Chip UIs already read displayColor per-row, so this is a pure DATA fix — no
-- code change needed to see distinct colors once this runs.
--
-- What it does: cycles a 10-color, visually-distinct palette across each
-- tenant's categories ordered by display_order (ties broken by id), and
-- assigns palette[(row_number - 1) % 10] to every row that still has the
-- default/blank color. An admin's custom color choice (anything other than
-- '#4F8EF7' or NULL) is left untouched.
--
-- Safe + idempotent: re-running reproduces the same deterministic mapping
-- (same ORDER BY -> same row_number -> same palette slot), so it can be
-- re-run after adding new categories without disturbing prior assignments to
-- rows that already left the default color behind. Only touches
-- `categories.display_color`; no other table.

WITH palette(idx, hex) AS (
  VALUES
    (0, '#4F8EF7'),  -- blue
    (1, '#22C55E'),  -- green
    (2, '#F97316'),  -- orange
    (3, '#A855F7'),  -- purple
    (4, '#EC4899'),  -- pink
    (5, '#14B8A6'),  -- teal
    (6, '#EAB308'),  -- amber
    (7, '#EF4444'),  -- red
    (8, '#6366F1'),  -- indigo
    (9, '#06B6D4')   -- cyan
),
ranked AS (
  SELECT
    c.id,
    (ROW_NUMBER() OVER (
      PARTITION BY c.tenant_id
      ORDER BY c.display_order ASC, c.id ASC
    ) - 1) % 10 AS palette_idx
  FROM categories c
  WHERE c.display_color IS NULL OR c.display_color = '#4F8EF7'
)
UPDATE categories c
SET display_color = p.hex
FROM ranked r
JOIN palette p ON p.idx = r.palette_idx
WHERE c.id = r.id
  AND c.display_color IS DISTINCT FROM p.hex;
