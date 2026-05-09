# vanish.mail

Disposable email inboxes with instant OTP extraction.

## Features

- Generate a working throwaway email address in one click
- Poll inbox automatically for new messages
- Open, delete, and manage multiple inboxes locally
- Detect and highlight verification codes from incoming emails
- Copy OTP and email address quickly
- Liquid-glass UI with light/dark mode

## Tech Stack

- TanStack Start + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui primitives
- Mail.tm API for disposable mailbox infrastructure
- Cloudflare Vite plugin for worker-oriented production builds

## Local Development

Requirements:

- Node.js 22+
- npm

Install and run:

```bash
npm install
npm run dev
```

Default local app URL:

- `http://localhost:3000` (or Vite-assigned port)

## Production Build

```bash
npm run build
```

This generates build output under `dist/`.

## Project Structure

- `src/components/temp-mail-app.tsx` — main UI and inbox interactions
- `src/lib/mailtm.ts` — Mail.tm API client + OTP extraction
- `src/lib/inbox-store.ts` — localStorage-backed inbox persistence
- `src/routes/` — TanStack route files and document metadata
- `public/favicon.svg` — app favicon

## Notes

- Inboxes are persisted in browser localStorage.
- This project uses Mail.tm domains and API limits/availability apply.
- For production hosting, verify CORS/network policies for Mail.tm access.
