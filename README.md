# The Start Up — Inbound Funnel App

A Next.js app that runs the whole no-call funnel and writes straight into your Monday.com boards.

**Pages**
- `/` — the offer page (pricing, VSL slot, async start)
- `/calculator` — Lead Leakage Calculator + AI Bottleneck Report
- `/scope-lock` — the Scope Lock intake form

**API routes (serverless, secrets stay server-side)**
- `POST /api/lead` — writes a calculator lead to the **Inbound Leads** board
- `POST /api/report` — generates the Bottleneck Report via Claude (Sonnet 4.6)
- `POST /api/scope-lock` — writes a submission to the **Scope Locks** board

## Already wired to your live Monday boards
- Inbound Leads board: `18419074343`
- Scope Locks board: `18419074490`

Column IDs are baked into `lib/monday.ts`. No setup needed there.

## Deploy in ~5 minutes

1. **Get your tokens**
   - Anthropic API key: https://console.anthropic.com
   - Monday API token: monday.com → your avatar → **Developers → My Access Tokens**

2. **Push & import** (easiest)
   ```bash
   npm install
   git init && git add . && git commit -m "the start up app"
   # push to a new GitHub repo, then on vercel.com: Add New > Project > import it
   ```
   Or deploy straight from your machine with the CLI:
   ```bash
   npm i -g vercel
   vercel            # link to the "drys-crs' projects" team
   vercel --prod
   ```

3. **Set environment variables** in Vercel (Project → Settings → Environment Variables):
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   MONDAY_API_TOKEN  = ...
   ```
   (Board IDs are pre-filled; override with `MONDAY_LEADS_BOARD_ID` / `MONDAY_SCOPE_BOARD_ID` only if needed.)

4. **Done.** Visit your domain. Run the calculator and a row appears on the Inbound Leads board; submit a Scope Lock and it lands on the Scope Locks board.

## Local dev
```bash
npm install
cp .env.example .env.local   # fill in the two tokens
npm run dev                  # http://localhost:3000
```

## Two Monday automations to add (no code)
On the **Inbound Leads** board:
- When *Stage* becomes **New Lead** → notify you.
- When *Est. Annual Leak* is greater than a threshold → mark high priority.
