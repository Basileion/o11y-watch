// Public 40-host Datadog worked example (ACT-20261107-10 / RT-20261107-23).
// Every $ figure is computed by the same audit engine against data/audit-rates.json.
// EXAMPLE inputs only (RT-77 / 40-host APM+logs preset). build.mjs guards printed
// line items + $4,230 total against a recomputation.
import O11yAudit from '../assets/js/audit-engine.js';

export const SLUG='guides/datadog-40-host-cost-worked-example.html';
export const CLEAN='/guides/datadog-40-host-cost-worked-example';
export const PUBLISHED='2026-11-07';

// RT-77 / 40-host APM+logs $8,000 preset used by build.mjs guards. EXAMPLE inputs, not a customer.
export const EXAMPLE_INPUT={
  vendors:['datadog'],
  primary_vendor:'datadog',
  plans:'APM, infrastructure, logs',
  monthly_spend:8000,
  hosts:40,
  log_gb_day:30,
  metric_series:50000,
  spans_mo:2e8,
  users:30,
  retention_days:15,
  team_size:'21-50',
  priority:'balanced',
  compliance:['none']
};

export const EXPECTED={
  infra:600,      // 40 × $15
  apm:1240,       // 40 × $31
  logs:90,        // 900 GB × $0.10
  metrics:2300,   // 46,000 × $5/100
  modeled:4230,
  stated:8000
};

const CONF={high:'High',medium:'Medium',low:'Low',none:'None'};

export function runExample(RJ,eng=O11yAudit){
  const report=eng.runAudit(EXAMPLE_INPUT,RJ);
  const lines=report.current.lines||[];
  const byDim=id=>lines.find(l=>l.dim===id||l.product===id);
  const infra=byDim('hosts');
  const apm=lines.find(l=>l.product==='apm');
  const logs=lines.find(l=>l.product==='log_ingest'||(l.dim==='logs'&&!l.product));
  const metrics=lines.find(l=>l.product==='custom_metrics');
  const modeled=report.current.modeled_total||report.current.total;
  const saas=(report.ranked||[]).filter(r=>r.kind==='saas');
  const insuf=report.insufficient_pricing||[];
  const levers=report.levers||[];
  return {report,lines,infra,apm,logs,metrics,modeled,saas,insuf,levers,
    ddChecked:RJ.vendors.datadog.checked,
    datasetChecked:RJ.dataset_checked||RJ.checked||''};
}

export default function workedExampleGuide({RJ,P,BASE,SITE,esc,crumbs,crumbLd,ORG,auditCta,cta,cite,related,hubLinks,AUDIT_PRICE=149,AUDIT_CHECKOUT='https://o11y-watch.kit.com/products/observability-cost-stack-audit-instant'}){
  const X=runExample(RJ);
  const money=O11yAudit.money;
  const DD=RJ.vendors.datadog,R=DD.rates,PR=R.products;
  const CHK=X.ddChecked,DS=X.datasetChecked;
  const title=`Datadog 40-host cost worked example (2026): $${EXPECTED.modeled.toLocaleString('en-US')} modeled of $8,000 | ${SITE}`;
  const desc=`EXAMPLE inputs: Datadog, 40 hosts with APM, 30 GB/day logs, 50k custom metrics, stated bill $8,000/mo. Public list prices explain $${EXPECTED.modeled.toLocaleString('en-US')}/mo (Infrastructure $${EXPECTED.infra}, APM $${EXPECTED.apm}, logs $${EXPECTED.logs}, custom metrics $${EXPECTED.metrics}). Ranked SaaS alternatives + cleanup levers from the same audit engine. Datadog rates checked ${CHK}.`;
  const answer=`On EXAMPLE inputs (40 Datadog hosts with APM on every host, 30 GB/day of logs, 50,000 custom metrics, stated bill $8,000/mo), public list prices in our dataset explain $${EXPECTED.modeled.toLocaleString('en-US')}/mo: Infrastructure $${EXPECTED.infra} (40×$${R.host_mo_annual}), APM $${EXPECTED.apm} (40×$${PR.apm_host_mo_annual}), log ingestion $${EXPECTED.logs}, custom metrics $${EXPECTED.metrics}. The remaining $${(EXPECTED.stated-EXPECTED.modeled).toLocaleString('en-US')}/mo is not explained by those public lines (contract discounts, seats, indexed events, containers/Fargate, or other SKUs). Datadog product rates were re-checked ${CHK}; the audit dataset date is ${DS||'see audit-rates.json'}.`;
  const faq=[
    ['How much does Datadog cost for 40 hosts with APM and logs?',answer],
    ['Why is the modeled total lower than the $8,000 stated bill?',`Public list prices for Infrastructure, APM, ingested logs and custom metrics add to $${EXPECTED.modeled.toLocaleString('en-US')}/mo on these EXAMPLE inputs. The gap of $${(EXPECTED.stated-EXPECTED.modeled).toLocaleString('en-US')}/mo is whatever your invoice includes that those four lines do not: negotiated rates, indexed log/span events, containers or Fargate, Continuous Profiler, Synthetics, seats, support, or other add-ons. The audit never invents a rate to close that gap.`],
    ['Are the alternative vendors cheaper than Datadog here?',`On the same EXAMPLE usage, the engine prices several SaaS vendors below the $${EXPECTED.modeled.toLocaleString('en-US')} modeled Datadog total — but most land at Low or Medium confidence because public rates fold metrics/traces into GB or miss a dimension you use. Vendors missing public rates for a used dimension are listed under “Insufficient public pricing data”, never as savings. Re-run the free audit with your numbers before deciding.`],
    ['What is free vs the $'+AUDIT_PRICE+' audit?',`This page is a free, citable worked EXAMPLE with named line items. The free /audit teaser gives a conservative savings check on your inputs. The $${AUDIT_PRICE} full report unlocks your ranked alternatives (with real vendor names), cleanup levers capped at modeled lines, a migration plan, and Print/PDF. Refunds are handled case by case (see /audit#refund).`],
    ['Do autoscaling peaks change this math?',`Yes. Datadog bills hosts on the high-water mark of the lower 99% of hourly counts, so a repeating HPA peak can set the month's host count above 40. See the companion guide on autoscaling and Datadog host billing.`],
  ];
  const hub=[SLUG,'Datadog 40-host cost worked example',`EXAMPLE: 40 hosts + APM + logs + 50k custom metrics → $${EXPECTED.modeled.toLocaleString('en-US')} modeled of $8,000. Named SaaS alternatives + levers. Rates checked ${CHK}.`];

  const lineRows=[
    {id:'infra',label:X.infra?.label||`Infrastructure (40 hosts × $${R.host_mo_annual}/mo)`,amount:X.infra?.amount??EXPECTED.infra,rateId:'dd-host-annual',rate:R.host_mo_annual},
    {id:'apm',label:X.apm?.label||`APM (40 APM hosts × $${PR.apm_host_mo_annual}/mo)`,amount:X.apm?.amount??EXPECTED.apm,rateId:'dd-apm-annual',rate:PR.apm_host_mo_annual},
    {id:'logs',label:X.logs?.label||'Log ingestion',amount:X.logs?.amount??EXPECTED.logs,rateId:'dd-log-ingest',rate:PR.log_ingest_gb},
    {id:'metrics',label:X.metrics?.label||'Custom metrics',amount:X.metrics?.amount??EXPECTED.metrics,rateId:'dd-custom-metrics',rate:PR.custom_metrics_per_100},
  ];

  const linesTable=`<div class="tw"><table class="wex"><thead><tr><th>Line (public list price)</th><th>Modeled $/mo</th></tr></thead><tbody>
${lineRows.map(r=>`<tr data-line="${r.id}" data-v="${r.amount}"><td class="sm" data-l="Line">${esc(r.label)}${r.rate!=null?` <span class="mut">(<span data-rate="${r.rateId}" data-price="${r.rate}">${money(r.rate)}</span>)</span>`:''}</td><td data-l="Modeled"><b>${money(r.amount)}</b></td></tr>`).join('')}
<tr data-line="modeled" data-v="${X.modeled}"><td><b>Public list prices explain</b></td><td><b data-ex="modeled-total" data-v="${X.modeled}">${money(X.modeled)}</b> of ${money(EXPECTED.stated)}</td></tr>
</tbody></table></div>`;

  const altsTable=`<div class="tw"><table class="wex"><thead><tr><th>#</th><th>Vendor</th><th>Est. $/mo</th><th>Confidence</th><th>Checked</th></tr></thead><tbody>
${X.saas.map((a,i)=>`<tr data-alt="${esc(a.id)}" data-v="${a.monthly}" data-conf="${esc(a.confidence)}"><td data-l="#">${i+1}</td><td data-l="Vendor"><b>${esc(a.name)}</b></td><td data-l="Est. $/mo">${money(a.monthly)}</td><td data-l="Confidence">${esc(CONF[a.confidence]||a.confidence)}</td><td class="sm" data-l="Checked">${esc(a.checked||'—')}</td></tr>`).join('')}
</tbody></table></div>`;

  const insufBlock=X.insuf.length?`<h3 id="insufficient" style="font-size:16px;margin-top:18px">Insufficient public pricing data</h3>
<p class="sm mut">These vendors are in the dataset but lack a public unit rate for at least one dimension this EXAMPLE uses, so they are <b>not</b> shown as savings:</p>
<ul>${X.insuf.map(a=>`<li data-insuf="${esc(a.id)}"><b>${esc(a.name)}</b> — ${esc(a.reason||'missing public rates')}${a.checked?` <span class="mut">(checked ${esc(a.checked)})</span>`:''}</li>`).join('')}</ul>`:'';

  const leversTable=`<div class="tw"><table class="wex"><thead><tr><th>Lever</th><th>Est. save</th><th>Sized against</th></tr></thead><tbody>
${X.levers.map(l=>`<tr data-lever="${esc(l.id)}" data-v="${l.sized?l.estimated_save_mo:'unsized'}"><td data-l="Lever"><b>${esc(l.name)}</b><div class="sm mut">${esc(l.description||'')}</div></td><td data-l="Est. save">${l.sized?money(l.estimated_save_mo)+'/mo':'<b>Not sized</b>'}</td><td class="sm" data-l="Sized against">${esc(l.basis_label||'')}</td></tr>`).join('')}
</tbody></table></div>`;

  P(SLUG,title,desc,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:'Datadog 40-host worked example'}])}
<style>.wex td,.wex th{vertical-align:top}@media(max-width:640px){table.wex thead{display:none}table.wex,table.wex tbody,table.wex tr,table.wex td{display:block;width:auto}table.wex tr{border-bottom:1px solid rgba(127,127,127,.25);padding:10px 0}table.wex td{border:0;padding:2px 0}table.wex td[data-l]::before{content:attr(data-l) ": ";font-weight:600;opacity:.7}}</style>
<div class="eyebrow">EXAMPLE · rates checked ${esc(CHK)} · dataset ${esc(DS||'—')}</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">Datadog 40-host cost worked example</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:760px"><b>Answer (${esc(CHK)}):</b> ${esc(answer)}</p>
<p class="sm mut"><b>EXAMPLE inputs, not a customer:</b> Datadog · ${EXAMPLE_INPUT.hosts} hosts with APM on every host · ${EXAMPLE_INPUT.log_gb_day} GB/day logs · ${EXAMPLE_INPUT.metric_series.toLocaleString('en-US')} custom metrics · ${EXAMPLE_INPUT.spans_mo.toLocaleString('en-US')} spans/mo · ${EXAMPLE_INPUT.users} users · 15-day retention · stated bill ${money(EXPECTED.stated)}/mo. Numbers below are what our audit engine computes from public list prices in <code>data/audit-rates.json</code> (Datadog products checked ${esc(CHK)}; dataset_checked ${esc(DS||'—')}). Your contract may differ.</p>

<h2 id="line-items">1 · Modeled Datadog cost (line by line)</h2>
${linesTable}
<p class="sm mut">Infrastructure uses Datadog Infrastructure Pro annual list (${money(R.host_mo_annual)}/host/mo). APM uses APM host annual list (${money(PR.apm_host_mo_annual)}/APM host/mo), assuming every host runs APM. Log ingestion and custom metrics use the public per-GB and per-100-series rates. Ingested-span overage is $0 here because ${EXAMPLE_INPUT.spans_mo/1e6}M spans ≈ 100 GB against 6,000 GB included with 40 APM hosts.</p>

<h2 id="alternatives">2 · Ranked SaaS alternatives (same EXAMPLE usage)</h2>
<p class="sm">Same engine run, real vendor names. Confidence reflects coverage: High means public rates cover every dimension you use; Medium/Low means folds, assumptions, or a large gap vs the stated bill. Ranked by estimated $/mo.</p>
${altsTable}
${insufBlock}
<p class="sm mut">These are list-price estimates on EXAMPLE inputs, not quotes and not a feature comparison. Re-price on <a href="../audit.html" data-grow="audit-guide-40host-alts">your numbers</a> before deciding.</p>

<h2 id="levers">3 · Cleanup levers (capped at modeled lines)</h2>
<p class="sm">Same rules as <a href="../audit.html">/audit</a>: each lever is a rule-of-thumb % of the modeled line it reduces, never of the $8,000 stated bill. If the matching line is $0 or missing, the lever is marked Not sized.</p>
${leversTable}
<p class="sm mut">Custom metrics are the biggest modeled line here (${money(EXPECTED.metrics)}/mo) but the engine has no dedicated metrics-cleanup lever yet. For a Datadog-side checklist (unqueried series, Metrics without Limits), see <a href="cut-datadog-bill-without-migrating.html">Cut your Datadog bill without migrating</a>.</p>

<h2 id="why-149">4 · Why pay $${AUDIT_PRICE}?</h2>
<div class="card">
<ul>
<li><b>This free page</b> is a citable worked EXAMPLE with fixed inputs, so rivals that already show line-item math no longer beat us on transparency for the audit offer.</li>
<li><b>The free /audit teaser</b> runs on <em>your</em> hosts, GB, series and seats, and only shows a dollar figure when a high-confidence SaaS option lands below your bill.</li>
<li><b>The $${AUDIT_PRICE} full report</b> unlocks your ranked alternatives (real names), levers capped at modeled lines, a migration plan with effort ratings, and Print/PDF — the handoff for a budget review.</li>
<li><b>Refunds:</b> case by case (and any rights your local consumer law gives you). See <a href="../audit.html#refund">/audit#refund</a>.</li>
</ul>
<p style="margin-top:12px"><a class="btn" href="../audit.html#sample-report" data-grow="40host-to-sample">See the sample report →</a> <a class="btn ghost" href="../audit.html#wizard-anchor" data-grow="40host-to-audit">Run free estimate on your numbers</a> <a class="btn ghost" href="${esc(AUDIT_CHECKOUT)}" rel="noopener" data-grow="40host-to-kit">Unlock full report · $${AUDIT_PRICE}</a></p>
</div>

<p class="sm" style="margin-top:18px"><b>Autoscaling?</b> If your host count spikes on HPA or nightly batches, the billed host count can sit above 40. Read <a href="datadog-autoscaling-cost.html" data-grow="40host-to-autoscaling">why autoscaling raises your Datadog bill</a> (99th-percentile host billing, containers, Fargate, hybrid hourly plan).</p>

${auditCta('Put your real host count, APM hosts, logs, custom metrics and bill into the same engine. Free teaser; full report $'+AUDIT_PRICE+'.','Price your stack in 2 minutes','audit-guide-40host')}

<h2>FAQ</h2>
${faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}

${related([['datadog-autoscaling-cost.html','Why autoscaling raises your Datadog bill'],['cut-datadog-bill-without-migrating.html','Cut your Datadog bill without migrating'],['cut-datadog-bill.html','How to cut your Datadog bill'],['datadog-cost-calculator.html','Datadog cost calculator'],['datadog-pricing.html','Datadog pricing (2026)'],['datadog-alternatives.html','Datadog alternatives (cheaper)'],['../audit.html','Observability Cost & Stack Audit'],['../vendors/datadog.html','Datadog vendor page'],['index.html','All guides']])}
${cite(`Datadog 40-host cost worked example (EXAMPLE inputs). Datadog list prices checked ${CHK}; audit dataset ${DS||'n/a'}. Engine totals from O11y Watch public audit-rates.`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:'Datadog 40-host worked example',href:BASE+CLEAN}]),
    {'@context':'https://schema.org','@type':'Article',headline:'Datadog 40-host cost worked example',description:desc,datePublished:PUBLISHED,dateModified:PUBLISHED,author:{'@id':BASE+'/#org'},publisher:{'@id':BASE+'/#org'},mainEntityOfPage:BASE+CLEAN,about:{'@type':'SoftwareApplication',name:'Datadog',url:'https://www.datadoghq.com/pricing/'}},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ]);
  hubLinks.unshift(hub);
  return {file:SLUG,modeled:X.modeled,saas:X.saas.length,insuf:X.insuf.length,levers:X.levers.length};
}
