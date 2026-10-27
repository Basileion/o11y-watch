# O11y Watch — observability free-tier & pricing-change tracker (MVP)

*o11y = observability (o + 11 letters + y).*
- `data/vendors.json`: 39 vendors, each with free-tier summary, source URL and date checked
- `data/changes.json`: change log entries (curated from diff reports)
- `scripts/check.mjs`: fetches pricing pages, extracts the main text, diffs it against `snapshots/`, and writes `reports/diff-YYYY-MM-DD.md` + `reports/latest.json`. Set `CHROME_BIN` to fall back to headless Chrome for JS-heavy pages. `--baseline` overwrites the snapshots.
- `scripts/build.mjs`: generates the static site into `dist/` (index.html = directory, changes.html = log). No dependencies.
- `.github/workflows/weekly-check.yml`: weekly Monday cron (not pushed anywhere)
- Weekly routine (~2h): `npm run check`, review the report, add real changes to data/changes.json, `npm run build`, write the newsletter.

## SEO
- `seo/head-extra.html`: paste Google / Bing (`msvalidate.01`) verification meta tags here; they are injected into every page's `<head>` on build.
- `indexnow.key`: IndexNow key; build hosts it at `/<key>.txt`. After a deploy, run `node scripts/indexnow.mjs` to submit every sitemap URL to Bing/IndexNow.
- `pro-welcome.html` is intentionally `noindex` and left out of the sitemap.
