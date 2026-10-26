# Affiliate programs among the 73 tracked vendors (researched 2026-10-26)

Status: **not joined**. `data/vendors.json` → `affiliate: {program, joined:false, link:null, ...}`. To activate: join, paste the referral URL into `link`, set `joined: true`, rebuild. The button then uses the referral link with `rel="sponsored nofollow"` and the disclosure switches to "this is an affiliate link".

Estimated value = commission × typical plan price × duration × fit with our audience (uptime/status tools dominate our traffic-intent pages). Rough, not a forecast.

| Rank | Vendor | Commission | Cookie | Network / signup | Est. value per paying referral | Source |
|---|---|---|---|---|---|---|
| 1 | Better Stack | 25% of net revenue, first 12 mo | not stated (last referrer wins) | In-house, https://betterstack.com/affiliates (PayPal, $100 min) | High: usage-based, teams often $100+/mo → ~$300/yr | https://betterstack.com/affiliates |
| 2 | StatusCake | 30% recurring, lifetime | 30 days | Post Affiliate Pro, https://psantoris.postaffiliatepro.com/affiliates/ ($100 min) | Medium-high, lifetime | https://www.postaffiliatepro.com/affiliate-program-directory/statuscake-affiliate-program/ (third-party; confirm) |
| 3 | UptimeRobot | 20% recurring, lifetime | 30 days (must register in window) | In-house dashboard, auto-approved, https://uptimerobot.com/affiliate/ (PayPal, $100 min, ≥2 referrals) | Medium: e.g. $28/mo plan → $5.60/mo for life; huge brand recognition | https://uptimerobot.com/affiliate/ |
| 4 | Hyperping | 30% recurring, 12 mo | 90 days | In-house, https://partners.hyperping.com/program ($50 min) | Medium | https://partners.hyperping.com/program |
| 5 | Instatus | 30% recurring, lifetime | not stated | In-house, https://instatus.com/referrals | Medium (status pages, small tickets) | https://instatus.com/referrals |
| 6 | Oh Dear | 20% of first 12 mo (was 25% until 2026-03-27; marketing page still says 25%) | 30 days | In-house, https://affiliates.ohdear.app/signup (€150 min, invoice required) | Low-medium | https://ohdear.app/changelog/2026-03-27 |
| 7 | Atatus | 10–25% recurring, tiered by volume | not stated | In-house partner program, https://www.atatus.com/partner-program/ | Low-medium (APM, low brand awareness) | https://www.atatus.com/partner-program/ |
| 8 | Checkly | 20% recurring, 12 mo (unverified) | 60 days | Not stated | Medium if real | community listing https://github.com/Affitor/open-affiliate/blob/main/programs/checkly.yaml — **verify before joining** |

## Excluded (not cash, not public, or not found)
- Site24x7: referral pays 20% as **monitoring credits**, not cash (https://www.site24x7.com/referral-program.html). Zoho's cash affiliate program (15% first 12 mo, 90-day cookie, https://www.zoho.com/affiliate/) may cover it — check if Site24x7 is in its catalogue.
- Honeybadger: credits, not cash (https://www.honeybadger.io/blog/referral-program/).
- Pingdom: historical ShareASale program (50% of first payment); no current public page found.
- Sematext, Logz.io, Middleware, Langfuse, SolarWinds (Papertrail/Loggly): reseller/partner programs only, no public commission.
- No public cash program found: Sentry, Datadog, New Relic, Grafana, Honeycomb, Axiom, PostHog, Rollbar, Raygun, AppSignal, PagerDuty, incident.io, Rootly, FireHydrant, ilert, Squadcast, Zenduty, Healthchecks.io, updown.io, StatusGator, Cronitor, OneUptime, OpenStatus, LogRocket, Helicone, Portkey, Lunary and the rest. Directory sites such as openaffiliate.dev list some of these as "unverified"; ignore until a vendor page confirms.

## Rules
- Never let commissions change data, gotchas or picks (stated on /about.html#money).
- UptimeRobot and others ban PPC on brand terms and coupon-site use; we do neither.
- FTC: disclosure sits next to every button, not only in the footer.
