// Datadog renewal cost-audit guide (ACT-20261107-45 / RT-20261107-93).
// Answer-first: renewal as trigger; config-not-usage; billable vs estimated; spikes; egress; commit baseline.
// Every $ figure comes from data/audit-rates.json. The 10–20% estimated-vs-billable gap is quoted from
// Datadog's own Estimated Usage Metrics docs. build.mjs guards rates + JSON-LD + links.
export const SLUG='guides/datadog-renewal-cost-audit.html';
export const CLEAN='/guides/datadog-renewal-cost-audit';
export const PUBLISHED='2026-11-07';
export const CHECKED='2026-11-07';
const usd=n=>{const r=Math.round(n*100)/100;return '$'+r.toLocaleString('en-US',{minimumFractionDigits:Number.isInteger(r)?0:2,maximumFractionDigits:2})};
export default function renewalGuide({RJ,P,BASE,SITE,esc,crumbs,crumbLd,ORG,auditCta,cta,cite,related,hubLinks,AUDIT_PRICE=149}){
  const DD=RJ.vendors.datadog,R=DD.rates,PR=R.products;
  const CHK=CHECKED,DS=RJ.dataset_checked;
  const L=(u,t)=>`<a href="${u}" rel="nofollow noopener">${esc(t)}</a>`;
  const SRC={
    est:'https://docs.datadoghq.com/account_management/billing/usage_metrics/',
    usage:'https://docs.datadoghq.com/account_management/plan_and_usage/usage_details/',
    allot:'https://docs.datadoghq.com/account_management/billing/product_allotments/',
    bill:'https://docs.datadoghq.com/account_management/billing/',
    plans:'https://docs.datadoghq.com/account_management/billing/pricing/',
    list:'https://www.datadoghq.com/pricing/list/',
    pricing:'https://www.datadoghq.com/pricing/',
    mwl:'https://docs.datadoghq.com/metrics/metrics-without-limits/',
    sum:'https://docs.datadoghq.com/metrics/summary/',
    agent:'https://docs.datadoghq.com/agent/logs/advanced_log_collection/',
    idx:'https://docs.datadoghq.com/logs/log_configuration/indexes/',
    reddit:'https://www.reddit.com/r/aws/comments/1w3hffb/',
    obs:'https://www.reddit.com/r/Observability/comments/1se49i5/',
    hn:'https://news.ycombinator.com/item?id=49977695',
  };
  const rate=(id,v,txt)=>`<span data-rate="${id}" data-price="${v}">${txt||usd(v)}</span>`;
  const title=`Before your Datadog renewal: cost audit checklist (2026) | ${SITE}`;
  const desc=`Before you sign a Datadog renewal: reconcile billable vs estimated usage (Datadog says they differ ~10–20% on average), find debug-log and custom-metric spikes, account for egress outside Datadog's line, then commit against a post-cleanup baseline. List prices checked ${CHK}.`;
  const answer=`Renewal is when you still have budget and a deadline. Before you commit host and product quantities, (1) reconcile Plan & Usage "Billable" against estimated usage — Datadog's own docs say estimated usage differs from billable by about 10–20% on average; (2) treat the bill as a telemetry-configuration problem, not an AWS-like usage problem (debug log level, unqueried custom metrics and health-check indexing move the invoice overnight); (3) put cloud egress next to the Datadog line — it sits outside Datadog's pricing; (4) clean up first, then commit against the post-cleanup baseline. Price the result with the free /audit teaser; unlock the $${AUDIT_PRICE} full report before you sign.`;
  const faq=[
    ['What should I do before a Datadog renewal?',answer],
    ['Why does our Datadog line look bigger than half our AWS bill?',`Buyers say that in public (r/aws). We have no data on how common it is, so we won't give you a percentage. AWS meters compute, storage and transfer that move with real workload; Datadog meters hosts (high-water mark of the lower 99% of hourly counts), custom metrics, indexed logs and spans — which move when telemetry configuration changes. Price each Datadog line at list against your own usage (Infrastructure Pro ${usd(R.host_mo_annual)}/host/mo annual, APM ${usd(PR.apm_host_mo_annual)}, custom metrics ${usd(PR.custom_metrics_per_100)}/100 beyond ${PR.custom_metrics_allot_per_pro_host}/Pro host, log ingest ${usd(PR.log_ingest_gb)}/GB), then decide whether cleanup or a different stack is the move.`],
    ['What is the difference between estimated and billable usage in Datadog?',`Datadog's Estimated Usage Metrics docs say: "These usage metrics are estimates that are not always matched to billable usage given their real-time nature. There is a 10-20% difference between estimated usage and billable usage on average. Due to the nature of the estimations, the margin of error is larger for small usage." Plan & Usage has an "All" view (includes trials / non-billable) and a "Billable" view that breaks out commitments, allotments and on-demand. Commit against Billable, not the estimated dashboards.`],
    ['Does Datadog\'s price include cloud egress?',`No. Datadog's list and billing docs price hosts, products, logs, metrics and spans. Cloud egress to ship that telemetry (and any duplicate pipeline that "pays twice for the same data") sits on your cloud bill. Buyers call this out in public threads; put both lines on the same slide before you renew.`],
    ['Should I commit to my current host count?',`Not until you've cleaned the spikes. Commit only to the post-cleanup baseline. Usage beyond committed quantity and allotments is metered on-demand (Plan & Usage → Subscription Details shows contract vs on-demand). If you autoscale, read the 99th-percentile host guide before you pick a number.`],
    ['How does the $'+AUDIT_PRICE+' audit help at renewal?',`The free /audit teaser prices your hosts, logs, custom metrics and seats against public list prices in your browser. The $${AUDIT_PRICE} full report unlocks ranked alternatives, cleanup levers capped at modeled lines, a migration plan with effort ratings, and Print/PDF — the handoff for a renewal budget review. Nothing is uploaded.`],
  ];
  const hub=[SLUG,'Before your Datadog renewal',`Billable vs estimated usage, config-not-usage spikes, egress outside Datadog's line, commit against a post-cleanup baseline. Then free /audit → $${AUDIT_PRICE}. Checked ${CHK}.`];
  P(SLUG,title,desc,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:'Before your Datadog renewal'}])}
<style>main blockquote{margin:10px 0;padding:6px 12px;border-left:3px solid rgba(127,127,127,.4)}</style>
<div class="eyebrow">Renewal checklist · Datadog docs + list prices · ${esc(PUBLISHED)}</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">Before your Datadog renewal</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:760px"><b>Answer (${esc(CHK)}):</b> ${esc(answer)}</p>
<p class="sm mut">List prices from ${L(SRC.list,'datadoghq.com/pricing/list')} (Billed Annually) and ${L(SRC.pricing,'datadoghq.com/pricing')}, read into our dataset (Datadog checked ${esc(DD.checked)}; dataset_checked ${esc(DS||'—')}). Billing rules quoted from Datadog docs linked below. Your contract may differ.</p>

<blockquote><i>“why is our Datadog line item bigger than half our AWS bill”</i> · <i>“your AWS bill moves with real usage, your Datadog bill moves with telemetry configuration”</i> · <i>“A logging level left at debug in one Lambda or ECS service can 10x indexed volume overnight”</i><div class="sm mut">Public r/aws thread: ${L(SRC.reddit,'1w3hffb')}</div></blockquote>

<h2 id="why-renewal">1 · Renewal is the trigger</h2>
<ul>
<li><b>Budget + deadline.</b> A surprise invoice forces a scramble; a renewal forces a decision. That is when a sourced, line-by-line cost model gets used.</li>
<li><b>What you are signing.</b> Host and product commitments, allotments, and on-demand overage rates. Plan &amp; Usage → Subscription Details shows the contract price and on-demand price per product (${L(SRC.usage,'Usage Details')}, ${L(SRC.allot,'Product Allotments')}).</li>
<li><b>Do not renew the waste.</b> Clean the spikes first (section 3), then commit against the quieter baseline — not last month's peak.</li>
</ul>

<h2 id="config-not-usage">2 · Config, not AWS-like usage</h2>
<ul>
<li><b>AWS (roughly):</b> the bill moves with real workload — vCPU-hours, GB-months, GB transferred.</li>
<li><b>Datadog:</b> the bill moves with how you configure telemetry. Hosts are the high-water mark of the lower 99% of hourly counts (${L(SRC.bill,'Billing docs')}). Custom metrics are name + tag combinations (${rate('dd-custom-metrics',PR.custom_metrics_per_100)} per 100 beyond ${PR.custom_metrics_allot_per_pro_host} per Infrastructure Pro host). Indexed logs are ${rate('dd-log-ingest',PR.log_ingest_gb)}/GB ingested plus ${usd(PR.indexed_logs_m['15'])}/M at 15-day retention (3-day ${usd(PR.indexed_logs_m['3'])} · 7-day ${usd(PR.indexed_logs_m['7'])} · 30-day ${usd(PR.indexed_logs_m['30'])}). APM is ${rate('dd-apm-annual',PR.apm_host_mo_annual)}/APM host/mo annual.</li>
<li><b>Leadership slide in one sentence:</b> “Our cloud bill moves with real usage; our Datadog bill moves with telemetry configuration.” Then show the lines.</li>
</ul>

<h2 id="billable-vs-estimated">3 · Billable vs estimated usage</h2>
<ul>
<li><b>Datadog's words:</b> “These usage metrics are estimates that are not always matched to billable usage given their real-time nature. There is a 10-20% difference between estimated usage and billable usage on average. Due to the nature of the estimations, the margin of error is larger for small usage.” (${L(SRC.est,'Estimated Usage Metrics docs')})</li>
<li><b>Which view to trust for renewal:</b> Plan &amp; Usage “Billable” (usage that contributes to the final bill, broken into commitments, allotments and on-demand). The “All” view includes trials and non-billable usage (${L(SRC.usage,'Usage Details')}).</li>
<li><b>Do not commit off a dashboard of estimated metrics.</b> Reconcile Billable to your invoice for the last full month, then size the renewal.</li>
</ul>

<h2 id="spikes">4 · Spikes to find before you commit</h2>
<p class="sm mut">Full cleanup playbook with priced levers: <a href="cut-datadog-bill-without-migrating.html">Cut your Datadog bill without migrating</a>. Do not duplicate that work here — this is the renewal-order checklist.</p>
<ol>
<li><b>Debug / verbose log level left on</b> in one Lambda, ECS service or cluster. Buyers report indexed volume jumping overnight. Drop noise at the Agent (<code>exclude_at_match</code>) or with an index exclusion filter (${L(SRC.agent,'Advanced Log Collection')}, ${L(SRC.idx,'Log Indexes')}).</li>
<li><b>Unqueried custom metrics</b> with no related dashboard, monitor, notebook or SLO. Metrics Summary → Query Activity (30/60/90 days) + Related Assets; prefer ${L(SRC.mwl,'Metrics without Limits')} tag allowlists over deleting code (${L(SRC.sum,'Metrics Summary')}).</li>
<li><b>Health-check / 2xx access logs</b> burning indexed volume. Exclusion filter stops indexing; Agent drop stops ingestion too.</li>
<li><b>Autoscaling peaks</b> that set the month's host high-water mark. See <a href="datadog-autoscaling-cost.html">Why autoscaling raises your Datadog bill</a>.</li>
<li><b>Confirm the drop on Plan &amp; Usage</b> for a full billing week before you lock the commitment.</li>
</ol>

<h2 id="egress">5 · Egress sits outside Datadog's line</h2>
<ul>
<li>Datadog's public list prices cover hosts, products, logs, metrics and spans — not the cloud egress that ships that telemetry to Datadog (or to a second pipeline).</li>
<li>Buyers in r/Observability call out “paying twice for the same data” and “Egress costs sit entirely outside Datadog's pricing” (${L(SRC.obs,'1se49i5')}). Put egress next to the Datadog line on the renewal slide so leadership sees the full cost of the current config.</li>
<li>We do not invent an egress $/GB here — use your cloud bill. The audit models Datadog-side list prices only.</li>
</ul>

<h2 id="commit">6 · Commit against the post-cleanup baseline</h2>
<ul>
<li>Infrastructure Pro list: ${rate('dd-host-annual',R.host_mo_annual)}/host/mo annual (${rate('dd-host-ondemand',R.host_mo_ondemand)} on-demand). APM: ${usd(PR.apm_host_mo_annual)} annual / ${usd(PR.apm_host_mo_ondemand)} on-demand.</li>
<li>Commit the quieter baseline after cleanup. Overages bill on-demand. Hybrid monthly/hourly (MHP) exists for bursty fleets — hourly rate is sales-quoted, not on the public list (${L(SRC.plans,'Pricing docs')}).</li>
<li>Worked EXAMPLE with named line items: <a href="datadog-40-host-cost-worked-example.html">Datadog 40-host cost worked example</a>.</li>
</ul>

${auditCta('Enter your post-cleanup hosts, log GB/day, custom metrics, spans and seats. Free conservative check; full ranked report $'+AUDIT_PRICE+' before you sign.','Run the free renewal cost check →','audit-guide-dd-renewal')}

<div class="card" id="renewal-cta" style="margin-top:18px">
<div class="eyebrow">Before you sign</div>
<h3 style="margin:6px 0">Free estimate → $${AUDIT_PRICE} full audit</h3>
<ol class="sm">
<li><b>Free:</b> multi-step survey + conservative savings check, entirely in your browser.</li>
<li><b>$${AUDIT_PRICE} unlock:</b> ranked alternatives, levers capped at modeled lines, migration plan, Print/PDF — built for a renewal handoff.</li>
<li><b>Honest limits:</b> list prices, not your contract; vendors without public rates are listed separately, never as savings.</li>
</ol>
<p style="margin-top:12px"><a class="btn" href="../audit.html#wizard-anchor" data-grow="renewal-to-audit">Start free savings estimate →</a> <a class="btn ghost" href="../audit.html#price" data-grow="renewal-to-price">See $${AUDIT_PRICE} unlock</a></p>
</div>

${cta('Get told if Datadog changes list prices before your renewal','Weekly email when an observability pricing page changes, with the source link.','guide-dd-renewal','Subscribe free')}

<h2>FAQ</h2>
${faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}

${related([['cut-datadog-bill-without-migrating.html','Cut your Datadog bill without migrating'],['datadog-40-host-cost-worked-example.html','Datadog 40-host cost worked example'],['datadog-autoscaling-cost.html','Why autoscaling raises your Datadog bill'],['cut-datadog-bill.html','How to cut your Datadog bill'],['datadog-pricing.html','Datadog pricing (2026)'],['datadog-alternatives.html','Datadog alternatives (cheaper)'],['../audit.html','Observability Cost & Stack Audit'],['../vendors/datadog.html','Datadog vendor page'],['index.html','All guides']])}
${cite(`Datadog renewal cost-audit checklist. Datadog Estimated Usage Metrics + Plan & Usage docs; list prices checked ${CHK} (dataset ${DS||'n/a'}).`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:'Before your Datadog renewal',href:BASE+CLEAN}]),
    {'@context':'https://schema.org','@type':'Article',headline:'Before your Datadog renewal: cost audit checklist',description:desc,datePublished:PUBLISHED,dateModified:PUBLISHED,author:{'@id':BASE+'/#org'},publisher:{'@id':BASE+'/#org'},mainEntityOfPage:BASE+CLEAN,about:{'@type':'SoftwareApplication',name:'Datadog',url:SRC.pricing},citation:Object.values(SRC)},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ]);
  hubLinks.unshift(hub);
  return {file:SLUG};
}
