// Programmatic SEO + GEO flywheel pages for O11y Watch. Called from build.mjs.
// Only cites fields from vendors.json / changes.json — never invents numbers.
import {parsePrice,compareLower,UNIT_LABEL} from './units.inc.mjs';
export default function flywheel({V, C, TAKES, changes, W, P, BASE, SITE, esc, form, cta, pill, proBox, auditCta:auditCtaIn, files, nVer, nFree, LAST, fs, path, out, AUDIT_PRICE=149}){
const AUDIT=`${BASE}/audit.html`;
const ORG={
  '@context':'https://schema.org','@type':'Organization','@id':BASE+'/#org',
  name:SITE,url:BASE+'/',
  logo:BASE+'/img/icon-192.png',
  email:'basileion.ops@gmail.com',
  sameAs:[
    'https://bsky.app/profile/o11ywatch.bsky.social',
    'https://github.com/Basileion/o11y-watch',
    'https://dev.to/o11ywatch'
  ]
};
const crumbs=(parts)=>`<nav class="crumbs" aria-label="Breadcrumb">${parts.map((p,i)=>i<parts.length-1?`<a href="${p.href}">${esc(p.label)}</a> / `:`<span>${esc(p.label)}</span>`).join('')}</nav>`;
const crumbLd=(parts)=>({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:parts.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.label,item:p.href.startsWith('http')?p.href:(BASE+'/'+p.href.replace(/^\.\.\//,'').replace(/^\//,''))}))});
const cite=(label)=>`<div class="box" style="margin-top:18px"><h3 style="margin-top:0">Cite this</h3><p class="sm mut">Copy for AI tools, writers and procurement docs. Attribution requested under CC BY 4.0.</p><pre style="white-space:pre-wrap;font-size:12px">${esc(`Data: ${label}. Source: ${SITE} (${BASE}). License: CC BY 4.0. Please attribute "${SITE}" with a link to ${BASE}/.`)}</pre></div>`;
const keyStats=(items)=>`<div class="box" style="margin:18px 0"><div class="eyebrow">Key stats</div><ul style="margin:10px 0 0;padding-left:18px">${items.map(([k,v])=>`<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('')}</ul></div>`;
const related=(links)=>`<h2>Related</h2><ul>${links.map(([h,l])=>`<li><a href="${h}">${esc(l)}</a></li>`).join('')}</ul>`;
const auditCta=(ctx,headline,grow='audit-guide')=>{
  if(typeof auditCtaIn==='function'){
    return auditCtaIn(headline||'See what you’d save on Datadog / New Relic in 2 minutes',esc(ctx),grow,'../');
  }
  return `<section class="cta" style="margin-top:28px"><div class="eyebrow">Free savings estimate · 2 minutes</div><h3 style="margin:6px 0">${esc(headline||'See what you’d save on Datadog / New Relic in 2 minutes')}</h3><p>${esc(ctx)} Free conservative savings check; full report $${AUDIT_PRICE}.</p><p><a class="btn" href="../audit.html" data-grow="${grow}">Start free savings estimate →</a> <a class="btn ghost" href="../subscribe.html?src=guide">Get the weekly newsletter</a></p></section>`;
};
const byId=id=>V.find(v=>v.id===id);
const verified=V.filter(v=>v.verified);

// ---- Comparison pairs (only where both vendors exist in dataset)
const PAIRS=[
  ['datadog','newrelic'],
  ['datadog','grafana'],
  ['datadog','dynatrace'],
  ['newrelic','grafana'],
  ['datadog','honeycomb'],
  ['sentry','honeybadger'],
  ['sentry','rollbar'],
  ['sentry','bugsnag'],
  ['sentry','glitchtip'],
  ['axiom','coralogix'],
  ['pagerduty','incidentio'],
  ['langfuse','helicone'],
  ['groundcover','datadog'],
  ['signoz','grafana'],
].map(([a,b])=>{const A=byId(a),B=byId(b);return A&&B?[A,B]:null}).filter(Boolean);

// ---- Vendor pricing explained pages (high-intent, verified only with enough fields)
const PRICING_IDS=['datadog','newrelic','grafana','sentry','dynatrace','honeycomb','axiom','pagerduty','groundcover','signoz','elastic','posthog','uptimerobot','langfuse','betterstack','coralogix','helicone','glitchtip','honeybadger','checkly','incidentio','middleware','uptrace','dash0','observe','openobserve','appsignal','healthchecks','statuscake','splunk','rollbar','bugsnag','scoutapm','rootly','langsmith','braintrust','arize','opik','portkey','wandb','oneuptime','firehydrant','zenduty','hyperping','cronitor','papertrail','sematext','loggly','airbrake','trackjs','bugsink','exceptionless','site24x7','openstatus','ilert','squadcast','statuspage','statusgator','laminar','lunary','ohdear'];
const pricingVendors=PRICING_IDS.map(byId).filter(v=>v&&v.verified);

// ---- Hub
const hubLinks=[];
const hubBodyParts=[];

function answerPricing(v){
  const free=v.has_free_tier
    ? `${v.name} lists a free plan (${v.free_plan||'Free'}): ${v.free_tier}`
    : `${v.name} does not list a free plan in our snapshot — ${v.free_tier||'trial / paid only'}`;
  const paid=v.paid_from&&v.paid_from!=='not stated'
    ? ` Paid entry is stated as ${v.paid_from}.`
    : ` Paid entry price is not stated on the pricing page we checked.`;
  const model=v.pricing_model&&v.pricing_model!=='not stated'?` Billing model: ${v.pricing_model}.`:'';
  return `${free}.${paid}${model} Last verified ${v.checked} from the vendor’s own pricing page.`;
}

for(const v of pricingVendors){
  const file=`guides/${v.id}-pricing.html`;
  const title=`${v.name} pricing (2026) — free tier, paid entry & gotchas | ${SITE}`;
  const desc=`${v.name} pricing explained from the vendor’s own page (checked ${v.checked}): free tier, paid_from, billing model and gotchas.`;
  const answer=answerPricing(v);
  const faq=[
    [`Does ${v.name} have a free tier?`, v.has_free_tier?`Yes. ${v.free_plan||'Free'}: ${v.free_tier}`:`No free plan is stated. ${v.free_tier||'Trial / paid only.'}`],
    [`What is ${v.name}’s paid entry price?`, v.paid_from||'not stated on the pricing page we checked'],
    [`How does ${v.name} bill?`, v.pricing_model||'not stated'],
    ['Where does this data come from?',`Copied from ${v.url} on ${v.checked}. We never invent numbers. See methodology on /about.html.`],
  ];
  const alts=C[v.cat].vs.filter(x=>x.id!==v.id&&x.verified).slice(0,5);
  const parts=[
    {href:'../index.html',label:'Home'},
    {href:'index.html',label:'Guides'},
    {href:file.split('/').pop(),label:`${v.name} pricing`}
  ];
  const table=`<div class="tw"><table><thead><tr><th>Field</th><th>Value (as recorded)</th></tr></thead><tbody>
<tr><td>Free plan</td><td>${esc(v.free_plan||(v.has_free_tier?'Free':'None'))}</td></tr>
<tr><td>Free tier limits</td><td>${esc(v.free_tier||'—')}</td></tr>
<tr><td>Paid from</td><td>${esc(v.paid_from||'not stated')}</td></tr>
<tr><td>Billing unit of entry price</td><td>${esc(UNIT_LABEL[parsePrice(v.paid_from)?.unit]||'not stated')}</td></tr>${v.apm_paid_from?`\n<tr><td>APM-comparable price</td><td>${esc(v.apm_paid_from)}</td></tr>`:''}
<tr><td>Pricing model</td><td>${esc(v.pricing_model||'not stated')}</td></tr>
<tr><td>Card required</td><td>${esc(v.card_required||'not stated')}</td></tr>
<tr><td>OSS / self-host</td><td>${esc(v.oss_self_host||'not stated')}</td></tr>
<tr><td>Last verified</td><td>${esc(v.checked)}</td></tr>
<tr><td>Source</td><td><a href="${esc(v.url)}" rel="nofollow noopener">Official pricing page ↗</a></td></tr>
</tbody></table></div>`;
  P(file,title,desc,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:`${v.name} pricing`}])}
<div class="eyebrow">Pricing explained · verified ${esc(v.checked)}</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">${esc(v.name)} pricing (2026)</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:720px"><b>Answer:</b> ${esc(answer)}</p>
${keyStats([
  ['Free tier', v.has_free_tier?`Yes — ${v.free_plan||'Free'}`:'No (trial / paid only)'],
  ['Free limits', v.free_tier||'—'],
  ['Paid from', v.paid_from||'not stated'],
  ['Last verified', v.checked],
  ['Source', v.url],
])}
<h2>Data table</h2>${table}
<h2>Gotchas we recorded</h2>${v.gotchas.length?`<ul>${v.gotchas.map(g=>`<li>${esc(g)}</li>`).join('')}</ul>`:`<p class="mut">None derived from the plan summary. Read the pricing page’s fine print.</p>`}
<h2>Alternatives in ${esc(C[v.cat].name)}</h2>
<div class="grid">${alts.map(a=>`<a class="card" href="../vendors/${a.id}.html"><h3>${esc(a.name)}</h3><p>${pill(a.free)} ${esc((a.free_tier||a.paid_from||'').slice(0,120))}</p></a>`).join('')}</div>
${related([
  [`../vendors/${v.id}.html`,`${v.name} free tier page`],
  [`${v.id}-alternatives.html`,`${v.name} alternatives (cheaper)`],
  ...((v.id==='datadog'||v.id==='newrelic'||v.id==='grafana')?[[`${v.id}-cost-calculator.html`,`${v.name} cost calculator`]]:[]),
  [`../category/${v.cat}.html`,`${C[v.cat].name} category`],
  ['../compare.html',`Interactive compare`],
  ['index.html','All pricing guides'],
])}
${auditCta(`Comparing ${v.name} against your actual usage?`,`See what you’d save on ${esc(v.name)} in 2 minutes`,'audit-guide-pricing-'+v.id)}
${cta(`Alert me when ${esc(v.name)} changes pricing`,`We re-check this pricing page weekly.`,'guide-'+v.id,'Subscribe free')}
${cite(`${v.name} pricing summary as of ${v.checked}`)}
${proBox('../',`Watch ${esc(v.name)} same-day`,`Pro emails within a day of a detected change plus CSV/JSON history.`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:`${v.name} pricing`,href:BASE+'/'+file}]),
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))},
    {'@context':'https://schema.org','@type':'WebPage',name:title,description:desc,url:BASE+'/'+file,dateModified:v.checked,isPartOf:{'@id':BASE+'/#website'},about:{'@type':'SoftwareApplication',name:v.name,url:v.url}}
  ]);
  hubLinks.push([file,`${v.name} pricing (2026)`,`Paid from ${v.paid_from||'not stated'}; free: ${v.has_free_tier?'yes':'no'}. Checked ${v.checked}.`]);
}

// ---- Comparisons
for(const [A,B] of PAIRS){
  const slug=`${A.id}-vs-${B.id}`;
  const file=`guides/${slug}.html`;
  const title=`${A.name} vs ${B.name} cost (2026) — free tiers & paid entry | ${SITE}`;
  const desc=`${A.name} vs ${B.name}: free tiers, paid entry prices and billing models from each vendor’s pricing page (checked ${A.checked} / ${B.checked}).`;
  const answer=`As of ${A.checked}, ${A.name} ${A.has_free_tier?`offers a free plan (${A.free_tier})`:`has no free plan (${A.free_tier})`} and states paid entry as ${A.paid_from||'not stated'}; ${B.name} ${B.has_free_tier?`offers a free plan (${B.free_tier})`:`has no free plan (${B.free_tier})`} and states paid entry as ${B.paid_from||'not stated'}. Numbers are copied from each vendor’s own pricing page — we do not invent unit rates.`;
  const faq=[
    [`Which is cheaper, ${A.name} or ${B.name}?`, `We do not invent a blended bill. Compare stated free limits and paid_from: ${A.name} paid_from=${A.paid_from||'not stated'}; ${B.name} paid_from=${B.paid_from||'not stated'}. Run the free audit estimate for a usage-based view.`],
    [`Does ${A.name} have a free tier?`, A.has_free_tier?`Yes: ${A.free_tier}`:`No: ${A.free_tier}`],
    [`Does ${B.name} have a free tier?`, B.has_free_tier?`Yes: ${B.free_tier}`:`No: ${B.free_tier}`],
    ['Last verified?', `${A.name}: ${A.checked} (${A.url}). ${B.name}: ${B.checked} (${B.url}).`],
  ];
  const table=`<div class="tw"><table><thead><tr><th>Field</th><th>${esc(A.name)}</th><th>${esc(B.name)}</th></tr></thead><tbody>
${[['Category',C[A.cat]?.name||A.type,C[B.cat]?.name||B.type],
   ['Free plan',A.free_plan||(A.has_free_tier?'Free':'None'),B.free_plan||(B.has_free_tier?'Free':'None')],
   ['Free limits',A.free_tier||'—',B.free_tier||'—'],
   ['Paid from',A.paid_from||'not stated',B.paid_from||'not stated'],
   ['Pricing model',A.pricing_model||'not stated',B.pricing_model||'not stated'],
   ['Card required',A.card_required||'not stated',B.card_required||'not stated'],
   ['Last verified',A.checked,B.checked],
  ].map(([f,a,b])=>`<tr><th scope="row">${esc(f)}</th><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}
<tr><th scope="row">Source</th><td><a href="${esc(A.url)}" rel="nofollow">pricing ↗</a></td><td><a href="${esc(B.url)}" rel="nofollow">pricing ↗</a></td></tr>
</tbody></table></div>`;
  P(file,title,desc,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:`${A.name} vs ${B.name}`}])}
<div class="eyebrow">Cost comparison · last verified ${esc([A.checked,B.checked].sort().at(-1))}</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">${esc(A.name)} vs ${esc(B.name)} cost</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:760px"><b>Answer:</b> ${esc(answer)}</p>
${keyStats([
  [`${A.name} free`, A.has_free_tier?A.free_tier:'No free plan'],
  [`${A.name} paid from`, A.paid_from||'not stated'],
  [`${B.name} free`, B.has_free_tier?B.free_tier:'No free plan'],
  [`${B.name} paid from`, B.paid_from||'not stated'],
  ['Last verified', `${A.checked} / ${B.checked}`],
])}
<h2>Side-by-side data</h2>${table}
<h2>Gotchas</h2>
<div class="two"><div><h3>${esc(A.name)}</h3>${A.gotchas.length?`<ul>${A.gotchas.map(g=>`<li>${esc(g)}</li>`).join('')}</ul>`:'<p class="mut">None recorded.</p>'}</div>
<div><h3>${esc(B.name)}</h3>${B.gotchas.length?`<ul>${B.gotchas.map(g=>`<li>${esc(g)}</li>`).join('')}</ul>`:'<p class="mut">None recorded.</p>'}</div></div>
${related([
  [`${A.id}-pricing.html`,`${A.name} pricing (2026)`],
  [`${B.id}-pricing.html`,`${B.name} pricing (2026)`],
  [`../vendors/${A.id}.html`,`${A.name} vendor page`],
  [`../vendors/${B.id}.html`,`${B.name} vendor page`],
  [`../compare.html?v=${A.id},${B.id}`,'Interactive compare tool'],
])}
${auditCta(`Choosing between ${A.name} and ${B.name}?`,`See what you’d save switching stacks in 2 minutes`,'audit-guide-vs-'+A.id+'-'+B.id)}
${cta('Get weekly pricing-change alerts','When either vendor moves a free tier or price, we log it with a source.','guide-vs','Subscribe free')}
${cite(`${A.name} vs ${B.name} comparison as of ${[A.checked,B.checked].sort().at(-1)}`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:`${A.name} vs ${B.name}`,href:BASE+'/'+file}]),
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ]);
  hubLinks.push([file,`${A.name} vs ${B.name} cost`,`${A.name} paid_from ${A.paid_from||'n/s'}; ${B.name} paid_from ${B.paid_from||'n/s'}.`]);
}

// ---- Cheapest-in-category pages (free-tier presence + stated paid_from; no invented prices)
for(const c of Object.values(C)){
  const freeYes=c.vs.filter(v=>v.verified&&v.free==='yes');
  if(freeYes.length<2) continue;
  const pickId=TAKES[c.id]?.[0];
  const pick=byId(pickId)||freeYes[0];
  const file=`guides/cheapest-${c.id}.html`;
  const title=`Cheapest ${c.name} tools (2026) — verified free tiers | ${SITE}`;
  const desc=`Which ${c.name} tools list a free plan, with stated limits and paid entry prices from vendor pages (as of ${LAST}).`;
  const answer=`Among ${freeYes.length} verified ${c.name} vendors with a free plan in our dataset (checked through ${LAST}), our evidence-based free pick is ${pick.name}: ${pick.free_tier}. Paid entry for ${pick.name} is stated as ${pick.paid_from||'not stated'}. We rank by stated free-plan limits, not invented unit costs.`;
  const faq=[
    [`What is the cheapest ${c.name} tool?`, `${pick.name} is our free-tier pick for ${c.name}: ${pick.free_tier}. See the table for every verified free plan.`],
    ['How do you define cheapest?', 'We never invent a blended bill. This page lists verified free plans and each vendor’s stated paid_from. For usage-based savings, use the free audit estimate.'],
    ['Last verified?', `Vendor pages checked on the dates in the table; dataset last check ${LAST}.`],
  ];
  const rows=[...freeYes].sort((a,b)=>a.name.localeCompare(b.name)).map(v=>`<tr>
<td><a href="../vendors/${v.id}.html"><b>${esc(v.name)}</b></a>${v.id===pick.id?' <span class="pill p-yes">free pick</span>':''}</td>
<td class="sm">${esc(v.free_tier)}</td>
<td class="sm">${esc(v.paid_from||'not stated')}</td>
<td class="sm mut">${esc(v.checked)}</td>
<td class="sm"><a href="${esc(v.url)}" rel="nofollow">source</a></td></tr>`).join('');
  P(file,title,desc,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:`Cheapest ${c.name}`}])}
<div class="eyebrow">Category guide · dataset checked ${esc(LAST)}</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">Cheapest ${esc(c.name)} tools</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:760px"><b>Answer:</b> ${esc(answer)}</p>
${keyStats([
  ['Verified free plans in category', String(freeYes.length)],
  ['Free pick', `${pick.name} — ${pick.free_tier}`],
  ['Pick paid from', pick.paid_from||'not stated'],
  ['Last verified (pick)', pick.checked],
])}
<div class="box"><div class="eyebrow">Why this pick</div><p>${esc(TAKES[c.id][1])}</p><p class="sm mut">Based only on plan limits recorded from vendor pages.</p></div>
<h2>All verified free plans in ${esc(c.name)}</h2>
<div class="tw"><table><thead><tr><th>Vendor</th><th>Free limits</th><th>Paid from</th><th>Checked</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div>
${related([
  [`../category/${c.id}.html`,`${c.name} category hub`],
  [`${pick.id}-pricing.html`,`${pick.name} pricing (2026)`],
  ['index.html','All guides'],
])}
${auditCta(`Modeling ${c.name} spend across vendors?`,`See what you’d save on ${esc(c.name)} tools in 2 minutes`,'audit-guide-cheap-'+c.id)}
${cta(`Watch ${esc(c.name)} pricing weekly`,`When any of these free tiers shrink, we email you with the source.`,'guide-cheap-'+c.id,'Subscribe free')}
${cite(`Cheapest ${c.name} free tiers as of ${LAST}`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:`Cheapest ${c.name}`,href:BASE+'/'+file}]),
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ]);
  hubLinks.push([file,`Cheapest ${c.name}`,`Free pick: ${pick.name} (${pick.free_tier.slice(0,80)})`]);
}

// ---- Cut-your-bill guides (Datadog, New Relic) — facts only + alternatives + audit CTA
for(const id of ['datadog','newrelic']){
  const v=byId(id); if(!v) continue;
  const alts=C[v.cat].vs.filter(x=>x.id!==id&&x.verified).slice(0,8);
  const file=`guides/cut-${id}-bill.html`;
  const title=`How to cut your ${v.name} bill (2026) — limits, alternatives & audit | ${SITE}`;
  const desc=`Practical ways to reduce ${v.name} spend using stated free limits, paid_from, gotchas and verified alternatives. Data checked ${v.checked}.`;
  const answer=`${v.name} states paid entry as ${v.paid_from||'not stated'} with model “${v.pricing_model||'not stated'}”. Its free plan ${v.has_free_tier?`covers: ${v.free_tier}`:`is not offered (${v.free_tier})`}. Cut spend by staying inside stated free limits where possible, capping overages called out in gotchas, and comparing verified alternatives below — or run the free audit estimate on your real usage. Last verified ${v.checked}.`;
  const faq=[
    [`How do I lower my ${v.name} bill?`, answer],
    [`What are ${v.name}’s free limits?`, v.has_free_tier?v.free_tier:'No free plan stated.'],
    ['Will you invent a savings percentage?', 'No. We only cite recorded plan fields. The automated audit estimates from your inputs and published rates.'],
  ];
  P(file,title,desc,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:`Cut ${v.name} bill`}])}
<div class="eyebrow">Cost control guide · verified ${esc(v.checked)}</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">How to cut your ${esc(v.name)} bill</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:760px"><b>Answer:</b> ${esc(answer)}</p>
${keyStats([
  ['Paid from', v.paid_from||'not stated'],
  ['Pricing model', v.pricing_model||'not stated'],
  ['Free tier', v.has_free_tier?v.free_tier:'None'],
  ['Gotchas recorded', String(v.gotchas.length)],
  ['Last verified', v.checked],
  ['Source', v.url],
])}
<h2>What the pricing page actually says</h2>
<div class="tw"><table><thead><tr><th>Field</th><th>Recorded value</th></tr></thead><tbody>
<tr><td>Free plan</td><td>${esc(v.free_plan||(v.has_free_tier?'Free':'None'))}</td></tr>
<tr><td>Free limits</td><td>${esc(v.free_tier||'—')}</td></tr>
<tr><td>Paid from</td><td>${esc(v.paid_from||'not stated')}</td></tr>
<tr><td>Model</td><td>${esc(v.pricing_model||'not stated')}</td></tr>
</tbody></table></div>
<h2>Gotchas that drive spend</h2>
${v.gotchas.length?`<ul>${v.gotchas.map(g=>`<li>${esc(g)}</li>`).join('')}</ul>`:'<p class="mut">No mechanical gotchas derived yet — still read the vendor fine print for retention, seats and overages.</p>'}
<h2>Verified alternatives in ${esc(C[v.cat].name)}</h2>
<div class="tw"><table><thead><tr><th>Vendor</th><th>Free?</th><th>Free limits / notes</th><th>Paid from</th><th>Checked</th></tr></thead><tbody>
${alts.map(a=>`<tr><td><a href="../vendors/${a.id}.html">${esc(a.name)}</a></td><td>${pill(a.free)}</td><td class="sm">${esc(a.free_tier||'—')}</td><td class="sm">${esc(a.paid_from||'not stated')}</td><td class="sm mut">${esc(a.checked)}</td></tr>`).join('')}
</tbody></table></div>
<ol style="max-width:720px">
<li>Confirm you are still inside the free limits above before buying seats or hosts.</li>
<li>Compare paid_from against alternatives with a free plan in the same category.</li>
<li>Run the <a href="../audit.html">free audit estimate</a> with your host/GB/user counts — it uses the same rates dataset.</li>
<li><a href="../subscribe.html?src=cut-${id}">Subscribe</a> so you hear when ${esc(v.name)} changes limits.</li>
</ol>
${related([[`${id}-pricing.html`,`${v.name} pricing (2026)`],...(id==='datadog'?[['cut-datadog-bill-without-migrating.html','Cut your Datadog bill without migrating (cleanup checklist)']]:[]),[`../vendors/${id}.html`,`${v.name} vendor page`],['index.html','All guides']])}
${auditCta(`Ready to quantify ${v.name} savings on your numbers?`,`See what you’d save on ${esc(v.name)} in 2 minutes`,'audit-guide-cut-'+id)}
${cta(`Watch ${esc(v.name)} for price moves`,'Weekly email when the pricing page changes, with the source link.','guide-cut-'+id,'Subscribe free')}
${cite(`How to cut ${v.name} bill — facts as of ${v.checked}`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:`Cut ${v.name} bill`,href:BASE+'/'+file}]),
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ]);
  hubLinks.push([file,`How to cut your ${v.name} bill`,`Paid from ${v.paid_from||'n/s'}; free: ${v.has_free_tier?'yes':'no'}.`]);
}

// ---- Evergreen: cut Datadog bill WITHOUT migrating (RT-20261031-81, RT-20261031-35 partial).
// Every $ figure is computed from data/audit-rates.json (datadog.rates.products, re-read on datadoghq.com/pricing/list 2026-10-31).
{
  const RJ=JSON.parse(fs.readFileSync(path.join(path.dirname(out),'data','audit-rates.json'),'utf8'));
  const DDR=(RJ.vendors||RJ).datadog||(Array.isArray(RJ.vendors)?RJ.vendors.find(x=>x.id==='datadog'):null);
  const R=DDR.rates, PR=R.products, CHK=PR.checked||DDR.checked;
  const ON={host:18,apm:36,idx15:2.55,idx15m2m:2.04}; // on-demand / month-to-month list (datadoghq.com/pricing/list, read 2026-10-31)
  const usd=n=>'$'+(Math.round(n*100)/100).toLocaleString('en-US',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2});
  // Clearly-labelled EXAMPLE inputs (invented for illustration, not customer data, not an average).
  const EX={hosts:20,cm:6000,cmCut:1500,logGB:300,hcGB:30,idxM:400,hcM:100,apmHosts:10,spanGB:2500,spansM:30};
  const cmAllot=EX.hosts*PR.custom_metrics_allot_per_pro_host;
  const cmCost=c=>Math.max(0,Math.ceil((c-cmAllot)/100))*PR.custom_metrics_per_100;
  const i15=PR.indexed_logs_m['15'], i7=PR.indexed_logs_m['7'], i3=PR.indexed_logs_m['3'], i30=PR.indexed_logs_m['30'];
  const spanAllot=EX.apmHosts*PR.span_ingest_allot_gb_per_apm_host, spanIdxAllot=EX.apmHosts*PR.indexed_spans_allot_m_per_apm_host;
  const before=[
    ['Infrastructure Pro',`${EX.hosts} hosts × ${usd(R.host_mo_annual)}`,EX.hosts*R.host_mo_annual],
    ['Custom metrics',`${EX.cm.toLocaleString()} indexed − ${cmAllot.toLocaleString()} included (${PR.custom_metrics_allot_per_pro_host}/host) = ${(EX.cm-cmAllot).toLocaleString()} × ${usd(PR.custom_metrics_per_100)}/100`,cmCost(EX.cm)],
    ['Log ingestion',`${EX.logGB} GB × ${usd(PR.log_ingest_gb)}`,EX.logGB*PR.log_ingest_gb],
    ['Indexed logs (15-day)',`${EX.idxM}M events × ${usd(i15)}/M`,EX.idxM*i15],
    ['APM hosts',`${EX.apmHosts} × ${usd(PR.apm_host_mo_annual)}`,EX.apmHosts*PR.apm_host_mo_annual],
    ['Span ingestion over allotment',`${EX.spanGB.toLocaleString()} GB − ${spanAllot.toLocaleString()} GB included = ${(EX.spanGB-spanAllot).toLocaleString()} × ${usd(PR.span_ingest_gb)}`,Math.max(0,EX.spanGB-spanAllot)*PR.span_ingest_gb],
    ['Indexed spans over allotment (15-day)',`${EX.spansM}M − ${spanIdxAllot}M included = ${EX.spansM-spanIdxAllot}M × ${usd(PR.indexed_spans_m['15'])}/M`,Math.max(0,EX.spansM-spanIdxAllot)*PR.indexed_spans_m['15']],
  ];
  const keptM=EX.idxM-EX.hcM;
  const after=[
    ['Infrastructure Pro','unchanged',EX.hosts*R.host_mo_annual],
    ['Custom metrics',`${(EX.cm-EX.cmCut).toLocaleString()} indexed after ${EX.cmCut.toLocaleString()} unqueried, asset-free series are excluded`,cmCost(EX.cm-EX.cmCut)],
    ['Log ingestion',`${EX.logGB-EX.hcGB} GB after health-check lines are dropped at the Agent`,(EX.logGB-EX.hcGB)*PR.log_ingest_gb],
    ['Indexed logs (7-day)',`${keptM}M events (health checks no longer indexed) × ${usd(i7)}/M`,keptM*i7],
    ['APM hosts','unchanged',EX.apmHosts*PR.apm_host_mo_annual],
    ['Span ingestion over allotment','unchanged',Math.max(0,EX.spanGB-spanAllot)*PR.span_ingest_gb],
    ['Indexed spans over allotment (15-day)','unchanged',Math.max(0,EX.spansM-spanIdxAllot)*PR.indexed_spans_m['15']],
  ];
  const sum=a=>a.reduce((s,x)=>s+x[2],0), B=sum(before), A=sum(after);
  const onDemandGap=EX.hosts*(ON.host-R.host_mo_annual)+EX.apmHosts*(ON.apm-PR.apm_host_mo_annual);
  // Guard: the page must use the dataset's Datadog rates exactly (fails build if audit-rates.json drifts from what this copy states).
  const expect={host:15,apm:31,log:0.1,i3:1.06,i7:1.27,i15:1.7,i30:2.5,cm:5,cmA:100,cont:1,contA:5,spanA:150,spanIA:1};
  const got={host:R.host_mo_annual,apm:PR.apm_host_mo_annual,log:PR.log_ingest_gb,i3,i7,i15,i30,cm:PR.custom_metrics_per_100,cmA:PR.custom_metrics_allot_per_pro_host,cont:PR.container_mo,contA:PR.containers_allot_per_pro_host,spanA:PR.span_ingest_allot_gb_per_apm_host,spanIA:PR.indexed_spans_allot_m_per_apm_host};
  for(const k in expect){if(got[k]!==expect[k]){console.error(`cut-datadog-without-migrating guard: rate ${k} is ${got[k]}, page copy expects ${expect[k]}. Re-read datadoghq.com/pricing/list and update the copy.`);process.exit(1)}}
  if(!(A<B)){console.error('cut-datadog-without-migrating guard: example after >= before');process.exit(1)}

  const file='guides/cut-datadog-bill-without-migrating.html';
  const SRC_LIST='https://www.datadoghq.com/pricing/list/', SRC_P='https://www.datadoghq.com/pricing/';
  const D={
    mwl:'https://docs.datadoghq.com/metrics/metrics-without-limits/',
    sum:'https://docs.datadoghq.com/metrics/summary/',
    cmb:'https://docs.datadoghq.com/account_management/billing/custom_metrics/',
    idx:'https://docs.datadoghq.com/logs/log_configuration/indexes/',
    agent:'https://docs.datadoghq.com/agent/logs/advanced_log_collection/',
    trace:'https://docs.datadoghq.com/tracing/trace_pipeline/',
    bill:'https://docs.datadoghq.com/account_management/billing/',
    cont:'https://docs.datadoghq.com/account_management/billing/containers/',
  };
  const L=(u,t)=>`<a href="${u}" rel="nofollow noopener">${esc(t)}</a>`;
  const title=`Cut your Datadog bill without migrating: cleanup checklist (2026) | ${SITE}`;
  const desc=`Unqueried custom metrics, health-check logs, indexed retention, spans, host counting and on-demand vs annual: a Datadog cleanup checklist priced from datadoghq.com list prices read ${CHK}, with how to check what is safe to remove.`;
  const answer=`Before you migrate, clean up what you pay Datadog for but never look at. Datadog's list prices (read ${CHK}): custom metrics ${usd(PR.custom_metrics_per_100)} per 100 beyond ${PR.custom_metrics_allot_per_pro_host} per Infrastructure Pro host, log ingestion ${usd(PR.log_ingest_gb)}/GB, indexed logs ${usd(i3)}–${usd(i30)} per million events (3- to 30-day retention), APM ${usd(PR.apm_host_mo_annual)}/host, Infrastructure Pro ${usd(R.host_mo_annual)}/host billed annually (${usd(ON.host)} on-demand). Datadog's own Metrics Summary shows which metrics nobody has queried in 30, 60 or 90 days and which ones sit on a dashboard, monitor, notebook or SLO. That is how you tell what is safe to remove without breaking someone's alert.`;
  const faq=[
    ['How do I cut my Datadog bill without migrating?', answer],
    ["How do I figure out what's safe to remove without breaking someone's alert?", `Use Metrics Summary in Datadog. The Query Activity facet lists metrics not queried in the past 30, 60 or 90 days, and the Related Assets facet lists metrics used on dashboards, notebooks, monitors and SLOs. Datadog's docs say a metric counts as used as long as it exists on an asset, even if nobody queries it. Start with metrics that are unqueried for 90 days and have no related assets. Prefer a Metrics without Limits tag configuration over deleting code, because you can revert it with "Allow all tags".`],
    ['Do Datadog exclusion filters stop me paying for health-check logs?', `Partly. An index exclusion filter stops those logs being indexed (${usd(i3)}–${usd(i30)} per million events by retention), but they are still ingested (${usd(PR.log_ingest_gb)}/GB), and they still show in Live Tail, archives and log-based metrics. To avoid the ingestion charge too, drop them at the Agent with a log_processing_rules exclude_at_match rule. Datadog's own docs use a "healthcheck" pattern as the example. Logs dropped at the Agent are never sent, so you can't get them back.`],
    ['What does Datadog charge for custom metrics?', `${usd(PR.custom_metrics_per_100)} per 100 custom metrics per month beyond the allotment (${PR.custom_metrics_allot_per_pro_host} per Infrastructure Pro host, 200 per Enterprise host, pooled across the account), billed on the monthly average of distinct series per hour. If you configure a metric with Metrics without Limits, its ingested series are also counted, at $0.10 per 100 beyond the ingested allotment (datadoghq.com/pricing/list, read ${CHK}).`],
    ['Is my Datadog bill really higher than my AWS bill?', 'Sometimes it is, and buyers say so in public threads ("our datadog bill is literally higher than our aws hosting bill"). We have no data on how common that is, so we won\'t give you a percentage. Price your own usage line by line with the checklist below or the free audit, then decide whether a cleanup is enough or a migration is worth the work.'],
    ['Will you tell me how much I will save?', 'Not as a percentage. We do not publish invented savings stats. The worked example below uses Datadog list prices on made-up inputs. Your own result depends on your contract and usage. The free audit prices the usage you enter against public list prices.'],
  ];
  const tbl=(rows,tot,label)=>`<div class="tw"><table><thead><tr><th>${label} line</th><th>Example usage × list price</th><th>$/mo</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="sm">${esc(r[1])}</td><td>${usd(r[2])}</td></tr>`).join('')}<tr><td><b>Total</b></td><td></td><td><b>${usd(tot)}</b></td></tr></tbody></table></div>`;
  P(file,title,desc,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:'Cut Datadog bill without migrating'}])}
<div class="eyebrow">Cleanup checklist · Datadog list prices read ${esc(CHK)}</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">Cut your Datadog bill without migrating</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:760px">If you've got <i>“custom metrics that literally nobody has queried in like 6 months”</i> and <i>“health check logs just burning through our indexed volume”</i>, start there. Migrating can wait. This checklist prices each cleanup lever with Datadog's own list prices and links the Datadog docs that show what's safe to remove.</p>
<p><a class="btn" href="../audit.html" data-grow="audit-guide-cut-dd-nomigrate-top">Run the free savings check →</a> <a class="sm mut" href="#checklist" style="margin-left:10px">Jump to the checklist</a></p>
<p class="lede" style="max-width:760px"><b>Answer:</b> ${esc(answer)}</p>
${keyStats([
  ['Custom metrics', `${usd(PR.custom_metrics_per_100)} per 100 / mo beyond ${PR.custom_metrics_allot_per_pro_host} per Infrastructure Pro host`],
  ['Log ingestion', `${usd(PR.log_ingest_gb)} per GB`],
  ['Indexed logs per 1M events', `${usd(i3)} (3-day) · ${usd(i7)} (7-day) · ${usd(i15)} (15-day) · ${usd(i30)} (30-day)`],
  ['APM', `${usd(PR.apm_host_mo_annual)} per APM host (${PR.span_ingest_allot_gb_per_apm_host} GB ingested + ${PR.indexed_spans_allot_m_per_apm_host}M indexed spans included per host)`],
  ['Infrastructure Pro', `${usd(R.host_mo_annual)} per host billed annually; ${usd(ON.host)} month-to-month or on-demand`],
  ['Containers', `${PR.containers_allot_per_pro_host} per Pro host included; then ${usd(PR.container_mo)}/container/mo (annual) or $0.002/container-hour on-demand`],
  ['Source', `datadoghq.com/pricing/list (Billed Annually column unless stated), read ${CHK}`],
])}

<h2 id="checklist">The cleanup checklist</h2>
<p class="sm mut">Work down the list in order: the first steps are reversible and need no code change. Prices are Datadog list prices (Billed Annually) from ${L(SRC_LIST,'datadoghq.com/pricing/list')}, read ${esc(CHK)}. Your contract price may differ.</p>

<h3>1. Custom metrics nobody has queried</h3>
<ul>
<li><b>What you pay:</b> ${usd(PR.custom_metrics_per_100)} per 100 custom metrics per month beyond ${PR.custom_metrics_allot_per_pro_host} per Infrastructure Pro host (200 on Enterprise). The allotment is pooled across your hosts. Billing uses the monthly average of distinct series per hour, so query count and how often you submit data points don't change it (${L(D.cmb,'Custom Metrics Billing docs')}).</li>
<li><b>Why it grows:</b> a custom metric is a metric name <i>plus</i> each unique tag-value combination. A single high-cardinality tag like <code>user_id</code> or <code>request_id</code> multiplies the count. Histograms and distributions each emit 5 series per tag combination, and adding percentiles to a distribution doubles that.</li>
<li><b>Find them:</b> open Metrics Summary, then use the <b>Query Activity</b> facet ("not queried in the past 30, 60, or 90 days") together with the <b>Related Assets</b> facet (${L(D.sum,'Metrics Summary docs')}). To find the tag behind a spike, use the Custom Metrics Tags Cardinality Explorer.</li>
<li><b>Cut them reversibly:</b> with ${L(D.mwl,'Metrics without Limits')}, set an allowlist of tags (or an empty allowlist for unqueried metrics, as Datadog's docs suggest). Check the <i>Estimated New Volume</i> before you save, and confirm the drop 24 hours later on Plan &amp; Usage. Configured metrics also count toward <i>ingested</i> custom metrics at $0.10 per 100 beyond the ingested allotment.</li>
</ul>

<h3>2. Health-check logs burning indexed volume</h3>
<ul>
<li><b>What you pay:</b> ${usd(PR.log_ingest_gb)}/GB to ingest, then ${usd(i3)} to ${usd(i30)} per million <i>indexed</i> events depending on retention.</li>
<li><b>Option A: index exclusion filter</b> (reversible). Excluded logs aren't indexed, but you still pay to ingest them, and they still flow to Live Tail, archives and log-based metrics. You can toggle a filter on or off and sample anywhere from 0% to 100% (${L(D.idx,'Log Indexes docs')}). The docs' own example excludes 95% of 2xx nginx access logs.</li>
<li><b>Option B: drop at the Agent.</b> A <code>log_processing_rules</code> rule of type <code>exclude_at_match</code> stops the log from being sent at all, so you skip the ingestion charge too. Datadog's docs show a global rule named <code>exclude_healthcheck</code> (${L(D.agent,'Advanced Log Collection docs')}). Logs dropped this way are gone for good.</li>
<li><b>Put a ceiling on it:</b> an index <b>daily quota</b> hard-limits how many events get indexed per day and fires an event when you hit the limit or a warning threshold.</li>
</ul>

<h3>3. Retention you forgot you picked</h3>
<ul>
<li>Indexed logs per million events: ${usd(i3)} (3-day), ${usd(i7)} (7-day), ${usd(i15)} (15-day), ${usd(i30)} (30-day). Split noisy sources into their own index with shorter retention. Datadog recommends multiple indexes when you need different retentions or quotas (${L(D.idx,'docs')}).</li>
<li>Low-value logs you have to keep for months can go to an archive or Flex Logs. Flex Logs storage is $0.05 per million events stored per month on the list page. Check that the query trade-offs suit you first.</li>
</ul>

<h3>4. Span ingestion and retention</h3>
<ul>
<li>APM is ${usd(PR.apm_host_mo_annual)} per APM host. Each host includes ${PR.span_ingest_allot_gb_per_apm_host} GB of ingested spans and ${PR.indexed_spans_allot_m_per_apm_host}M indexed spans per month, pooled across APM hosts. Above that you pay ${usd(PR.span_ingest_gb)}/GB ingested and ${usd(PR.indexed_spans_m['15'])} per million indexed spans (15-day retention) (${L(SRC_P,'datadoghq.com/pricing')}).</li>
<li>Ingestion is controlled on the Ingestion Control page. Retention filters decide which spans get indexed. The APM Estimated Usage dashboard shows where the volume comes from (${L(D.trace,'Trace Pipeline docs')}). Tighten custom retention filters before you touch sampling, so you keep error and high-latency traces.</li>
</ul>

<h3>5. How hosts and containers are counted</h3>
<ul>
<li>Hosts are metered hourly. The billable count is the high-water mark of the lowest 99% of hours, so the top 1% of hours is ignored. Non-reporting hosts don't count (${L(D.bill,'Billing docs')}).</li>
<li>If you install the Agent inside every container, <b>each container is billed as a host</b>. Datadog recommends one containerized Agent per host.</li>
<li>Containers: ${PR.containers_allot_per_pro_host} per Pro host (10 per Enterprise host) are included and averaged across your infrastructure. Pause containers and Agent containers don't count. Fargate is billed on the number of tasks or pods running at the same time (${L(D.cont,'Containers Billing docs')}).</li>
</ul>

<h3>6. Committed (annual) vs on-demand</h3>
<ul>
<li>List prices from the same page: Infrastructure Pro ${usd(R.host_mo_annual)} annual vs ${usd(ON.host)} month-to-month or on-demand; APM ${usd(PR.apm_host_mo_annual)} vs ${usd(ON.apm)}; 15-day indexed logs ${usd(i15)} (annual) vs ${usd(ON.idx15m2m)} (month-to-month) vs ${usd(ON.idx15)} (on-demand) per million.</li>
<li>Usage beyond your committed quantity and allotments is metered on-demand (see the ${L(D.cont,'containers billing FAQ')} for how). Plan &amp; Usage → Subscription Details shows the contract price and on-demand price for each committed product. Commit only to your steady baseline, <i>after</i> the cleanup.</li>
</ul>

<h2 id="example">Worked example (illustration only)</h2>
<p class="sm"><b>Example, not data:</b> the inputs below are made up to show the math. They are not from any customer and are not an average. Prices are the Datadog list prices above (annual), read ${esc(CHK)}.</p>
<p class="sm mut">Inputs: ${EX.hosts} Infrastructure Pro hosts, ${EX.cm.toLocaleString()} indexed custom metrics, ${EX.logGB} GB/mo of logs of which ${EX.hcGB} GB are health checks, ${EX.idxM}M indexed log events/mo at 15-day retention of which ${EX.hcM}M are health checks, ${EX.apmHosts} APM hosts, ${EX.spanGB.toLocaleString()} GB ingested spans, ${EX.spansM}M indexed spans. Cleanup: exclude ${EX.cmCut.toLocaleString()} custom metrics that are unqueried for 90 days and on no asset, drop health-check logs at the Agent, and move the remaining logs to 7-day retention.</p>
${tbl(before,B,'Before')}
${tbl(after,A,'After cleanup')}
<p><b>Example difference: ${usd(B-A)}/mo</b> (${usd(B)} → ${usd(A)}) on these made-up inputs, with nothing migrated. In the same example, paying on-demand list prices instead of annual for the ${EX.hosts} infra hosts and ${EX.apmHosts} APM hosts would add ${usd(onDemandGap)}/mo.</p>

${auditCta('Price your own Datadog usage line by line, free, in your browser.','Check your real savings in 2 minutes','audit-guide-cut-dd-nomigrate')}

<h2>What buyers ask (in their words)</h2>
<ul>
<li><i>“how do you even figure out what's safe to remove without breaking someone's alert?”</i>: use Related Assets (monitors, dashboards, notebooks, SLOs) plus Query Activity (30/60/90 days) in Metrics Summary, and change tag configurations rather than deleting code. See step 1.</li>
<li><i>“health check logs just burning through our indexed volume”</i>: use an exclusion filter to stop indexing them, or an Agent <code>exclude_at_match</code> rule to stop ingesting them too. See step 2.</li>
<li><i>“our datadog bill is literally higher than our aws hosting bill”</i>: price each line above against your own usage first, then compare alternatives on the same usage with the <a href="../audit.html">audit</a>.</li>
</ul>
<p class="sm mut">Quotes are from public r/devops and r/ChoosingVendors threads (2026).</p>

<h2>FAQ</h2>
${faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}

${related([['cut-datadog-bill.html','How to cut your Datadog bill (limits + alternatives)'],['datadog-pricing.html','Datadog pricing (2026)'],['datadog-cost-calculator.html','Datadog cost calculator'],['datadog-alternatives.html','Datadog alternatives (cheaper)'],['../vendors/datadog.html','Datadog vendor page'],['index.html','All guides']])}
${cta('Get told when Datadog changes these prices','Weekly email when a pricing page changes, with the source link.','guide-cut-dd-nomigrate','Subscribe free')}
${cite(`Datadog cleanup checklist, Datadog list prices read ${CHK}`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:'Cut Datadog bill without migrating',href:BASE+'/guides/cut-datadog-bill-without-migrating'}]),
    {'@context':'https://schema.org','@type':'Article',headline:'Cut your Datadog bill without migrating: cleanup checklist (2026)',description:desc,datePublished:'2026-10-31',dateModified:CHK,author:{'@id':BASE+'/#org'},publisher:{'@id':BASE+'/#org'},mainEntityOfPage:BASE+'/guides/cut-datadog-bill-without-migrating',about:{'@type':'SoftwareApplication',name:'Datadog',url:SRC_P},citation:[SRC_LIST,SRC_P,...Object.values(D)]},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ]);
  hubLinks.push([file,'Cut your Datadog bill without migrating','Cleanup checklist: unqueried custom metrics, health-check logs, retention, spans, host counting. Datadog list prices read '+CHK+'.']);
}


// ---- Alternatives (cheaper) pages for high-intent vendors
const ALT_AUDIT=[];
const ALT_IDS=['datadog','newrelic','grafana','sentry','dynatrace','honeycomb','pagerduty','splunk','elastic','axiom','rollbar','bugsnag','uptimerobot','langfuse'];
for(const id of ALT_IDS){
  const v=byId(id); if(!v||!v.verified) continue;
  const file=`guides/${id}-alternatives.html`;
  const peers=C[v.cat].vs.filter(x=>x.id!==id&&x.verified);
  if(peers.length<2) continue;
  // RT-20261031-31: only compare paid_from when currency + billing unit match (per host vs per host, etc.).
  const vP=parsePrice(v.paid_from),vUnit=vP?vP.unit:null;
  const scored=peers.map(a=>{
    let score=0;
    if(a.free==='yes') score+=100;
    const cmp=compareLower(v,a),ap=parsePrice(a.paid_from);
    if(cmp.lower) score+=50+(vP.amount-ap.amount);
    else if(ap&&!vP) score+=10;
    if(a.oss_self_host&&a.oss_self_host!=='not stated'&&/self|oss|open/i.test(String(a.oss_self_host))) score+=15;
    return {a,score,cmp,ap};
  }).sort((x,y)=>y.score-x.score||x.a.name.localeCompare(y.a.name));
  const cheaper=scored.filter(x=>x.cmp.lower||x.a.free==='yes');
  const top=cheaper.length?cheaper:scored.slice(0,8);
  const nLower=scored.filter(x=>x.cmp.lower).length;
  const diffUnit=scored.filter(x=>x.cmp.reason==='unit');
  const diffTier=scored.filter(x=>x.cmp.reason==='tier');
  const diffSubj=scored.filter(x=>x.cmp.reason==='subjtier');
  const n=(k,one,many)=>`${k} ${k===1?one:many}`;
  const diffUnits=[...new Set(diffUnit.map(x=>UNIT_LABEL[x.cmp.unit]))];
  for(const x of scored) if(x.cmp.lower&&(parsePrice(x.a.paid_from).unit!==vUnit||x.a.paid_from_scope)) throw new Error(`answer-box unit guard: ${x.a.id} counted as lower than ${v.id} across units/tiers`);
  ALT_AUDIT.push({id,vUnit,nLower,lowerIds:scored.filter(x=>x.cmp.lower).map(x=>x.a.id)});
  const answer=`As of ${v.checked}, ${v.name} states paid entry as ${v.paid_from||'not stated'}${v.has_free_tier?` and a free plan (${v.free_tier})`:` with no free plan (${v.free_tier||'trial / paid only'})`}. Among ${peers.length} verified ${C[v.cat].name} peers in our dataset, ${scored.filter(x=>x.a.free==='yes').length} list a free plan. ${vUnit&&vUnit!=='other'?(v.paid_from_scope?`${v.name}'s lowest entry price is a basic tier only (${v.paid_from_scope}; APM-comparable: ${v.apm_paid_from||'not stated'}), so we don't rank peers as cheaper on price${diffSubj.length?` (${n(diffSubj.length,'peer also prices','peers also price')} ${UNIT_LABEL[vUnit]})`:''}`:`${n(nLower,'states','state')} a lower entry price in the same billing unit (${UNIT_LABEL[vUnit]}) as ${v.name}`):`${v.name}'s entry price has no comparable billing unit, so we rank no peer as cheaper on price`}${diffUnit.length?`; ${n(diffUnit.length,'prices','price')} in a different billing unit (${diffUnits.join(', ')}), so ${diffUnit.length===1?'its price is':'their prices are'} not comparable here`:''}${diffTier.length?`; ${diffTier.map(x=>`${x.a.name} lists a lower entry price for a basic tier only${x.a.apm_paid_from?` (APM-comparable: ${x.a.apm_paid_from})`:''}`).join('; ')}, so ${diffTier.length>1?'they are':'it is'} not counted as cheaper`:''}. We never invent a blended bill. Compare the stated fields below or run the free savings estimate on your own usage.`;
  const faq=[
    [`What are cheaper ${v.name} alternatives?`, answer],
    [`Does ${v.name} have a free tier?`, v.has_free_tier?`Yes: ${v.free_tier}`:`No free plan stated: ${v.free_tier||'trial / paid only'}`],
    ['How do you decide “cheaper”?', 'Only from recorded free-tier presence and stated paid_from figures in vendors.json, and only when both prices use the same currency and billing unit (per host vs per host, per user vs per user). Per-GB, per-span and per-user prices are labelled “different billing unit” and never counted as cheaper than a per-host price. Basic-only entry tiers are labelled, not counted. Use the free audit estimate for usage-based savings.'],
    ['Last verified?', `${v.name}: ${v.checked} (${v.url}). Peers use their own check dates in the table.`],
  ];
  const why=({a,cmp})=>{
    if(cmp.lower) return `Lower entry price, same billing unit (${UNIT_LABEL[cmp.unit]})`;
    const f=a.free==='yes'?'Has free plan':'Peer';
    if(cmp.reason==='unit') return `${f} · paid price uses a different billing unit (${UNIT_LABEL[cmp.unit]}), not comparable`;
    if(cmp.reason==='subjtier') return `${f} · ${v.name}'s entry price is a basic tier only, so not ranked on price`;
    if(cmp.reason==='tier') return `${f} · lower entry price is a basic tier only${a.apm_paid_from?` (APM-comparable: ${a.apm_paid_from})`:''}, not counted`;
    return f;
  };
  const rows=top.slice(0,12).map(x=>`<tr>
<td><a href="../vendors/${x.a.id}.html"><b>${esc(x.a.name)}</b></a></td>
<td>${pill(x.a.free)}</td>
<td class="sm">${esc(x.a.free_tier||'—')}</td>
<td class="sm">${esc(x.a.paid_from||'not stated')}</td>
<td class="sm">${esc(x.ap?UNIT_LABEL[x.ap.unit]:'—')}</td>
<td class="sm mut">${esc(x.a.checked)}</td>
<td class="sm">${esc(why(x))}</td>
</tr>`).join('');
  P(file,`${v.name} alternatives (cheaper) 2026 — free tiers & paid entry | ${SITE}`,`Cheaper ${v.name} alternatives from verified free tiers and like-for-like entry prices (same billing unit), checked ${v.checked}.`,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:`${v.name} alternatives`}])}
<div class="eyebrow">Alternatives · sourced · verified ${esc(v.checked)}</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">${esc(v.name)} alternatives (cheaper)</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:760px"><b>Answer:</b> ${esc(answer)}</p>
${keyStats([
  [`${v.name} paid from`, v.paid_from||'not stated'],
  [`${v.name} free`, v.has_free_tier?v.free_tier:'No free plan'],
  ['Verified peers in category', String(peers.length)],
  ['Listed alternatives', String(top.slice(0,12).length)],
  ['Last verified', v.checked],
  ['Source', v.url],
])}
<h2>${esc(v.name)} at a glance</h2>
<div class="tw"><table><thead><tr><th>Field</th><th>Recorded value</th></tr></thead><tbody>
<tr><td>Free plan</td><td>${esc(v.free_plan||(v.has_free_tier?'Free':'None'))}</td></tr>
<tr><td>Free limits</td><td>${esc(v.free_tier||'—')}</td></tr>
<tr><td>Paid from</td><td>${esc(v.paid_from||'not stated')}</td></tr>
<tr><td>Billing unit of entry price</td><td>${esc(UNIT_LABEL[parsePrice(v.paid_from)?.unit]||'not stated')}</td></tr>${v.apm_paid_from?`\n<tr><td>APM-comparable price</td><td>${esc(v.apm_paid_from)}</td></tr>`:''}
<tr><td>Pricing model</td><td>${esc(v.pricing_model||'not stated')}</td></tr>
</tbody></table></div>
<h2>Verified alternatives in ${esc(C[v.cat].name)}</h2>
<div class="tw"><table><thead><tr><th>Vendor</th><th>Free?</th><th>Free limits</th><th>Paid from</th><th>Billing unit</th><th>Checked</th><th>Why listed</th></tr></thead><tbody>${rows}</tbody></table></div>
${related([
  [`${id}-pricing.html`,`${v.name} pricing (2026)`],
  ...(id==='datadog'||id==='newrelic'||id==='grafana'?[[`${id}-cost-calculator.html`,`${v.name} cost calculator`]]:[]),
  [`../vendors/${id}.html`,`${v.name} vendor page`],
  [`../category/${v.cat}.html`,`${C[v.cat].name} category`],
  [`../compare.html?v=${id},${top[0]?.a.id||''}`,'Interactive compare'],
])}
${auditCta(`Quantify switching off ${v.name} on your real usage.`, `See what you’d save on ${esc(v.name)} in 2 minutes`, 'audit-guide-alts-'+id)}
${cta(`Watch ${esc(v.name)} and peers for price moves`,'Weekly email when a free tier or paid_from changes, with the source.','guide-alts-'+id,'Subscribe free')}
${cite(`${v.name} alternatives as of ${v.checked}`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:`${v.name} alternatives`,href:BASE+'/'+file}]),
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ]);
  hubLinks.push([file,`${v.name} alternatives (cheaper)`,`Peers with free plans, or a lower entry price in the same billing unit as ${v.name}.`]);
}

// ---- Cost calculator landing pages (SEO → free audit)
for(const id of ['datadog','newrelic','grafana']){
  const v=byId(id); if(!v||!v.verified) continue;
  const file=`guides/${id}-cost-calculator.html`;
  const alts=C[v.cat].vs.filter(x=>x.id!==id&&x.verified).slice(0,6);
  const answer=`The ${v.name} cost calculator on O11y Watch is the free Observability Cost & Stack Audit: enter hosts, log GB/day, metric series, spans, retention and seats; it models spend from public rates in our dataset (checked ${v.checked}). ${v.name} paid_from is recorded as ${v.paid_from||'not stated'}; pricing model: ${v.pricing_model||'not stated'}. Free teaser shows a savings range; full report is $${AUDIT_PRICE}.`;
  const faq=[
    [`Is there a free ${v.name} cost calculator?`, `Yes — start the free savings estimate at ${AUDIT}. It runs in your browser against O11y Watch rates.`],
    [`What ${v.name} price does it use?`, `Stated fields from ${v.url} checked ${v.checked}: paid_from ${v.paid_from||'not stated'}; model ${v.pricing_model||'not stated'}. Gaps are labeled, never invented.`],
    ['Is this a quote?', 'No. Estimates only. Verify on the vendor pricing page before buying.'],
  ];
  P(file,`${v.name} cost calculator (2026) — free savings estimate | ${SITE}`,`Free ${v.name} cost calculator: model spend from your usage and O11y Watch public rates (checked ${v.checked}).`,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:`${v.name} cost calculator`}])}
<div class="eyebrow">Cost calculator · free estimate · verified rates ${esc(v.checked)}</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">${esc(v.name)} cost calculator</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:760px"><b>Answer:</b> ${esc(answer)}</p>
${keyStats([
  ['Paid from (dataset)', v.paid_from||'not stated'],
  ['Pricing model', v.pricing_model||'not stated'],
  ['Free tier', v.has_free_tier?v.free_tier:'None stated'],
  ['Last verified', v.checked],
  ['Source', v.url],
  ['Full report', '$'+AUDIT_PRICE],
])}
${auditCta(`Open the calculator with ${v.name} as your primary vendor context.`, `See what you’d save on ${esc(v.name)} in 2 minutes`, 'audit-calc-'+id)}
<h2>What the dataset knows about ${esc(v.name)}</h2>
<div class="tw"><table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
<tr><td>Free plan</td><td>${esc(v.free_plan||(v.has_free_tier?'Free':'None'))}</td></tr>
<tr><td>Free limits</td><td>${esc(v.free_tier||'—')}</td></tr>
<tr><td>Paid from</td><td>${esc(v.paid_from||'not stated')}</td></tr>
<tr><td>Model</td><td>${esc(v.pricing_model||'not stated')}</td></tr>
<tr><td>Gotchas</td><td>${esc((v.gotchas||[]).join('; ')||'none recorded')}</td></tr>
</tbody></table></div>
<h2>How to use it</h2>
<ol style="max-width:720px">
<li>Click <b>Start free savings estimate</b> (runs entirely in your browser).</li>
<li>Select ${esc(v.name)} as your primary vendor and enter hosts, GB/day, series, spans, retention and seats.</li>
<li>Read the free conservative savings check (a dollar figure only when public list prices fully cover your usage). Unlock the full ranked report for $${AUDIT_PRICE} if you need levers and a migration plan.</li>
</ol>
<h2>Related alternatives</h2>
<div class="grid">${alts.map(a=>`<a class="card" href="../vendors/${a.id}.html"><h3>${esc(a.name)}</h3><p>${pill(a.free)} ${esc((a.paid_from||a.free_tier||'').slice(0,100))}</p></a>`).join('')}</div>
${related([
  [`${id}-pricing.html`,`${v.name} pricing (2026)`],
  [`${id}-alternatives.html`,`${v.name} alternatives (cheaper)`],
  ...(id==='datadog'||id==='newrelic'?[[`cut-${id}-bill.html`,`How to cut your ${v.name} bill`]]:[]),
  ...(id==='datadog'?[['cut-datadog-bill-without-migrating.html','Cut your Datadog bill without migrating (cleanup checklist)']]:[]),
  [`../vendors/${id}.html`,`${v.name} vendor page`],
  ['../audit.html','Observability Cost & Stack Audit'],
])}
${cta(`Alert me when ${esc(v.name)} pricing changes`,'Weekly email with the source link.','guide-calc-'+id,'Subscribe free')}
${cite(`${v.name} cost calculator context as of ${v.checked}`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:`${v.name} cost calculator`,href:BASE+'/'+file}]),
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))},
    {'@context':'https://schema.org','@type':'WebApplication',name:`${v.name} cost calculator`,url:BASE+'/'+file,applicationCategory:'BusinessApplication',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}}
  ]);
  hubLinks.push([file,`${v.name} cost calculator`,`Free usage-based estimate → /audit (rates checked ${v.checked}).`]);
}

// ---- Hub page
const hubFaq=[
  ['What are these guides?',`High-intent pricing explainers, head-to-head cost comparisons, cheapest-in-category free-tier lists and bill-cut playbooks generated from the same ${V.length}-vendor dataset as the directory.`],
  ['Do you invent prices?',`No. Every number is copied from a vendor pricing page with a check date. Fields that are not stated stay “not stated”.`],
  ['How do I get a usage-based estimate?',`Use the free Observability Cost & Stack Audit at ${AUDIT}.`],
];
P('guides/index.html',`Observability pricing guides (2026) — ${SITE}`,`Vendor pricing explainers, cost comparisons and cheapest free-tier picks across ${V.length} observability tools.` ,`
${crumbs([{href:'../index.html',label:'Home'},{href:'#',label:'Guides'}])}
<div class="eyebrow">Programmatic SEO hub · dataset ${esc(LAST)}</div>
<h1 style="font-size:clamp(28px,4vw,48px);margin-top:8px">Observability pricing guides</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:720px"><b>Answer:</b> ${esc(`O11y Watch publishes ${hubLinks.length} sourced pricing guides from ${nVer} verified vendor pages (last check ${LAST}). Each page has an answer-first summary, a data table, FAQ JSON-LD, a last-verified date and a CTA to the free audit estimate.`)}</p>
${keyStats([
  ['Guides in this hub', String(hubLinks.length)],
  ['Vendors tracked', String(V.length)],
  ['Verified', String(nVer)],
  ['Dataset last check', LAST||'—'],
])}
<div class="grid">${hubLinks.map(([h,t,d])=>`<a class="card" href="${h.split('/').pop()}"><h3>${esc(t)}</h3><p>${esc(d)}</p></a>`).join('')}</div>
${auditCta('Use these guides to shortlist vendors, then estimate your stack.','See what you’d save on Datadog / New Relic in 2 minutes','audit-guides-hub')}
${cta('Get every pricing change by email','Free weekly digest across all tracked vendors.','guides-hub','Subscribe free')}
${cite(`O11y Watch pricing guides hub as of ${LAST}`)}
`,'../',[
  ORG,
  crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'}]),
  {'@context':'https://schema.org','@type':'FAQPage',mainEntity:hubFaq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))},
  {'@context':'https://schema.org','@type':'CollectionPage',name:'Observability pricing guides',url:BASE+'/guides/',isPartOf:{'@id':BASE+'/#website'}}
]);

// ---- CSV download (stable URL) + Dataset enhancement note written by caller via return
const csvEscape=s=>`"${String(s??'').replace(/"/g,'""')}"`;
const csvHeader=['id','name','category','type','has_free_tier','free_plan','free_tier','paid_from','pricing_model','card_required','oss_self_host','gotchas','confidence','source_url','checked'];
const csvRows=V.map(v=>[v.id,v.name,v.cat,v.type,v.has_free_tier,v.free_plan,v.free_tier,v.paid_from,v.pricing_model,v.card_required,v.oss_self_host,(v.gotchas||[]).join(' | '),v.confidence||(v.verified?'verified':'uncertain'),v.url,v.checked].map(csvEscape).join(','));
fs.mkdirSync(path.join(out,'api'),{recursive:true});
W('api/vendors.csv',[csvHeader.join(','),...csvRows].join('\n'));
W('api/changes.csv',['date','vendor','type','summary','source'].join(',')+'\n'+changes.map(c=>[c.date,c.vendor,c.type,c.summary,c.source].map(csvEscape).join(',')).join('\n'));

return {altAudit:ALT_AUDIT,org:ORG,guideCount:hubLinks.length+1,guideFiles:['guides/index.html',...hubLinks.map(x=>x[0])],striking:hubLinks.slice(0,12)};
}
