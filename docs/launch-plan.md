# O11y Watch: $0 launch plan

Status: nothing has been signed up for, deployed, bought, or sent. **[KURT]** marks a step that needs Kurt's own account or approval.

## 1. Code hosting: GitHub (free)
1. **[KURT]** Create a public repo `o11y-watch` under Kurt's GitHub account (a free account is enough). Public repos get free GitHub Actions minutes.
2. Push the repo from your machine:
   `cd /workspace/pricing-tracker && git init && git add . && git commit -m "Initial MVP" && git branch -M main && git remote add origin git@github.com:<kurt>/o11y-watch.git && git push -u origin main`
   **[KURT]** approve the push. Add a `.gitignore` containing `dist/` if the site will be built in CI.
3. **[KURT]** Under Settings → Actions → General, allow "Read and write permissions" so the weekly workflow (`.github/workflows/weekly-check.yml`) can commit snapshots. Then run it once with "Run workflow".

## 2. Hosting (pick one, both free)
**Option A: Cloudflare Pages** (free subdomain `o11y-watch.pages.dev`)
1. **[KURT]** Create or sign in to a free Cloudflare account. Go to Workers & Pages → Create → Pages → Connect to Git → select the repo.
2. Build command: `node scripts/build.mjs`. Output directory: `dist`. Each push to main redeploys, including the weekly bot commit.

**Option B: GitHub Pages** (free subdomain `<kurt>.github.io/o11y-watch`)
1. Add a deploy job to the workflow: `actions/upload-pages-artifact` with `path: dist`, then `actions/deploy-pages` (needs `pages: write` and `id-token: write`).
2. **[KURT]** Under Settings → Pages → Source, choose "GitHub Actions".

## 3. Newsletter: Kit (ConvertKit)

**Done:** all subscribe forms POST to Kit form 10093883 (`https://app.kit.com/forms/10093883/subscriptions`, field `email_address`). Hosted page: https://o11y-watch.kit.com/6b567804da. The Beehiiv notes below are superseded.

### (Superseded) Beehiiv free plan
1. **[KURT]** Create a free Beehiiv publication named "O11y Watch". The free "Launch" plan allows up to 2,500 subscribers. Check the current limits at https://www.beehiiv.com/pricing before signing up.
2. Copy Beehiiv's embed or subscribe-form URL and replace the disabled placeholder form in `scripts/build.mjs` (the `<section class="signup">` block). Rebuild and push.
3. **[KURT]** Review `docs/newsletter-issue-001.md`, paste it into Beehiiv, and approve sending or scheduling it. Kurt is the sender.

## 4. Weekly routine (~2 h)
Monday: the Action runs `check.mjs`. Read `reports/diff-YYYY-MM-DD.md`, add real changes to `data/changes.json`, and push (the site redeploys). Write the issue and send it from Beehiiv **[KURT]**.

## 5. Soft launch (optional, all free)
**[KURT]** Approve any public post before it goes up, e.g. Show HN, r/devops / r/sre, or X/LinkedIn. Each post should be written and sent from Kurt's own accounts.

## Optional: domain o11ywatch.dev
On 2026-10-16 the .dev registry's RDAP lookup returned "not found", so the domain looked unregistered. Re-check before buying. Prices found on 2026-10-16 (USD per year):

| Registrar | 1st year | Renewal | Source |
|---|---|---|---|
| Porkbun | $8.75 (sale) | $12.87 | https://porkbun.com/tld/dev (fetched directly) |
| Cloudflare Registrar | $12.20 list; $8.20 promo reported by a third-party tracker | $12.20 | https://domainoffer.net/tld/dev/cloudflare , https://pikkly.dev/domains/registrar/cloudflare/ |
| Namecheap | $10.98 (sale) | $20.98 | https://www.namecheap.com/domains/registration/gtld/dev/ |

Recommendation: Cloudflare Registrar. It renews at cost and plugs straight into Cloudflare Pages custom domains. Budget about $12–13/yr. **[KURT]** approves and pays. .dev domains require HTTPS, which both Pages hosts provide automatically.
