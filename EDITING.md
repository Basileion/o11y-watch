# Editing the Instant Cost Audit

The Observability Cost & Stack Audit (`/audit`) is a **fully client-side** wizard: survey → deterministic cost engine → free teaser → paid unlock for the full report. No FormSubmit, no human review queue.

## Files to edit

| File | Purpose |
|------|---------|
| `data/audit-form.json` | Multi-step survey questions (labels, options, CSV settings) |
| `data/audit-rates.json` | Structured unit rates extracted from `data/vendors.json` (never invent rates) |
| `scripts/build.mjs` | `AUDIT_CHECKOUT`, `AUDIT_PRICE`, `AUDIT_UNLOCK_TOKEN` constants |
| `assets/js/audit-engine.js` | Deterministic cost model |
| `assets/js/audit-wizard.js` | Wizard UI, gate, report, Print/PDF |
| `scripts/audit.inc.mjs` | Landing copy, FAQ, unlock/thanks pages |

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
const AUDIT_CHECKOUT = '#pending';           // Kit product URL when ready
const AUDIT_PRICE = 149;                     // USD, easy to change
const AUDIT_UNLOCK_TOKEN = 'owu-7f3a9c2e8b1d'; // unlisted unlock token
```

### Kit product setup

1. Create a Kit product priced at `AUDIT_PRICE`.
2. Set **AUDIT_CHECKOUT** to that product URL (replace `#pending`) and rebuild.
3. Set the Kit product **success / thank-you redirect** to:

```
https://o11y-watch.pages.dev/audit-unlock.html?t=owu-7f3a9c2e8b1d
```

(Use your live origin if different; token must match `AUDIT_UNLOCK_TOKEN`.)

### Gate limitation (honest)

This is a **static-site** unlock: unlisted URL + token → `localStorage` on that browser. It is **not** account auth. Anyone with the unlock link can open the full report. `noindex` + `robots.txt` Disallow reduce casual discovery; do **not** post the unlock URL publicly. Clearing site data removes unlock on that device.

## URLs

| Path | Indexed? | Role |
|------|----------|------|
| `/audit.html` | yes | Marketing + wizard + teaser / locked report |
| `/audit-unlock.html?t=…` | **no** | Purchase redirect; sets unlock |
| `/audit-thanks.html` | **no** | Optional mirror with activate link |

## What was removed

- FormSubmit intake to `basileion.ops@gmail.com`
- “Kurt reviews” / kickoff-call / early-bird $997 human-delivery copy
