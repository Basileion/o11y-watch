// AI / agent observability meters guide (RT-20261031-119). Every printed rate comes from data/ai-meters.json
// (copied from vendor pages, checked date in the file). build.mjs guards printed rates against the data file.
export const SLUG='guides/ai-agent-observability-pricing-2026.html';
const usd=n=>'$'+(Math.round(n*100)/100).toLocaleString('en-US',{minimumFractionDigits:Number.isInteger(Math.round(n*100)/100)?0:2,maximumFractionDigits:2});
export function exampleCalc(D){
  const E=D.example,M=Object.fromEntries(D.meters.map(m=>[m.id,m]));
  const calls=E.model_calls_mo,spans=calls*E.llm_spans_per_call,tok=calls*E.input_tokens_per_call;
  const g=M['grafana-agent-obs'],dd=M['datadog-agent-obs'],ag=M['datadog-ai-guard'],sp=M['splunk-agent-obs'],dt=M['dynatrace-ai-units'];
  const gFree=30000;
  const rows=[
    [g,`(${calls.toLocaleString('en-US')} − ${gFree.toLocaleString('en-US')} free generations) ÷ 1,000 × ${usd(g.price)}`,Math.max(0,calls-gFree)/g.per*g.price,'Plus $19/mo Pro platform fee and telemetry at standard rates'],
    [dd,`${usd(dd.price)} for the first 100k LLM spans + ${Math.ceil(Math.max(0,spans-dd.per)/dd.step_per)} × ${usd(dd.step_price)} per 10K`,dd.price+Math.ceil(Math.max(0,spans-dd.per)/dd.step_per)*dd.step_price,'Annual list, 15-day retention; we did not apply the "40k LLM spans are free" footnote because the list does not say how it combines with the $160 tier'],
    [ag,`${(tok/1e6).toLocaleString('en-US')}M input tokens × ${usd(ag.price)} per 1M`,tok/ag.per*ag.price,'Only if every call is sent to AI Guard; a security product, not tracing'],
    [sp,`${(spans*12/1e6).toLocaleString('en-US')}M spans a year ÷ 1.2M = ${Math.ceil(spans*12/sp.per)} packages × ${usd(sp.price)}/mo`,Math.ceil(spans*12/sp.per)*sp.price,'Billed annually'],
    [dt,`${E.dynatrace_investigations_mo} autonomous investigations × 30 AI units (Dynatrace's average) × ${usd(dt.price)}`,E.dynatrace_investigations_mo*30*dt.price,'Different job: Dynatrace\'s own AI investigating your telemetry. Not billed if run directly in Dynatrace Assist while the limited-time inclusion lasts'],
  ];
  return {calls,spans,tok,rows};
}
export default function aiMetersGuide({D,P,BASE,SITE,esc,crumbs,crumbLd,ORG,auditCta,cta,cite,related,hubLinks}){
  const CHK=D.checked,M=D.meters,L=(u,t)=>`<a href="${u}" rel="nofollow noopener">${esc(t)}</a>`;
  const byId=Object.fromEntries(M.map(m=>[m.id,m]));
  const g=byId['grafana-agent-obs'],dd=byId['datadog-agent-obs'],ag=byId['datadog-ai-guard'],sp=byId['splunk-agent-obs'],dt=byId['dynatrace-ai-units'],ga=byId['grafana-assistant'],cf=byId['cloudflare-observability'];
  const eff=m=>m.effective?esc(m.effective):'Not published';
  const rate=m=>`<span data-rate="${m.id}" data-price="${m.price}">${esc(m.price_display)}</span>`;
  const row=m=>`<tr><td><b>${esc(m.vendor)}</b><div class="sm">${esc(m.product)}</div></td><td class="sm" data-l="Unit">${esc(m.unit)}</td><td class="sm" data-l="Free">${esc(m.free)}</td><td data-l="Price">${rate(m)}<div class="sm mut">${esc(m.extra)}</div></td><td class="sm" data-l="Effective">${eff(m)}<div class="sm mut">${esc(m.effective_note)}</div></td><td class="sm" data-l="Source">${L(m.source,new URL(m.source).host.replace(/^www\./,''))}${m.source2?' · '+L(m.source2,'2nd source'):''}</td></tr>`;
  const table=(ms)=>`<div class="tw"><table class="aim"><thead><tr><th>Vendor / product</th><th>Billing unit</th><th>Free allowance</th><th>List price</th><th>Effective</th><th>Source</th></tr></thead><tbody>${ms.map(row).join('')}</tbody></table></div>`;
  const X=exampleCalc(D);
  const title=`AI agent observability pricing 2026: Grafana, Datadog, Splunk, Dynatrace, Cloudflare | ${SITE}`;
  const desc=`AI and agent observability meters compared from vendor pages read ${CHK}: Grafana ${g.price_display}, Datadog Agent Observability and AI Guard, Splunk ${sp.price_display}, Dynatrace ${dt.price_display}, plus Grafana Assistant and Cloudflare changes on 2026-12-01.`;
  const answer=`As of ${CHK}, AI agent observability is billed on new meters: Grafana Cloud charges ${g.price_display} after ${g.free.split(';')[0]} (billing started ${g.effective}); Datadog Agent Observability is ${dd.price_display}, and Datadog AI Guard is ${ag.price_display}; Splunk Agent Observability is ${sp.price_display}; Dynatrace Agentic Operations is ${dt.price_display}. Two changes land on 2026-12-01: Grafana Assistant Watchers start drawing billable tokens, and Cloudflare moves Workers Observability to ${cf.price_display}.`;
  const faq=[
    ['How much does AI agent observability cost in 2026?',answer],
    ['What is a "generation" in Grafana Agent Observability?',`One call to an AI model made by your monitored agent or application. One agent task can produce several generations. Grafana bills ${g.price_display} beyond ${g.free.split(';')[0]}, from ${g.effective}; Evals & Guards tokens and telemetry are separate meters (${g.source2}).`],
    ['Is Datadog AI Guard the same as Datadog Agent Observability?',`No. Agent Observability bills LLM spans (${dd.price_display}). AI Guard is a runtime security product billed on input tokens scanned (${ag.price_display}; ${ag.extra}).`],
    ['What changes on December 1, 2026?',`Grafana Assistant Watchers move from free to token billing (${ga.price_display}; Watchers draw from the shared system-initiated pool). Cloudflare Workers Observability moves to ${cf.price_display} with ${cf.free.split(';')[0]}.`],
    ['Why do some rows say "Not published" for the effective date?','Datadog, Splunk and Dynatrace list these prices on their pages but do not state when they took effect. We only print dates the vendor states.'],
  ];
  const hub=[SLUG,'AI agent observability pricing (2026)',`Grafana generations, Datadog LLM spans + AI Guard, Splunk, Dynatrace AI units, Cloudflare Dec 1. Vendor pages read ${CHK}.`];
  P(SLUG,title,desc,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:'AI agent observability pricing'}])}
<style>@media(max-width:640px){table.aim thead{display:none}table.aim,table.aim tbody,table.aim tr,table.aim td{display:block;width:auto}table.aim tr{border-bottom:1px solid rgba(127,127,127,.25);padding:10px 0}table.aim td{border:0;padding:2px 0}table.aim td[data-l]::before{content:attr(data-l) ": ";font-weight:600;opacity:.7}}</style>
<div class="eyebrow">Prices checked ${esc(CHK)} · vendor pages only</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">AI agent observability pricing (2026)</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:760px"><b>Answer (${esc(CHK)}):</b> ${esc(answer)}</p>
<p class="sm mut">Prices checked ${esc(CHK)} on each vendor's own page (linked in every row). List prices, not quotes. Your contract may differ.</p>

<h2 id="observe">Meters for observing your own agents</h2>
${table(M.filter(m=>m.group==='observe'))}

<h2 id="vendor-ai">Meters for the vendor's own AI agents</h2>
<p class="sm mut">Different job: these bill the AI that the observability vendor runs on your telemetry (investigations, chat, watchers), not the tracing of your agents.</p>
${table(M.filter(m=>m.group==='vendor_ai'))}

<h2 id="platform">Platform logs and traces</h2>
${table(M.filter(m=>m.group==='platform'))}

<h2 id="example">Example calculation (example inputs, not data)</h2>
<p class="sm"><b>Example inputs, made up to show the math:</b> an agent app making ${X.calls.toLocaleString('en-US')} model calls a month, assumed to be 1 LLM span per call and ${D.example.input_tokens_per_call.toLocaleString('en-US')} input tokens per call; for Dynatrace, ${D.example.dynatrace_investigations_mo} autonomous investigations a month run through workflows or the API. Real agents often emit several spans per call, which raises the span-based rows.</p>
<div class="tw"><table class="aim"><thead><tr><th>Meter</th><th>Math (list price)</th><th>$/mo</th><th>Notes</th></tr></thead><tbody>${X.rows.map(([m,math,v,n])=>`<tr><td><b>${esc(m.vendor)}</b><div class="sm">${esc(m.product)}</div></td><td class="sm" data-l="Math">${esc(math)}</td><td data-ex="${m.id}" data-v="${Math.round(v*100)/100}">${usd(v)}</td><td class="sm mut">${esc(n)}</td></tr>`).join('')}</tbody></table></div>
<p class="sm mut">These rows meter different things, so they are not a ranking. Add your normal APM, logs and metrics bill on top.</p>

${auditCta('Your AI meters sit on top of your normal APM, logs and metrics bill. Price that part line by line, free, in your browser.','Price the rest of your observability bill in 2 minutes','audit-guide-ai-meters')}

<h2 id="upcoming">Upcoming changes</h2>
<ul>
<li><b>${esc(ga.effective)} · Grafana Cloud:</b> Assistant Watchers move from free to token billing (${esc(ga.price_display)}; Watcher runs and calibration draw from the shared ${esc('25M tokens/mo')} system-initiated pool first). ${L(ga.source,'Grafana docs')}</li>
<li><b>${esc(cf.effective)} · Cloudflare:</b> Workers Observability moves to ${rate(cf)} for Paid accounts (${esc(cf.free.split(';')[0])}); Enterprise moves at contract renewal. ${L(cf.source,'Cloudflare docs')}</li>
</ul>
${cta('Get told before these hit your invoice','Weekly email when an observability pricing page changes, with the source link. Dec 1 changes included.','guide-ai-meters','Subscribe free')}

<h2>FAQ</h2>
${faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}

${related([['cut-datadog-bill-without-migrating.html','Cut your Datadog bill without migrating'],['datadog-pricing.html','Datadog pricing (2026)'],['grafana-pricing.html','Grafana Cloud pricing (2026)'],['../vendors/grafana.html','Grafana Cloud vendor page'],['../vendors/datadog.html','Datadog vendor page'],['../vendors/splunk.html','Splunk vendor page'],['../vendors/dynatrace.html','Dynatrace vendor page'],['../changes.html','Change log'],['index.html','All guides']])}
${cite(`AI agent observability meters, vendor pages read ${CHK}`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:'AI agent observability pricing',href:BASE+'/guides/ai-agent-observability-pricing-2026'}]),
    {'@context':'https://schema.org','@type':'Article',headline:'AI agent observability pricing (2026)',description:desc,datePublished:CHK,dateModified:CHK,author:{'@id':BASE+'/#org'},publisher:{'@id':BASE+'/#org'},mainEntityOfPage:BASE+'/guides/ai-agent-observability-pricing-2026',citation:[...new Set(M.flatMap(m=>[m.source,m.source2].filter(Boolean)))]},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ]);
  hubLinks.unshift(hub);
  return {file:SLUG};
}
