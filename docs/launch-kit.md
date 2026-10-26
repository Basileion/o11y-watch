# O11y Watch — launch kit (DRAFTS, not posted)

All numbers below come from `data/` as of 2026-10-24: **73 vendors tracked, 70 verified from pricing pages, 10 logged changes** (incl. UptimeRobot paid plans +~18%, Lunary ending free signups, Highlight.io sunset). Re-check counts before posting. No testimonials, user counts or vendor logos — keep it that way.

Links: https://o11y-watch.pages.dev · Compare: https://o11y-watch.pages.dev/compare.html · Changes: https://o11y-watch.pages.dev/changes.html · Pro: https://o11y-watch.pages.dev/pro.html

Gallery images (1270×760, original): `assets/launch/1-pricing-diff.png`, `assets/launch/2-compare.png`, `assets/launch/3-pro.png`. OG/social cards: `assets/og/*.png`.

---

## Show HN

**Title:** Show HN: O11y Watch – free tiers and pricing changes for 73 observability tools

**Body:**
I kept getting surprised by observability pricing: a free tier quietly shrinks, a plan moves to per-seat, a page starts saying "payment required". So I built a tracker.

O11y Watch snapshots the public pricing pages of 73 APM, logging, error-tracking, uptime, on-call and LLM-observability vendors, records the free plan limits (70 verified by hand so far, the rest labeled Unverified), and diffs the pages weekly. Every number links to the vendor's page and a check date.

Things the diff caught in the last two weeks: UptimeRobot paid plans up ~18% (annual Team $396 → $468/yr), Lunary now requires payment for new workspaces, Highlight.io's pricing page redirects to LaunchDarkly.

It's a static site with a free JSON API (+ OpenAPI, llms.txt) and RSS. There's a free weekly email and an optional $6/mo Pro tier for same-day alerts and exports — the data stays free.

Methodology: https://o11y-watch.pages.dev/about.html. I'd love corrections — pricing pages are messy and I'd rather be told I'm wrong.

---

## r/devops

**Title:** I track the free tiers of 73 observability tools and diff their pricing pages weekly — here's what changed this month

**Body:**
Free tiers are how most of us pick monitoring tools, and they change silently. I built a tracker that saves each vendor's pricing page, records the free plan limits with a source link, and diffs weekly.

Recent changes:
- UptimeRobot: paid plans up ~18% (Team $39 → $46/mo monthly)
- Lunary: "Payment is required to activate your workspace" for new users
- Logz.io: new metrics pricing for new consumption plans from Oct 1

Also: of the verified free tiers, a lot cap you at one user — the real paywall is your second engineer.

Directory + side-by-side compare: https://o11y-watch.pages.dev — free, no signup needed. Corrections welcome; every entry links to its source.

*(Check r/devops self-promo rules first; post in the weekly thread if required.)*

---

## r/sre

**Title:** Comparing on-call / incident tool free tiers (PagerDuty, incident.io, Rootly…) with sources

**Body:**
I maintain a sourced list of free tiers across 73 observability tools. For on-call specifically: PagerDuty's free plan covers 5 users with one schedule and one escalation policy; incident.io has a free plan with Slack/Teams + status page; Rootly lists no free tier. Each links to the vendor page and the date I checked it.

https://o11y-watch.pages.dev/category/incident.html

Pricing pages drift weekly, so there's a public change log + RSS: https://o11y-watch.pages.dev/changes.html. If something's wrong, tell me and I'll fix it.

---

## X thread

1/ Observability free tiers change quietly. I started diffing the pricing pages of 73 tools every week. Here's what changed recently 🧵 [image: 1-pricing-diff.png]

2/ UptimeRobot raised paid plans ~18%. Annual Team: $396 → $468/yr. Free plan unchanged. Source linked on the site.

3/ Lunary now says "Payment is required to activate your workspace" for new users. Existing free workspaces stay.

4/ Highlight.io's pricing page now redirects to LaunchDarkly after the acquisition.

5/ Pattern: many free tiers are 1 user. The paywall isn't volume — it's your second engineer.

6/ Compare any 3 tools side by side, with gotchas + source links: https://o11y-watch.pages.dev/compare.html [image: 2-compare.png]

7/ Free weekly email of every change, or Pro ($6/mo) for same-day alerts + CSV/JSON exports. Data and API stay free. https://o11y-watch.pages.dev

---

## LinkedIn

Observability bills rarely jump because of one big decision. They jump because a free tier shrinks, a plan goes per-seat, or a price moves 18% and nobody notices until renewal.

I built O11y Watch to fix that: it tracks the free tiers and pricing pages of 73 observability tools (APM, logs, errors, uptime, on-call, LLM tracing), verified from each vendor's own page, and diffs them weekly.

Recent: UptimeRobot paid plans +~18%, Lunary ended free signups for new workspaces, Highlight.io folded into LaunchDarkly.

It's free to browse and compare, with a weekly email. If you own an observability budget, it's worth a bookmark: https://o11y-watch.pages.dev

---

## Product Hunt

- **Name:** O11y Watch
- **Tagline (≤60):** Every observability free tier and price change, sourced
- **Topics:** Developer Tools, SaaS, Monitoring
- **Description:** O11y Watch tracks free tiers and pricing for 73 observability tools — APM, logs, error tracking, uptime, on-call and LLM tracing. Every limit is copied from the vendor's pricing page with a source link and check date, and pages are diffed weekly so you hear about price hikes and shrinking free tiers before your invoice does. Compare any three tools side by side, use the free JSON API, or get same-day alerts with Pro.
- **Gallery:** `assets/launch/1-pricing-diff.png`, `assets/launch/2-compare.png`, `assets/launch/3-pro.png`
- **Thumbnail:** `assets/img/icon-512.png`
- **Maker comment:** Built this after getting surprised by one too many pricing changes. Data is free, sourced, and correctable — please tell me what's wrong or missing.

---

## Sponsor outreach email (template)

**To:** [marketing/devrel contact at vendor or adjacent tool]
**Subject:** Sponsor slot on O11y Watch — engineers comparing observability tools

Hi [Name],

I run O11y Watch (https://o11y-watch.pages.dev), an independent tracker of free tiers and pricing changes for 73 observability tools. Readers are developers and engineering leads actively comparing tools — every page is a buying-decision page.

We're new, so I won't quote audience numbers I can't show yet; I'm happy to send current figures, unrounded. That's why the first 5 sponsors get founding rates: newsletter slot $49/issue, site placement $39/month, or both for $79 — locked for 3 months.

Sponsor content is clearly labeled and can't change our data or picks (https://o11y-watch.pages.dev/sponsor.html).

Interested in a slot in the next few weeks?

Kurt
basileion.ops@gmail.com
