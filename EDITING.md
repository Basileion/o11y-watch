# Editing the Instant Cost Audit

The Observability Cost & Stack Audit (`/audit`) is a **fully client-side** wizard: survey → deterministic cost engine → free teaser → paid unlock for the full report. No FormSubmit, no human review queue.

## Files to edit

| File | Purpose |
|------|---------|
| `data/audit-form.json` | Multi-step survey questions (labels, options, CSV settings) |
| `data/audit-rates.json` | Structured unit rates extracted from `data/vendors.json` (never invent rates) |
| `scripts/build.mjs` | `AUDIT_CHECKOUT`, `AUDIT_PRICE`, `AUDIT_UNLOCK_TOKEN`, `AUDIT_UNLOCK_API` |
| `assets/js/audit-engine.js` | Deterministic cost model |
| `assets/js/audit-wizard.js` | Wizard UI, gate, report, Print/PDF |
| `scripts/audit.inc.mjs` | Landing copy, FAQ, unlock/thanks pages |
| `/workspace/growth/tracker/worker/worker.js` | growth-ingest: events + `audit_unlock` / `audit_unlock_check` |

Landing hero / FAQ / price cards: edit `scripts/audit.inc.mjs`.

## Quick edit loop

```bash
# 1. Edit survey fields or rates
$EDITOR data/audit-form.json
# or
$EDITOR data/audit-rates.json

# 2. Rebuild
npm run build

# 3. Sanity-check sample profiles (optional)
node scripts/audit-samples.mjs

# 4. Commit + push (Cloudflare Pages deploys on push to main)
git add -A && git commit -m "Update audit wizard" && git push origin main
```

## Survey schema (`data/audit-form.json`)

- `mode`: always `client-wizard`
- `steps[]`: ordered wizard steps with `id`, `title`, `description`, `fields[]`
- Field types: `text`, `number`, `select`, `textarea`, `checkbox-group`, `file`
- Select / checkbox options are `{ "value", "label" }` objects
- Optional CSV: `csv.enabled` — parsed **only in the browser**, never uploaded

## Rates schema (`data/audit-rates.json`)

- Every rate must come from `vendors.json` `paid_from` / `pricing_model` / `free_tier` / `oss_self_host`
- Use `null` when the dataset does not state a unit price for that dimension
- The engine **must** surface gaps instead of inventing numbers
- `dataset_checked` should match the vendors check date

## Monetization constants (`scripts/build.mjs`)

```js
const AUDIT_CHECKOUT = 'https://o11y-watch.kit.com/products/observability-cost-stack-audit-instant';
const AUDIT_PRICE = 149;
const AUDIT_UNLOCK_TOKEN = 'owu-…'; // unguessable; rotate if leaked
const AUDIT_UNLOCK_API = 'https://growth-ingest.basileion-ops.workers.dev';
```

### Kit product setup

1. Create a Kit product priced at `AUDIT_PRICE`.
2. Set **AUDIT_CHECKOUT** to that product URL and rebuild.
3. Set the Kit product **success / thank-you redirect** to:

```
https://o11y-watch.pages.dev/audit-unlock.html?t=<AUDIT_UNLOCK_TOKEN>
```

(Use your live origin if different; token must match `AUDIT_UNLOCK_TOKEN` **and** the Worker secret `AUDIT_UNLOCK_TOKEN`.)

4. After rotating the token, also update the Worker secret:

```bash
cd /workspace/growth/tracker/worker
npx wrangler secret put AUDIT_UNLOCK_TOKEN   # paste same token
npx wrangler deploy
```

### Gate design (honest)

**What we protect ($0, static + free Worker):**

1. Pre-purchase `/audit` never injects the full report into the DOM (no blurred “locked preview”). Teaser + paywall only.
2. `unlockToken` / unlock URL are **not** embedded in **any** built HTML (`/audit`, `/audit-unlock`, `/audit-thanks`). Unlock is Worker-only.
3. Kit thank-you hits `/audit-unlock.html?t=…`; the page POSTs the token to growth-ingest; Worker compares to secret env and returns an HMAC proof stored in `localStorage`. After success, `?t=` is stripped and the page auto-navigates to `/audit.html#results` (~1s).
4. Showing the full report re-checks the proof with the Worker when possible (`audit_unlock_check`).

**What a static/client engine cannot protect:**

- The cost engine + `audit-rates.json` are public. A determined buyer-or-not can run `O11yAudit.runAudit` themselves and rebuild a report.
- `localStorage` is user-controlled; without the Worker check a forged proof could pass a naive client gate — that is why we verify proofs server-side.
- Anyone who receives the Kit unlock URL (or guesses the rotated token — impractical) can unlock on their browser. This is **not** account auth. `noindex` + `robots.txt` Disallow reduce casual discovery; do **not** post the unlock URL publicly.

## URLs

| Path | Indexed? | Role |
|------|----------|------|
| `/audit.html` | yes | Marketing + wizard + teaser / locked report |
| `/audit-unlock.html?t=…` | **no** | Purchase redirect; Worker-validated unlock |
| `/audit-thanks.html` | **no** | Optional mirror; redeems `?t=` via Worker only (no embedded token) |

## What was removed

- FormSubmit intake to `basileion.ops@gmail.com`
- “Kurt reviews” / kickoff-call / early-bird $997 human-delivery copy
- Blurred pre-purchase full-report DOM (`locked-preview`) and print-CSS unblur
