// Programmatic SEO + GEO flywheel pages for O11y Watch. Called from build.mjs.
// Only cites fields from vendors.json / changes.json — never invents numbers.
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
  return `<section class="cta" style="margin-top:28px"><div class="eyebrow">Free savings estimate · 2 minutes</div><h3 style="margin:6px 0">${esc(headline||'See what you’d save on Datadog / New Relic in 2 minutes')}</h3><p>${esc(ctx)} Free top-line range; full report $${AUDIT_PRICE}.</p><p><a class="btn" href="../audit.html" data-grow="${grow}">Start free savings estimate →</a> <a class="btn ghost" href="../subscribe.html?src=guide">Get the weekly newsletter</a></p></section>`;
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
${related([[`${id}-pricing.html`,`${v.name} pricing (2026)`],[`../vendors/${id}.html`,`${v.name} vendor page`],['index.html','All guides']])}
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


// ---- Alternatives (cheaper) pages for high-intent vendors
const ALT_IDS=['datadog','newrelic','grafana','sentry','dynatrace','honeycomb','pagerduty','splunk','elastic','axiom','rollbar','bugsnag','uptimerobot','langfuse'];
for(const id of ALT_IDS){
  const v=byId(id); if(!v||!v.verified) continue;
  const file=`guides/${id}-alternatives.html`;
  const peers=C[v.cat].vs.filter(x=>x.id!==id&&x.verified);
  if(peers.length<2) continue;
  const parsePaid=s=>{
    if(!s||s==='not stated') return null;
    const m=String(s).replace(/,/g,'').match(/\$?\s*(\d+(?:\.\d+)?)/);
    return m?Number(m[1]):null;
  };
  const vPaid=parsePaid(v.paid_from);
  const scored=peers.map(a=>{
    let score=0;
    if(a.free==='yes') score+=100;
    const ap=parsePaid(a.paid_from);
    if(vPaid!=null&&ap!=null&&ap<vPaid) score+=50+(vPaid-ap);
    else if(ap!=null&&vPaid==null) score+=10;
    if(a.oss_self_host&&a.oss_self_host!=='not stated'&&/self|oss|open/i.test(String(a.oss_self_host))) score+=15;
    return {a,score,ap};
  }).sort((x,y)=>y.score-x.score||x.a.name.localeCompare(y.a.name));
  const cheaper=scored.filter(x=>x.score>=50||x.a.free==='yes');
  const top=cheaper.length?cheaper:scored.slice(0,8);
  const answer=`As of ${v.checked}, ${v.name} states paid entry as ${v.paid_from||'not stated'}${v.has_free_tier?` and a free plan (${v.free_tier})`:` with no free plan (${v.free_tier||'trial / paid only'})`}. Among ${peers.length} verified ${C[v.cat].name} peers in our dataset, ${top.filter(x=>x.a.free==='yes').length} list a free plan and ${top.filter(x=>vPaid!=null&&x.ap!=null&&x.ap<vPaid).length} state a lower numeric paid_from than ${v.name}. We never invent a blended bill — compare stated fields below or run the free savings estimate.`;
  const faq=[
    [`What are cheaper ${v.name} alternatives?`, answer],
    [`Does ${v.name} have a free tier?`, v.has_free_tier?`Yes: ${v.free_tier}`:`No free plan stated: ${v.free_tier||'trial / paid only'}`],
    ['How do you decide “cheaper”?', 'Only from recorded free-tier presence and stated paid_from figures in vendors.json. No invented unit costs. Use the free audit estimate for usage-based savings.'],
    ['Last verified?', `${v.name}: ${v.checked} (${v.url}). Peers use their own check dates in the table.`],
  ];
  const rows=top.slice(0,12).map(({a,ap})=>`<tr>
<td><a href="../vendors/${a.id}.html"><b>${esc(a.name)}</b></a></td>
<td>${pill(a.free)}</td>
<td class="sm">${esc(a.free_tier||'—')}</td>
<td class="sm">${esc(a.paid_from||'not stated')}</td>
<td class="sm mut">${esc(a.checked)}</td>
<td class="sm">${vPaid!=null&&ap!=null&&ap<vPaid?'Lower stated paid_from':a.free==='yes'?'Has free plan':'Peer'}</td>
</tr>`).join('');
  P(file,`${v.name} alternatives (cheaper) 2026 — free tiers & paid entry | ${SITE}`,`Cheaper ${v.name} alternatives from verified free tiers and stated paid_from prices (checked ${v.checked}).`,`
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
<tr><td>Pricing model</td><td>${esc(v.pricing_model||'not stated')}</td></tr>
</tbody></table></div>
<h2>Verified alternatives in ${esc(C[v.cat].name)}</h2>
<div class="tw"><table><thead><tr><th>Vendor</th><th>Free?</th><th>Free limits</th><th>Paid from</th><th>Checked</th><th>Why listed</th></tr></thead><tbody>${rows}</tbody></table></div>
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
  hubLinks.push([file,`${v.name} alternatives (cheaper)`,`Peers with free plans / lower stated paid_from vs ${v.paid_from||'n/s'}.`]);
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
<li>Read the free top-line savings range. Unlock the full ranked report for $${AUDIT_PRICE} if you need levers and a migration plan.</li>
</ol>
<h2>Related alternatives</h2>
<div class="grid">${alts.map(a=>`<a class="card" href="../vendors/${a.id}.html"><h3>${esc(a.name)}</h3><p>${pill(a.free)} ${esc((a.paid_from||a.free_tier||'').slice(0,100))}</p></a>`).join('')}</div>
${related([
  [`${id}-pricing.html`,`${v.name} pricing (2026)`],
  [`${id}-alternatives.html`,`${v.name} alternatives (cheaper)`],
  ...(id==='datadog'||id==='newrelic'?[[`cut-${id}-bill.html`,`How to cut your ${v.name} bill`]]:[]),
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

return {org:ORG,guideCount:hubLinks.length+1,guideFiles:['guides/index.html',...hubLinks.map(x=>x[0])],striking:hubLinks.slice(0,12)};
}
