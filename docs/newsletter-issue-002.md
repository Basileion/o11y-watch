# O11y Watch #002 — UptimeRobot tests higher prices, Lunary ends free signups

*Week of 2026-10-24. We re-checked all 73 tracked pricing pages. Every claim links to the vendor's own page.*

---

## TL;DR
- **UptimeRobot is testing ~18% higher paid prices.** Default visitors see Team at $46/mo on monthly billing (was $39); a test group still sees the old prices. The free plan is unchanged. *(Requalified 2026-10-30: this is a cookie-based price test, so the +18% applies only if it settles on the higher prices.)*
- **Lunary ended free signups.** New cloud workspaces require payment and start at $20/user/mo. Existing Free workspaces are grandfathered.
- **The directory is now fully reviewed:** 70 of 73 vendors verified, plus entry prices, billing model, card and self-host fields.

## What changed

| Vendor | Change | Source |
|---|---|---|
| UptimeRobot | Price test: Team $39 or $46/mo monthly, $33 or $39/mo annual ($396 or $468/yr). Scale $83 or $98/mo monthly, $67 or $79/mo annual. Higher prices are the default group. | [uptimerobot.com/pricing](https://uptimerobot.com/pricing/) |
| Lunary | "Payment is required to activate your workspace." Cloud from $20/user/mo; existing Free workspaces stay the same. | [lunary.ai/pricing](https://lunary.ai/pricing) |
| Bugsnag | Free plan listed as 1 user, 7.5K events + 1M spans/mo. (We can't confirm whether this is new or just a fuller reading.) | [bugsnag.com/pricing](https://www.bugsnag.com/pricing/) |
| Uptrace | Cloud free tier stated as 50 GB + 5,000 timeseries/mo; self-hosted Community Edition free with no limits. | [uptrace.dev/pricing](https://uptrace.dev/pricing) |
| Bugsink, StatusGator | Pricing pages moved (old URLs now 404). | [bugsink.com](https://www.bugsink.com/) · [statusgator.com/plans](https://statusgator.com/plans) |

**What it costs you:** a team on UptimeRobot Team with annual billing now pays **$72 more per year** for the same plan.

## The take: the free tier is the bait, the second tier is the bill
UptimeRobot didn't touch the free plan. It raised the plan you move to once you need commercial use. The free plan is explicitly for "hobby and non-profit projects." Lunary went further and stopped offering free cloud workspaces to new users. The pattern: **free tiers rarely get cut outright; the path off them gets more expensive.** When you choose a free tier, price the *first paid step* too. That's now on every vendor page as "Entry paid price."

## Free tier of the week: Uptrace
- **Cloud:** 50 GB and 5,000 timeseries free per month, then from $0.075/GB
- **No seat or host limits:** pricing depends only on what you ingest
- **No credit card**, and the self-hosted Community Edition is free with no limits
- Why it matters: most APM free tiers cap seats. Uptrace caps only data, so a whole team can use it.
- Source: [uptrace.dev/pricing](https://uptrace.dev/pricing)

## Alternatives if you're affected
- **Leaving UptimeRobot (commercial use):** Hyperping, free 20 monitors (paid from $24/mo); Instatus, free 15 monitors with 2-min checks
- **Leaving Lunary:** Langfuse Hobby (50k units/mo, no card); Arize AX Free (25k spans/mo, no card); Opik Free Cloud (25k spans/mo)

---

### 📣 Sponsor slot — *placeholder*
*Reserved for one clearly labeled sponsor per issue. Rates: DRAFT, not yet offered.*

---

*Spotted a pricing change? Reply and tell us. O11y Watch is independent and not affiliated with any vendor. Always verify on the source page before you buy.*
