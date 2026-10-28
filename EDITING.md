# Editing the Cost Audit intake form

The Observability Cost & Stack Audit page (`/audit`) and its form are generated at build time from one config file:

**`data/audit-form.json`**

Change that file, rebuild, commit, and push. Cloudflare Pages deploys on push to `main`.

## Quick edit loop

```bash
# 1. Edit fields / labels / options / submit copy
$EDITOR data/audit-form.json

# 2. Rebuild static site into dist/
npm run build

# 3. Commit + push (Pages picks it up)
git add data/audit-form.json
git commit -m "Update audit intake form fields"
git push origin main
```

Landing-page copy (hero, deliverables, price, FAQ) lives in `scripts/build.mjs` near the `audit.html` / `audit-thanks.html` generators — search for `audit.html`.

## Field schema (`data/audit-form.json`)

| Key | Meaning |
|-----|---------|
| `action` | FormSubmit endpoint (`https://formsubmit.co/basileion.ops@gmail.com`) |
| `hidden` | FormSubmit controls: `_subject`, `_next` (thank-you URL), `_template`, `_captcha` |
| `honeypot` | Spam trap field (`_honey`); rendered hidden |
| `replyToField` | Which field becomes Reply-To (`email`) |
| `fields[]` | Ordered list of visible inputs |

### Supported `fields[].type` values

| type | Renders as |
|------|------------|
| `text` / `email` | Single-line input |
| `select` | Dropdown; first empty option = placeholder |
| `textarea` | Multi-line; optional `rows` |
| `checkbox-group` | Multi-select checkboxes; posts as `name[]` |
| `checkbox` | Single required consent box |
| `file` | File input; set `multiple: true` and `accept` |

Common field keys: `name`, `label`, `required`, `placeholder`, `hint`, `autocomplete`, `options`, `value`, `multiple`, `accept`, `rows`.

## Backend (FormSubmit.co) — $0, no signup card

- Submissions email **basileion.ops@gmail.com** with file attachments.
- **Free file uploads:** multiple files allowed; **combined size ≤ 10 MB** per submission. Files are emailed as attachments and **not retained** by FormSubmit (text archive kept ~30 days).
- First-ever submission to a new recipient triggers a **one-time activation email** — open that inbox and click Activate.
- Honeypot: `_honey` (hidden). reCAPTCHA left off (`_captcha: false`) because uploads + captcha are awkward; honeypot covers basic bots.
- After submit, users land on `/audit-thanks.html` via `_next`.

Docs: https://formsubmit.co/documentation

## Do not put in this form

- Payment / Stripe checkout (payment is sent after Kurt accepts the intake)
- Credential / API-key fields
- Paid form backends or Cloudflare Workers that need a card
