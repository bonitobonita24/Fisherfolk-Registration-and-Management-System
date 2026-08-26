# QA Learnings Ledger

## 2026-08-14T12:00:00Z — smoke-tester
FRMS repo has no `playwright`/`playwright-core` package in its pnpm workspace, so browser smoke tests cannot `require('playwright')` from the repo. Worked around by loading `playwright-core` from the Playwright MCP npx cache (`~/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core`) with an explicit `executablePath` to `~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`. Also: when credentials must never appear in tool transcripts, MCP browser tools are unusable for login (fill text is part of the tool call) — a standalone script reading the secret from an env var populated by `sops -d` at invocation is the reliable pattern.
**Suggested change:** references/smoke-tester.md — document the env-var-secret + standalone-script login pattern and the npx-cache playwright-core fallback for repos without a local Playwright install.
