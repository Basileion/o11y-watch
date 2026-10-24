# O11y Watch #001 — The baseline issue

*Free tiers & pricing changes in observability tools. Data checked 2026-10-16. Every claim links to the vendor's own pricing page.*

---

## TL;DR
- **Highlight.io is gone**: its pricing page now redirects to LaunchDarkly. If you used it, it's time to move.
- **Logz.io is changing Metrics pricing**: new pricing from **Oct 1, 2026**, for new consumption plans only.
- **Baseline set**: 73 pricing pages snapshotted; 39 vendors verified by hand. From now on we diff them every week.

## What changed

| Vendor | Change | Source |
|---|---|---|
| Highlight.io | Pricing page redirects to launchdarkly.com (acquired by LaunchDarkly). Removed from directory. | [highlight.io/pricing](https://www.highlight.io/pricing) |
| Logz.io | "New Metrics pricing starts Oct. 1, 2026 for new consumption plans only. Existing plans keep their current rate." | [logz.io/pricing](https://logz.io/pricing/) |

**What to do:** Highlight users: export and migrate (Sentry, PostHog, and Honeybadger are verified free options for errors and replay). Logz.io customers on existing plans: your rate stays the same for now. Read the details before you change plans.

## The take: "free" is mostly per-seat now
Look at the error trackers we verified. Sentry, Honeybadger, and Bugsnag all limit the free plan to **one user** (or "solo users"). New Relic gives **100 GB/month of ingest** but only **1 full platform user**. The data allowance is generous. The seat limit is the actual paywall. When you evaluate a free tier, ask "what happens when my second engineer joins?" before you ask "how many events?"

The exceptions are worth knowing. PagerDuty's free plan covers **5 users**. Instatus covers **5 team members**. GlitchTip doesn't list a seat cap at all (1,000 events/month, unlimited projects).

## Free tier of the week: Axiom
- **$0/month, permanent, no card**
- 500 GB/month data loading compute, 10 GB-hours query compute, 25 GB storage
- Why it matters: among dedicated hosted log tools in our data it's the most generous verified free tier (Graylog Open is free but self-hosted). Logz.io, Papertrail, Mezmo, and Coralogix are trial-only or paid.
- Gotcha: the limits are measured in compute and storage units, not "GB of logs ingested," so estimate your query load first.
- Source: [axiom.co/pricing](https://axiom.co/pricing)

## Quick picks by category
- **APM:** New Relic (100 GB/mo ingest) · Grafana Cloud for an open stack
- **Errors:** Honeybadger or Sentry (5k errors/mo, 1 user)
- **Uptime:** UptimeRobot (50 monitors, non-commercial only) · Hyperping (20 monitors) for commercial use
- **LLM:** Langfuse Hobby (50k units/mo, no card)

---

### 📣 Sponsor slot — *placeholder*
*This space is reserved for one clearly labeled sponsor per issue. Rates: DRAFT, not yet offered.*

---

*Spotted a pricing change? Reply and tell us. O11y Watch is independent and not affiliated with any vendor. Always verify on the source page before you buy.*
