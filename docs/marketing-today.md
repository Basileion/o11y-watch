# Marketing today: $0 channels, copy, sponsor outreach (drafted Oct 26, 2026)

Nothing here has been posted, sent, or signed up for. Everything is a draft for Kurt.

**Big caveat:** the site is on `o11y-watch.pages.dev`, a free subdomain. **SaaSHub and BetaList reject free subdomains**, and BetaList no longer has a free tier anyway. A custom domain (~$10) unlocks more directories, but it isn't $0, so it's a later step.

## 1. Free channels a brand-new account can use today (rules web-checked Oct 26)

| # | Channel | New-account rule (verified) | Today? | Fit for devops/SRE |
|---|---|---|---|---|
| 1 | **dev.to article** | Anyone can post right away. Spam filters apply, and accounts under 3 days old get tight rate limits ([help](https://dev.to/help/getting-started)) | Yes | High (#devops #observability tags) |
| 2 | **Hashnode article** (cross-post with canonical URL) | Can publish right away. Bans accounts used "primarily for self-promotion" ([CoC](https://hashnode.com/code-of-conduct)) | Yes | Medium |
| 3 | **awesome-observability PR** ([adriannovegil/awesome-observability](https://github.com/adriannovegil/awesome-observability), 722★) | Open PRs welcome. About 20 "Add X" PRs are open, so merging is slow and uncertain | PR today | High, plus lasting SEO |
| 4 | **Indie Hackers product page + inline post** | `/new-post` blocks new accounts, but the "Write a new post" box on your own product page does publish ([submitmap](https://submitmap.com/platform/indie-hackers/)) | Yes | Low for buyers, good for sponsors/founders |
| 5 | **Product Hunt (Oct 27)** | Already scheduled | Tomorrow | Medium |
| 6 | **Uneed** | Free waiting line, with a date assigned up to 5 months out. Needs a score of 10 or it gets unpublished ([help](https://help.uneed.best/getting-started/how-to-submit-your-first-product)) | Submit only | Low/slow |
| 7 | **DevHunt** | Free, needs GitHub login. The free queue averages **about 6 months** ([launchdirectories](https://launchdirectories.com/directory/devhunt)) | Submit only | Dev tools fit well, but slow |
| 8 | **AlternativeTo** | Free with a verified email. The normal queue takes "several months" ($5 priority review) | Submit only | Medium SEO |
| 9 | **Fazier** | Free, but you must post 3 helpful comments and include a backlink. Wait is up to 30 days ([submitby.ai](https://submitby.ai/compare)) | Submit only | Low |
| 10 | **Launching Next** | Free, reviewed daily ([asksami](https://asksami.app/distribution/directories)) | Submit today | Low |
| — | Lobsters | Invite only. For the first 70 days new users can't post unseen domains or use the `show` tag ([signup](https://lobste.rs/signup)) | **No** | — |
| — | CNCF/Kubernetes Slack | Self-promotion is explicitly banned, and unsolicited DMs are banned ([guidelines](https://www.kubernetes.dev/docs/comms/slack/)) | **No promo.** Only answer pricing questions when asked | — |
| — | BetaList / SaaSHub / TAAFT | Paid, rejects free subdomains, or AI-only | **No** | — |

## 2. Ready-to-post copy (top 5)

### A. dev.to (also cross-post to Hashnode with `canonical_url` = the dev.to URL)
**Title:** I tracked the free tiers of 73 observability tools. Here's what changed this year
**Tags:** devops, observability, sre, monitoring

> Picking a monitoring/logging/APM tool usually means opening 10 pricing pages that each count "free" differently: hosts, GB ingested, spans, users, retention days.
>
> So I built O11y Watch (https://o11y-watch.pages.dev). It tracks the free tier and pricing changes for 73 tools across APM, logs, uptime, error tracking, incident management and LLM observability, and every number links to the vendor's own page.
>
> **What I learned building it:**
> - "Free" units don't compare. Normalize everything to *what a 5-person team with ~50 GB/mo of logs actually pays*.
> - Retention is the hidden limit. Many generous-looking free tiers keep data for only a few days.
> - Pricing pages change quietly. That's why there's a change log (https://o11y-watch.pages.dev) and a weekly newsletter.
>
> **Three real changes from the change log:**
> - **UptimeRobot (Oct 24, 2026):** paid prices rose ~18%. Team went $39→$46/mo (monthly) and Scale $83→$98/mo (monthly); the free plan was unchanged in our snapshot. Source: https://uptimerobot.com/pricing/
> - **Lunary (Oct 24, 2026):** free tier removed for new users. The pricing page now says "Payment is required to activate your workspace", and cloud starts at $20/user/mo. Existing Free workspaces stay as they are. Source: https://lunary.ai/pricing
> - **Logz.io (logged Oct 16, 2026):** the pricing page announces "New Metrics pricing starts Oct. 1, 2026 for new consumption plans only. Existing plans keep their current rate." Source: https://logz.io/pricing/
>
> The data is free to browse. Pro ($6/mo or $60/yr) adds change alerts for the tools you choose: https://o11y-watch.kit.com/products/o-11-y-watch-pro
>
> What tool's pricing has surprised you? I'll add it.

### B. awesome-observability PR
README checked Oct 26, 2026 (master branch). "Cost & Usage Tracking" is a subsection of "10. LLM & AI Observability" and covers AI token/cost tools, and there is no Caprock entry, so it's the wrong fit. "2. General Tools" has no list. The list isn't alphabetical: new entries go at the end of a section. The best fit is **"## 16. References"**, appended as the last bullet after `- https://landscape.cncf.io/`. Format follows `contributing.md`: `- [Name](https://example.com/) - Short, factual description.` That file also bans marketing, affiliate, and tracking links, so this entry deliberately has **no** Pro checkout link.
**Branch:** `add-o11y-watch`. **Section:** `## 16. References` (last line)
**Line:** `- [O11y Watch](https://o11y-watch.pages.dev/) - Independent, source-linked tracker of free tiers and pricing changes for 73 observability tools.`
**PR title:** Add O11y Watch to References
**PR body:** Adds O11y Watch, a free, source-linked tracker of free tiers and pricing changes across 73 observability tools, to References. One resource, in the style from contributing.md, appended at the end of the section. Disclosure: I maintain it. Happy to move it to another section if you prefer.

### C. Indie Hackers (product page tagline ≤60 chars + inline post)
**Tagline:** Free tiers & pricing changes for 73 observability tools
**Post title:** Launching a niche data product on $0: pricing tracker for 73 o11y tools
> Shipped O11y Watch this month. It tracks free tiers and pricing changes for 73 observability tools. Revenue plan: $6/mo Pro alerts, $49 newsletter sponsor slots, affiliates. Biggest surprise so far: pricing moves fast. In one weekly check, UptimeRobot raised paid prices ~18% (Team $39→$46/mo) and Lunary dropped its free tier for new users. HN is blocked (new account), PH is tomorrow. Question for IH: for a B2B niche newsletter, did sponsors or paid subs pay off first for you? (Pro alerts, if you want to see how it works: https://o11y-watch.kit.com/products/o-11-y-watch-pro)

### D. Product Hunt (Oct 27) first comment
> Hi PH 👋 I built O11y Watch because comparing observability pricing meant opening dozens of tabs. It covers 73 tools, every number is source-linked, and changes are logged weekly. Free to browse; Pro ($6/mo) emails you when a tool you use changes its pricing. Get Pro here: https://o11y-watch.kit.com/products/o-11-y-watch-pro. Founding sponsor slots are $49/issue. What tool should I add next?

### E. Launching Next / Uneed / AlternativeTo (shared listing blurb)
**Name:** O11y Watch. **Short:** Track free tiers & pricing changes for 73 observability tools.
**Long:** O11y Watch is an independent, source-linked tracker of free tiers, limits and pricing changes across APM, logging, uptime, error tracking, incident and LLM-observability tools. Browse free; Pro adds pricing-change alerts ($6/mo or $60/yr): https://o11y-watch.kit.com/products/o-11-y-watch-pro. **Alternatives (AlternativeTo):** Vendr, CloudZero-style cost tools, StackShare.

## 3. Sponsor outreach: 10 vendors (all tracked on the site; contact URLs returned HTTP 200 on Oct 26)

Based on the sponsor template in `docs/launch-kit.md`. Shared body after the personalized opener:

> I run O11y Watch (https://o11y-watch.pages.dev), an independent tracker of free tiers and pricing changes for 73 observability tools, and you're one of them. Readers are developers and engineering leads actively comparing tools, so every page is a buying-decision page. We're new, so I won't quote audience numbers I can't show yet; I'm happy to send current figures, unrounded. That's why the first 5 sponsors get founding rates: newsletter slot $49/issue, site placement $39/month, or both for $79, locked for 3 months. Sponsor content is clearly labeled and can't change our data or picks (https://o11y-watch.pages.dev/sponsor.html). Book directly: https://o11y-watch.kit.com/products/sponsor-newsletter-slot-founding. Interested in a slot in the next few weeks?
>
> Kurt Waibel, O11y Watch
> Reply-to: basileion.ops@gmail.com

**Subject:** use each row's Subject column below. **Reply-to header:** basileion.ops@gmail.com

| # | Vendor | Subject | Public contact page | Personalized opener (checked against data/vendors.json, Oct 24 data) |
|---|---|---|---|---|
| 1 | SigNoz | Sponsor slot on O11y Watch: engineers comparing APM tools | https://signoz.io/contact-us/ | SigNoz pitches itself as the open-source, OpenTelemetry-native Datadog alternative, and O11y Watch readers are the people running that comparison. |
| 2 | Dash0 | Sponsor slot on O11y Watch: engineers comparing OpenTelemetry observability tools | https://www.dash0.com/contact | As a newer OTel-native platform, you want to be on the shortlist when teams compare; a founding slot puts you there for $49. |
| 3 | OpenObserve | Sponsor slot on O11y Watch: engineers comparing log management tools | https://openobserve.ai/contact-us/ | OpenObserve's pitch of much lower log storage costs, plus an open-source self-host option, is exactly what our readers come to check. |
| 4 | Axiom | Sponsor slot on O11y Watch: engineers comparing log management tools | https://axiom.co/contact | Axiom's $0 plan (500 GB/mo of data-loading compute, no card) is one of the free tiers on our site, and a sponsor slot lets you explain it in your own words. |
| 5 | Last9 | Sponsor slot on O11y Watch: engineers comparing OpenTelemetry observability tools | https://last9.io/contact/ | Teams fighting high-cardinality bills read our pricing pages first, and that's your buyer. |
| 6 | groundcover | Sponsor slot on O11y Watch: engineers comparing APM tools | https://www.groundcover.com/contact | Your BYOC, eBPF-based pitch with per-host pricing (not per-GB) lands best with readers already comparing per-host and per-GB bills. |
| 7 | Checkly | Sponsor slot on O11y Watch: engineers comparing synthetic monitoring tools | https://www.checklyhq.com/contact/ | Checkly's monitoring-as-code approach and its Hobby plan (10k API and 1k browser check runs) sit in our synthetics/uptime section, where developers compare their options. |
| 8 | Cronitor | Sponsor slot on O11y Watch: engineers comparing cron and uptime monitoring tools | https://cronitor.io/support | Cronitor's free plan (5 monitors) is listed in our cron/uptime section, and a $49 slot is a cheap test of an audience that already monitors scheduled jobs. |
| 9 | Honeycomb | Sponsor slot on O11y Watch: engineers comparing tracing tools | https://www.honeycomb.io/contact-us | Engineers evaluating tracing and high-cardinality debugging compare Honeycomb's free tier (20M events/mo) against others on our site. |
| 10 | Grafana Labs | Sponsor slot on O11y Watch: engineers comparing full-stack observability tools | https://grafana.com/contact/ | Grafana Cloud's always-free tier (10k active metric series, 14-day retention) is a baseline readers check other tools against on our site. |

Personalization is based on each vendor's public positioning. Each opener was checked on Oct 26 against that vendor's row in `data/vendors.json`. Fixes: SigNoz (the old opener talked about "your readers"), OpenObserve (cloud is trial-only), Axiom (the free limit is compute, not GB of logs), groundcover (pricing is per host, not flat), Checkly and Grafana (dropped unverifiable "most-compared"/"most-referenced" claims), and Cronitor (now leads with its cron positioning). Send from the personal Gmail, one at a time (no bulk).

## 4. Ranked: most likely to bring money in today
1. **Sponsor emails to the 10 vendors above.** One yes = $49–$79 today via the Kit link, which makes this the only realistic same-day revenue.
2. **Personal-network asks** (ex-colleagues, friends in devops): offer Pro at $6/mo or $60/yr directly by email or text.
3. **Prep Product Hunt for Oct 27**: first comment, assets, and the Pro/sponsor links in the description.
4. **dev.to article with Pro CTA**: indexed and readable today, and the most direct path to devops readers.
5. **Affiliate links**: check that every vendor page with an affiliate program (docs/affiliate-programs.md) has live links before PH traffic arrives.
6. **awesome-observability PR + IH post**: low money today, but they build longer-term traffic and sponsor credibility.
7. **Directory submissions** (Launching Next, AlternativeTo, Uneed, DevHunt, Fazier): $0 today, weeks to months out. Submit and forget.
