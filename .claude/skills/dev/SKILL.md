---
name: dev
description: Start the Vite dev server for apay-config-poc. Use when asked to run the app, start dev, or launch the local server.
allowed-tools: Bash
---

Start the Vite development server for apay-config-poc.

## Context

This is a multi-page Vite + TypeScript app with two entry points:
- `/` → payment skeleton (reads `apay-preview-config` from localStorage)
- `/admin` → admin CRM

The dev server is typically available at `http://localhost:5173`.
The admin panel is at `http://localhost:5173/admin`.

## Steps

Run:

```bash
npm run dev
```

from `/Users/keithhcurbelo/dev_root/sandbox/apay-config-poc`.

If the server fails to start, check for TypeScript errors first with `npx tsc --noEmit` and report any issues.

Remind the user:
- Admin CRM → `http://localhost:5173/admin`
- Payment skeleton → `http://localhost:5173`
- The admin writes config previews to `localStorage` — the payment app picks them up on reload via the `apay-preview-config` key.
