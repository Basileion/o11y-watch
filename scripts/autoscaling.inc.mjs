// Datadog autoscaling cost guide (RT-20261031-121). Every $ figure is computed from data/audit-rates.json
// (datadog/grafana/dynatrace/signoz, vendor pages read on their checked date). Billing rules are quoted from
// Datadog's own docs, re-read 2026-10-31. build.mjs guards printed rates + example rows against the data file.
export const SLUG='guides/datadog-autoscaling-cost.html';
export const CHECKED='2026-10-31';
export const MONTH_HOURS=720; // example month: 30 days (e.g. November)
const usd=n=>{if(n>0&&n<0.1)return '$'+String(Math.round(n*1e4)/1e4);const r=Math.round(n*100)/100;return '$'+r.toLocaleString('en-US',{minimumFractionDigits:Number.isInteger(r)?0:2,maximumFractionDigits:2})};
// Billable host count per Datadog's stated rule: high-water mark of the lower 99% of hourly counts (top 1% of hours excluded).
// Datadog does not say how it rounds 1% of hours, so we compute both floor and ceil and only print examples where they agree.
export function billedHosts(hourly){const s=[...hourly].sort((a,b)=>b-a);const lo=Math.floor(s.length*0.01),hi=Math.ceil(s.length*0.01);return {floor:s[lo],ceil:s[hi],billed:s[lo]===s[hi]?s[lo]:null}}
export function curve(base,peak,peakHours){const h=Array(MONTH_HOURS).fill(base);for(let i=0;i<peakHours;i++)h[i]=peak;return h}
// EXAMPLE inputs (made up to show the math; not customer data, not an average).
export const EXAMPLES=[
  {id:'steady',label:'Steady fleet',desc:'40 hosts every hour of the month',base:40,peak:40,peakHours:0},
  {id:'loadtest',label:'One load test',desc:'40 hosts, plus one 5-hour load test at 200 hosts',base:40,peak:200,peakHours:5},
  {id:'batch',label:'Nightly batch',desc:'40 hosts, scaling to 70 for 2 hours every night (30 nights = 60 hours)',base:40,peak:70,peakHours:60},
  {id:'weekday',label:'Weekday peak (HPA)',desc:'40 hosts, scaling to 100 for 3 hours every weekday (22 weekdays = 66 hours)',base:40,peak:100,peakHours:66},
];
export function exampleRows(DD){
  const R=DD.rates,PR=R.products;
  return EXAMPLES.map(e=>{const h=curve(e.base,e.peak,e.peakHours);const b=billedHosts(h);const avg=h.reduce((s,x)=>s+x,0)/h.length;const hostHours=h.reduce((s,x)=>s+x,0);
    return {...e,share:e.peakHours/MONTH_HOURS,avg,billed:b.billed,floor:b.floor,ceil:b.ceil,hostHours,
      infraAnnual:b.billed*R.host_mo_annual,infraOnDemand:b.billed*R.host_mo_ondemand,infraApmAnnual:b.billed*(R.host_mo_annual+PR.apm_host_mo_annual)}});
}
export function containerExample(DD){
  const R=DD.rates,PR=R.products;const nodes=40,containers=260;const allot=nodes*PR.containers_allot_per_pro_host;const over=Math.max(0,containers-allot);
  return {nodes,containers,allot,over,onDemand:over*MONTH_HOURS*PR.container_hr_ondemand,prepaid:over*PR.container_mo,nodeAgent:nodes*R.host_mo_annual,agentPerContainer:containers*R.host_mo_annual};
}
// Hourly rates parsed from the dataset's own text fields (grafana apm_label, dynatrace fullstack.billed), so they can't drift.
export function hourlyRates(RJ){
  const g=/\$([\d.]+)\/host hour/.exec(RJ.vendors.grafana.rates.apm_label),d=/\$([\d.]+) per memory-GiB-hour/.exec(RJ.vendors.dynatrace.rates.host_tiers.fullstack.billed);
  if(!g||!d)throw new Error('autoscaling guide: hourly rate text missing from data/audit-rates.json');
  return {grafanaHostHour:Number(g[1]),dynatraceGibHour:Number(d[1])};
}
export function altRows(RJ,row){
  const H=hourlyRates(RJ),GIB=8; // 8 GiB = example host size (Dynatrace prices Full-Stack per 8 GiB host)
  return {...H,gib:GIB,grafanaApm:row.hostHours*H.grafanaHostHour,dynatrace:row.hostHours*GIB*H.dynatraceGibHour,ddApm:row.billed*RJ.vendors.datadog.rates.products.apm_host_mo_annual};
}
export default function autoscalingGuide({RJ,P,BASE,SITE,esc,crumbs,crumbLd,ORG,auditCta,cta,cite,related,hubLinks}){
  const DD=RJ.vendors.datadog,R=DD.rates,PR=R.products,CHK=CHECKED;
  const L=(u,t)=>`<a href="${u}" rel="nofollow noopener">${esc(t)}</a>`;
  const SRC={bill:'https://docs.datadoghq.com/account_management/billing/',plans:'https://docs.datadoghq.com/account_management/billing/pricing/',cont:'https://docs.datadoghq.com/account_management/billing/containers/',aws:'https://docs.datadoghq.com/account_management/billing/aws/',list:'https://www.datadoghq.com/pricing/list/',pricing:'https://www.datadoghq.com/pricing/',r1:'https://www.reddit.com/r/sre/comments/1ow3ltg/',r2:'https://www.reddit.com/r/sre/comments/1owwfjy/'};
  const rate=(id,v,txt)=>`<span data-rate="${id}" data-price="${v}">${txt||usd(v)}</span>`;
  const X=exampleRows(DD),C=containerExample(DD),W=X.find(x=>x.id==='weekday'),A=altRows(RJ,W);
  const title=`Why autoscaling raises your Datadog bill (2026): 99th-percentile host billing explained | ${SITE}`;
  const desc=`Datadog bills hosts on the high-water mark of the lower 99% of hourly counts, so repeated scale-outs set the month's host count. Datadog's rules, a worked example at list prices (${usd(R.host_mo_annual)}/host annual), containers, Fargate and the levers Datadog documents. Checked ${CHK}.`;
  const answer=`Datadog counts your hosts every hour and, on its standard high-water-mark plan, bills the month on "the maximum count (high-water mark) of the lower 99 percent of usage for those hours", excluding the top 1 percent. So a one-off spike shorter than about 1% of the month (roughly 7 hours of a 720-hour month) is dropped, but a scale-out that repeats (a daily HPA peak, a nightly batch) usually lasts more than 1% of hours and becomes the billed host count for the whole month. At Infrastructure Pro list price (${usd(R.host_mo_annual)}/host/month annual, ${usd(R.host_mo_ondemand)} on-demand, checked ${CHK}), each extra peak host costs the full monthly rate even if it ran a few hours a day. Datadog's documented alternative for autoscaling fleets is the hybrid monthly/hourly plan.`;
  const faq=[
    ['Why does autoscaling raise my Datadog bill?',answer],
    ['Does Datadog bill my peak host count?',`Not the single highest hour. Datadog's billing docs say: "The billable count of hosts is calculated at the end of the month using the maximum count (high-water mark) of the lower 99 percent of usage for those hours. Datadog excludes the top 1 percent to reduce the impact of spikes in usage on your bill." In practice, any host count you hold for more than about 1% of the month's hours sets the bill.`],
    ['How many hours is the top 1%?',`In a 30-day month (720 hours), 1% is 7.2 hours; in a 31-day month (744 hours), 7.44 hours. Datadog does not say how it rounds, so treat a spike of about 7 hours or less as dropped and anything longer as billed.`],
    ['Are containers billed as hosts?',`Only if you put the Agent inside each container. Datadog: "If you choose to install the Agent directly in each container, each container is counted as a host from a billing perspective." With one containerized Agent per node, containers are a separate meter: ${PR.containers_allot_per_pro_host} per Pro host included (10 on Enterprise), averaged across your infrastructure, then ${usd(PR.container_hr_ondemand)} per container per hour, or prepaid at ${usd(PR.container_mo)} per container per month.`],
    ['How is AWS Fargate billed by Datadog?',`Datadog's containers billing docs say: "Fargate is charged based on the concurrent number of monitored tasks in ECS Fargate and the concurrent number of monitored pods for EKS Fargate." Fargate is metered on tasks or pods, not hosts. The AWS Fargate tab on datadoghq.com/pricing lists Serverless Application Monitoring from ${usd(PR.fargate_app_instance_mo_annual)} per active application instance per month (billed annually; ${usd(PR.fargate_app_instance_mo_ondemand)} on-demand).`],
    ['Is there a Datadog plan for autoscaling?',`Yes. Datadog's pricing docs describe a hybrid monthly/hourly plan (MHP): "You commit to a monthly minimum, and any host hours above that commitment are billed at an hourly rate", and call it "well-suited to ephemeral environments, such as autoscaling fleets or short-lived workloads." The hourly rate is not on the public list page; Datadog says to contact Sales or your Customer Success Manager.`],
  ];
  // inline SVG: weekday example, one week shown (168 h), billed line vs average line
  const svg=(()=>{const Wd=600,H=180,pad=28,maxY=110;const hrs=168;const pts=[];for(let i=0;i<hrs;i++){const day=Math.floor(i/24),hr=i%24;const peak=day<5&&hr>=13&&hr<16;pts.push(peak?W.peak:W.base)}
    const x=i=>pad+(Wd-pad-8)*i/(hrs-1),y=v=>H-pad-(H-pad-10)*v/maxY;
    const d=pts.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    return `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img" aria-label="Example host count over one week: 40 hosts, rising to 100 for 3 hours each weekday. The billed line sits at 100 hosts; the average is ${W.avg.toFixed(1)}." style="max-width:640px;display:block;margin:12px 0"><rect x="0" y="0" width="${Wd}" height="${H}" fill="none"/><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="${pad}" x2="${Wd-8}" y1="${y(W.billed)}" y2="${y(W.billed)}" stroke="#d9534f" stroke-dasharray="5 4" stroke-width="1.6"/><text x="${pad+4}" y="${y(W.billed)-5}" font-size="12" fill="#d9534f">Billed: ${W.billed} hosts (lower-99% high-water mark)</text><line x1="${pad}" x2="${Wd-8}" y1="${y(W.avg)}" y2="${y(W.avg)}" stroke="#2a9d8f" stroke-dasharray="2 3" stroke-width="1.6"/><text x="${pad+4}" y="${y(W.avg)+15}" font-size="12" fill="#2a9d8f">Average: ${W.avg.toFixed(1)} hosts</text><text x="${pad}" y="${H-8}" font-size="11" opacity=".7">Mon → Sun (example week, 168 hours)</text><text x="2" y="${y(100)+4}" font-size="10" opacity=".7">100</text><text x="6" y="${y(40)+4}" font-size="10" opacity=".7">40</text></svg>`})();
  const n=v=>v.toLocaleString('en-US',{maximumFractionDigits:1});
  const exTable=`<div class="tw"><table class="asc"><thead><tr><th>Example host curve (made up)</th><th>Hours at peak</th><th>Average hosts</th><th>Billed hosts</th><th>Infra Pro, annual</th><th>Infra Pro, on-demand</th><th>Infra Pro + APM, annual</th></tr></thead><tbody>${X.map(r=>`<tr data-ex="${r.id}" data-billed="${r.billed}" data-v="${r.infraAnnual}"><td><b>${esc(r.label)}</b><div class="sm">${esc(r.desc)}</div></td><td data-l="Hours at peak">${r.peakHours} of ${MONTH_HOURS} (${(r.share*100).toFixed(1)}%)</td><td data-l="Average hosts">${n(r.avg)}</td><td data-l="Billed hosts"><b>${r.billed}</b></td><td data-l="Infra Pro, annual">${r.billed} × ${rate('dd-host-annual',R.host_mo_annual)} = <b>${usd(r.infraAnnual)}</b></td><td data-l="Infra Pro, on-demand">${r.billed} × ${rate('dd-host-ondemand',R.host_mo_ondemand)} = ${usd(r.infraOnDemand)}</td><td data-l="+ APM, annual">${r.billed} × (${usd(R.host_mo_annual)} + ${rate('dd-apm-annual',PR.apm_host_mo_annual)}) = ${usd(r.infraApmAnnual)}</td></tr>`).join('')}</tbody></table></div>`;
  const hub=[SLUG,'Why autoscaling raises your Datadog bill',`99th-percentile host billing, containers, Fargate and the hybrid hourly plan, with a worked example at list prices. Checked ${CHK}.`];
  P(SLUG,title,desc,`
${crumbs([{href:'../index.html',label:'Home'},{href:'index.html',label:'Guides'},{href:'#',label:'Datadog autoscaling cost'}])}
<style>.asc td,.asc th{vertical-align:top}@media(max-width:640px){table.asc thead{display:none}table.asc,table.asc tbody,table.asc tr,table.asc td{display:block;width:auto}table.asc tr{border-bottom:1px solid rgba(127,127,127,.25);padding:10px 0}table.asc td{border:0;padding:2px 0}table.asc td[data-l]::before{content:attr(data-l) ": ";font-weight:600;opacity:.7}}main blockquote{margin:10px 0;padding:6px 12px;border-left:3px solid rgba(127,127,127,.4)}</style>
<div class="eyebrow">Checked ${esc(CHK)} · Datadog docs and list prices</div>
<h1 style="font-size:clamp(28px,4vw,44px);margin-top:8px">Why autoscaling raises your Datadog bill</h1>
<p class="lede" style="font-size:18px;color:var(--mut);max-width:760px"><b>Answer (${esc(CHK)}):</b> ${esc(answer)}</p>
<p class="sm mut">Billing rules quoted from Datadog's own docs (${L(SRC.bill,'Billing')}, ${L(SRC.plans,'Pricing')}, ${L(SRC.cont,'Containers Billing')}), re-read ${esc(CHK)}. Prices are Datadog list prices from ${L(SRC.list,'datadoghq.com/pricing/list')} and ${L(SRC.pricing,'datadoghq.com/pricing')}, read ${esc(CHK)}. Your contract may differ.</p>

<blockquote><i>“Datadog's per-host pricing model is brutal when you autoscale”</i> · <i>“We're getting far better at auto-scaling (HPA)… causes our DD fees to go up (pay per unique host monitored…)”</i><div class="sm mut">Public r/sre threads: ${L(SRC.r1,'1ow3ltg')}, ${L(SRC.r2,'1owwfjy')}</div></blockquote>

<h2 id="rule">The rule: hourly host counts, top 1% of hours dropped</h2>
<ul>
<li><b>Datadog's words:</b> “Datadog meters the count of hosts and custom metrics hourly. The billable count of hosts is calculated at the end of the month using the maximum count (high-water mark) of the lower 99 percent of usage for those hours. Datadog excludes the top 1 percent to reduce the impact of spikes in usage on your bill.” (${L(SRC.bill,'Billing docs')})</li>
<li><b>What that means:</b> sort the month's hourly host counts, drop the top 1% of hours, and the highest remaining hour is the host count you pay for, at the full monthly per-host price. In a 720-hour month, 1% is 7.2 hours. Datadog doesn't say how it rounds.</li>
<li><b>Same rule for APM hosts</b> and other host-based products (Database Monitoring, Continuous Profiler, Cloud Network Monitoring) on the high-water-mark plan (${L(SRC.plans,'Pricing docs')}).</li>
<li><b>Non-reporting hosts don't count:</b> hosts with status INACTIVE drop out, though Datadog says that “could take up to 2 hours”.</li>
<li><b>What counts as a host:</b> “any physical or virtual OS instance that you monitor”: a VM, a Kubernetes node, an Azure App Service Plan instance, a Heroku dyno, plus EC2, Google Cloud, Azure or vSphere VMs picked up by integrations (no double-billing when the Agent also runs there).</li>
</ul>

<h2 id="spike">How a short scale-out sets the month's host count</h2>
<p>A single spike shorter than the top 1% of hours is excluded. A scale-out that <b>repeats</b> adds up: 3 hours every weekday is 66 hours, 9.2% of the month, far more than 1%. The peak becomes the billed count for all 720 hours.</p>
${svg}
<h3 id="example">Example (example inputs, not data)</h3>
<p class="sm"><b>Example inputs, made up to show the math:</b> the host curves below are invented. They are not from any customer and are not an average. Month = ${MONTH_HOURS} hours. Prices: Datadog Infrastructure Pro ${usd(R.host_mo_annual)}/host/month billed annually, ${usd(R.host_mo_ondemand)} on-demand; APM ${usd(PR.apm_host_mo_annual)}/APM host/month annual (list, read ${esc(CHK)}). Billed hosts use Datadog's lower-99% rule; each row gives the same answer whether 1% of hours rounds down (7) or up (8).</p>
${exTable}
<p><b>Reading the table:</b> the weekday-peak fleet averages ${n(W.avg)} hosts but is billed for ${W.billed}, ${(W.billed/W.avg).toFixed(1)}× its average. At annual list price that is ${usd(W.infraAnnual)}/mo for infrastructure, against ${usd(X[0].infraAnnual)} for the steady 40. The one-off 5-hour load test at 200 hosts is dropped, because 5 hours is under 1% of the month.</p>

<h2 id="containers">Containers, Kubernetes and Fargate</h2>
<ul>
<li><b>One Agent per node, not per container.</b> Datadog: “It is recommended that containers are monitored with a single containerized Agent per host… If you choose to install the Agent directly in each container, each container is counted as a host from a billing perspective.” (${L(SRC.bill,'Billing docs')})</li>
<li><b>Container allotment scales with hosts.</b> “Depending on your plan, you can monitor 5 or 10 containers free for each host license. The container count is averaged across your entire infrastructure.” For autoscaling groups, Datadog says “the total container allotment also increases” during peak hours, because the allotment follows the host count (${L(SRC.cont,'Containers Billing docs')}).</li>
<li><b>Over the allotment:</b> ${rate('dd-container-hr',PR.container_hr_ondemand)} per container per hour on-demand, or prepaid at ${rate('dd-container-mo',PR.container_mo)} per container per month (${L(SRC.pricing,'datadoghq.com/pricing')}). Containers are metered every 5 minutes and averaged per hour, so “1200 on-demand containers during a single five-minute interval” are metered as 100 container hours. Pause containers and the Agent's own containers don't count.</li>
<li><b>AWS Fargate is not a host.</b> “Fargate is charged based on the concurrent number of monitored tasks in ECS Fargate and the concurrent number of monitored pods for EKS Fargate.” The AWS Fargate tab on datadoghq.com/pricing lists Serverless Application Monitoring from ${rate('dd-fargate-app',PR.fargate_app_instance_mo_annual)} per active application instance per month (annual; ${usd(PR.fargate_app_instance_mo_ondemand)} on-demand) and Serverless Application APM from ${rate('dd-fargate-apm',PR.fargate_apm_instance_mo_annual)} (${usd(PR.fargate_apm_instance_mo_ondemand)} on-demand), averaged over 5-minute intervals.</li>
<li><b>GKE Autopilot</b> is billed under the Serverless category, unlike GKE Standard.</li>
</ul>
<p class="sm"><b>Example (example inputs, not data):</b> ${C.nodes} Kubernetes nodes running ${C.containers} containers all month on Infrastructure Pro. With one Agent per node: ${C.nodes} hosts × ${usd(R.host_mo_annual)} = <b data-ex="containers-node" data-v="${C.nodeAgent}">${usd(C.nodeAgent)}</b>, plus ${C.over} containers over the ${C.allot} included × ${MONTH_HOURS} h × ${usd(PR.container_hr_ondemand)} = <span data-ex="containers-od" data-v="${Math.round(C.onDemand*100)/100}">${usd(C.onDemand)}</span> on-demand (or ${C.over} × ${usd(PR.container_mo)} = ${usd(C.prepaid)} prepaid). With the Agent inside every container, Datadog counts each container as a host: ${C.containers} × ${usd(R.host_mo_annual)} = <b data-ex="containers-agent" data-v="${C.agentPerContainer}">${usd(C.agentPerContainer)}</b>.</p>

<h2 id="levers">Levers Datadog documents</h2>
<ol>
<li><b>Ask about the hybrid monthly/hourly plan (MHP).</b> “You commit to a monthly minimum, and any host hours above that commitment are billed at an hourly rate… well-suited to ephemeral environments, such as autoscaling fleets or short-lived workloads.” The high-water-mark plan is “well-suited to environments with stable usage throughout the month.” The hourly rate isn't on the public list (${L(SRC.plans,'Pricing docs')}).</li>
<li><b>Commit to the baseline, not the peak.</b> Infrastructure Pro is ${usd(R.host_mo_annual)} annual vs ${usd(R.host_mo_ondemand)} on-demand; APM ${usd(PR.apm_host_mo_annual)} vs ${usd(PR.apm_host_mo_ondemand)}. Plan &amp; Usage → Subscription Details shows your contract and on-demand price per product.</li>
<li><b>Run one containerized Agent per node</b> (a DaemonSet in Kubernetes), never one per container.</li>
<li><b>Prepay containers you always run.</b> ${usd(PR.container_mo)} per container per month prepaid vs ${usd(PR.container_hr_ondemand)} per container hour on-demand. Use Container Discovery Management to limit which containers are monitored.</li>
<li><b>Stop the AWS integration from billing hosts you don't need.</b> Under “Limit Metric Collection to Specific Resources” you can filter EC2 by tag (for example <code>!datadog:no</code>). Hosts with a running Agent are still billed (${L(SRC.aws,'AWS Integration Billing docs')}).</li>
<li><b>Check how bursty jobs on Fargate would bill.</b> Datadog bills Fargate on concurrent monitored tasks or pods, not on the host high-water mark. Price both before moving anything.</li>
</ol>

${auditCta('Put your real host count, APM hosts, logs and bill into the audit. It prices each Datadog line at list price, shows what list prices can and can’t explain, and prices alternatives on the same usage.','Check what your autoscaling is costing in 2 minutes','audit-guide-dd-autoscaling')}

<h2 id="leadership">How to explain the bill to leadership</h2>
<p class="sm mut">Buyers describe the moment: <i>“leadership asked why observability costs so much”</i>, and one fix: <i>“showing our CTO a graph of host count vs Datadog bill”</i> (${L(SRC.r1,'r/sre')}).</p>
<ol>
<li><b>Show the graph:</b> hourly host count for the month, with two lines: the average and the billed count (the high-water mark of the lower 99%). Like the chart above.</li>
<li><b>Name the rule in one sentence:</b> “On the high-water-mark plan, Datadog bills our infrastructure and APM hosts on the highest host count we hold for more than about 1% of the month’s hours.”</li>
<li><b>Price the gap:</b> (billed hosts − average hosts) × your per-host rate for Infra + APM. That is the cost of the peak.</li>
<li><b>Give two options with owners:</b> the hybrid monthly/hourly plan (ask your Datadog rep for the hourly rate), and engineering changes (one Agent per node, Fargate for bursty jobs, integration filters).</li>
<li><b>Show the whole stack:</b> Datadog plus anything else you pay for, next to your cloud bill. The <a href="../audit.html" data-grow="audit-guide-dd-autoscaling-leadership">audit</a> report is built to hand over.</li>
</ol>

<h2 id="alternatives">How other vendors bill the same peak</h2>
<p class="sm"><b>Billing-unit contrast, not a quote or a like-for-like feature comparison.</b> Rates from our dataset (vendor pages read ${esc(RJ.vendors.grafana.checked)}), applied to the same made-up weekday-peak curve (${n(W.hostHours)} host-hours in the month).</p>
<div class="tw"><table class="asc"><thead><tr><th>Vendor</th><th>How hosts are billed</th><th>Example: APM on the weekday-peak curve</th></tr></thead><tbody>
<tr><td><b>Datadog</b> APM</td><td class="sm" data-l="Billing">Per APM host per month, high-water mark of the lower 99% of hours</td><td data-l="Example" data-ex="alt-dd" data-v="${A.ddApm}">${W.billed} hosts × ${usd(PR.apm_host_mo_annual)} = <b>${usd(A.ddApm)}</b></td></tr>
<tr><td><b>Grafana Cloud</b> Application Observability</td><td class="sm" data-l="Billing">Per host-hour (${rate('grafana-host-hour',A.grafanaHostHour,'$'+A.grafanaHostHour)}/host-hour = ${usd(RJ.vendors.grafana.rates.apm_host_mo)}/host/mo); no host fee for infrastructure metrics, which bill per active series</td><td data-l="Example" data-ex="alt-grafana" data-v="${Math.round(A.grafanaApm*100)/100}">${n(W.hostHours)} host-hours × $${A.grafanaHostHour} = <b>${usd(A.grafanaApm)}</b></td></tr>
<tr><td><b>Dynatrace</b> Full-Stack</td><td class="sm" data-l="Billing">${rate('dynatrace-gib-hour',A.dynatraceGibHour,'$'+A.dynatraceGibHour)} per memory-GiB-hour (${usd(RJ.vendors.dynatrace.rates.host_tiers.fullstack.mo)}/mo per 8 GiB host), drawn from an annual commit</td><td data-l="Example" data-ex="alt-dynatrace" data-v="${Math.round(A.dynatrace*100)/100}">${n(W.hostHours)} host-hours × ${A.gib} GiB (example size) × $${A.dynatraceGibHour} = <b>${usd(A.dynatrace)}</b></td></tr>
<tr><td><b>SigNoz</b> Cloud</td><td class="sm" data-l="Billing">“No host-based pricing”: logs and traces ${rate('signoz-gb',RJ.vendors.signoz.rates.log_gb)}/GB, Teams from ${usd(RJ.vendors.signoz.rates.min_mo)}/mo</td><td data-l="Example">Depends on GB, not host count. Price it in the <a href="../audit.html">audit</a></td></tr>
</tbody></table></div>
<p class="sm mut">Hourly billing charges the peak only for the hours it runs. These products differ in features, retention and included data, so price them on your full usage before deciding.</p>

${cta('Get told when Datadog changes these rules or prices','Weekly email when an observability pricing page changes, with the source link.','guide-dd-autoscaling','Subscribe free')}

<h2>FAQ</h2>
${faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}

${related([['cut-datadog-bill-without-migrating.html','Cut your Datadog bill without migrating'],['cut-datadog-bill.html','How to cut your Datadog bill'],['datadog-cost-calculator.html','Datadog cost calculator'],['datadog-pricing.html','Datadog pricing (2026)'],['datadog-alternatives.html','Datadog alternatives (cheaper)'],['../vendors/datadog.html','Datadog vendor page'],['index.html','All guides']])}
${cite(`Datadog autoscaling and host billing, Datadog docs and list prices read ${CHK}`)}
`,'../',[
    ORG,
    crumbLd([{label:'Home',href:BASE+'/'},{label:'Guides',href:BASE+'/guides/'},{label:'Datadog autoscaling cost',href:BASE+'/guides/datadog-autoscaling-cost'}]),
    {'@context':'https://schema.org','@type':'Article',headline:'Why autoscaling raises your Datadog bill',description:desc,datePublished:CHK,dateModified:CHK,author:{'@id':BASE+'/#org'},publisher:{'@id':BASE+'/#org'},mainEntityOfPage:BASE+'/guides/datadog-autoscaling-cost',about:{'@type':'SoftwareApplication',name:'Datadog',url:SRC.pricing},citation:Object.values(SRC)},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ]);
  hubLinks.unshift(hub);
  return {file:SLUG};
}
