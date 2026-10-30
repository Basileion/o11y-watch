// Dev-only: renders original SVG/PNG visuals into assets/ with headless Chrome (CHROME_BIN). Run after a build: node scripts/build.mjs && node scripts/visuals.mjs
import fs from 'node:fs'; import path from 'node:path'; import {execFileSync} from 'node:child_process'; import os from 'node:os';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');const A=p=>path.join(root,'assets',p);
const CH=process.env.CHROME_BIN||'/usr/bin/google-chrome';const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'vis-'));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shot=(url,outp,w,h)=>{execFileSync(CH,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1',`--window-size=${w},${h}`,'--virtual-time-budget=1500',`--screenshot=${outp}`,url],{stdio:'ignore'})};
const html=(body,w,h)=>{const f=path.join(tmp,Math.random().toString(36).slice(2)+'.html');fs.writeFileSync(f,`<!doctype html><meta charset=utf-8><style>*{box-sizing:border-box;margin:0}body{width:${w}px;height:${h}px;overflow:hidden;font-family:Inter,ui-sans-serif,sans-serif;-webkit-font-smoothing:antialiased}</style>${body}`);return 'file://'+f};
const render=(body,outp,w=1200,h=630)=>shot(html(body,w,h),outp,w,h);
const vendors=JSON.parse(fs.readFileSync(path.join(root,'data/vendors.json'),'utf8')), changes=JSON.parse(fs.readFileSync(path.join(root,'data/changes.json'),'utf8'));
const nV=vendors.length,nVer=vendors.filter(v=>v.has_free_tier===true||v.has_free_tier===false).length,nFree=vendors.filter(v=>v.has_free_tier===true).length,nCh=changes.length;
const mark=s=>`<svg width="${s}" height="${s}" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b5bf7"/><stop offset="1" stop-color="#c026d3"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><path d="M6 19h4l2.5-7 4 12 3-9 1.5 4H26" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// ---- Hero "pricing diff" card (real data: UptimeRobot 2026-10-24 change) — SVG used on site + PNG
const diff=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 400" width="560" height="400" role="img" aria-label="Example O11y Watch alert: UptimeRobot is A/B testing paid prices, Team $33 to $39 and Scale $67 to $79 per month on annual billing; +18% only if the higher prices stick">
<defs><linearGradient id="hb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b5bf7"/><stop offset="1" stop-color="#c026d3"/></linearGradient><filter id="s" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#1e1b4b" flood-opacity=".25"/></filter></defs>
<rect x="20" y="16" width="520" height="360" rx="18" fill="#101217" filter="url(#s)"/><rect x="20" y="16" width="520" height="44" rx="18" fill="#171a21"/><rect x="20" y="42" width="520" height="18" fill="#171a21"/>
<circle cx="46" cy="38" r="6" fill="#f87171"/><circle cx="66" cy="38" r="6" fill="#fbbf24"/><circle cx="86" cy="38" r="6" fill="#4ade80"/>
<text x="110" y="43" fill="#8b93a1" font-family="ui-monospace,Menlo,monospace" font-size="13">uptimerobot.com/pricing · diff 2026-10-16 → 2026-10-24</text>
<g font-family="ui-monospace,Menlo,monospace" font-size="15">
<rect x="40" y="80" width="480" height="30" rx="6" fill="#3b1219"/><text x="52" y="100" fill="#fca5a5">− Team    $33/mo billed annually</text>
<rect x="40" y="114" width="480" height="30" rx="6" fill="#0f2e1c"/><text x="52" y="134" fill="#86efac">+ Team    $39/mo billed annually</text>
<rect x="40" y="152" width="480" height="30" rx="6" fill="#3b1219"/><text x="52" y="172" fill="#fca5a5">− Scale   $83/mo monthly</text>
<rect x="40" y="186" width="480" height="30" rx="6" fill="#0f2e1c"/><text x="52" y="206" fill="#86efac">+ Scale   $98/mo monthly</text></g>
<rect x="40" y="236" width="480" height="118" rx="12" fill="#0b0d12" stroke="#2a2f3a"/><rect x="56" y="254" width="96" height="24" rx="12" fill="url(#hb)"/><text x="104" y="271" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif" font-size="12" font-weight="700">PRICE ALERT</text>
<text x="164" y="271" fill="#8b93a1" font-family="Inter,sans-serif" font-size="13">O11y Watch · source linked</text>
<text x="56" y="304" fill="#eceef2" font-family="Inter,sans-serif" font-size="20" font-weight="700">UptimeRobot is testing higher prices</text>
<text x="56" y="326" fill="#8b93a1" font-family="Inter,sans-serif" font-size="14">Team $33–$39 · Scale $67–$79/mo (annual), A/B test.</text>
<text x="56" y="344" fill="#8b93a1" font-family="Inter,sans-serif" font-size="14">+18% only if the test settles on $39/$79.</text></svg>`;
fs.writeFileSync(A('img/hero-diff.svg'),diff);
// ---- Pro feature visual (alert email + CSV export mock) — illustrative, built from real change data
const proSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 380" width="560" height="380" role="img" aria-label="Illustration of O11y Watch Pro: a same-day alert email and a CSV price-history export">
<defs><filter id="s2" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#1e1b4b" flood-opacity=".22"/></filter><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b5bf7"/><stop offset="1" stop-color="#c026d3"/></linearGradient></defs>
<rect x="16" y="20" width="330" height="220" rx="16" fill="#fff" stroke="#e6e7eb" filter="url(#s2)"/>
<text x="36" y="52" fill="#5c6370" font-family="Inter,sans-serif" font-size="12">From: O11y Watch Pro · within ~24h of detection</text>
<text x="36" y="82" fill="#0b0d12" font-family="Inter,sans-serif" font-size="18" font-weight="700">Lunary: free signups ended</text>
<text x="36" y="108" fill="#5c6370" font-family="Inter,sans-serif" font-size="13">“Payment is required to activate your</text><text x="36" y="126" fill="#5c6370" font-family="Inter,sans-serif" font-size="13">workspace.” Cloud from $20/user/mo.</text>
<text x="36" y="156" fill="#5c6370" font-family="Inter,sans-serif" font-size="13">Alternatives with a verified free tier:</text><text x="36" y="176" fill="#0b0d12" font-family="Inter,sans-serif" font-size="13" font-weight="600">Langfuse · Helicone · Arize AX · Opik</text>
<rect x="36" y="196" width="120" height="28" rx="7" fill="#0b0d12"/><text x="96" y="215" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif" font-size="12" font-weight="600">View source ↗</text>
<rect x="210" y="150" width="334" height="210" rx="16" fill="#101217" filter="url(#s2)"/><text x="230" y="180" fill="#8b93a1" font-family="ui-monospace,Menlo,monospace" font-size="12">price-history.csv</text>
<g font-family="ui-monospace,Menlo,monospace" font-size="12" fill="#eceef2"><text x="230" y="208" fill="#8b8bff">date,vendor,plan,field,old,new</text><text x="230" y="232">2026-10-24,UptimeRobot,Team,annual,$33,$39</text><text x="230" y="254">2026-10-24,UptimeRobot,Scale,monthly,$83,$98</text><text x="230" y="276">2026-10-24,Lunary,Free,status,open,paid</text><text x="230" y="298">2026-10-16,Logz.io,Metrics,pricing,…,new</text></g>
<rect x="230" y="318" width="96" height="24" rx="12" fill="url(#pg)"/><text x="278" y="335" text-anchor="middle" fill="#fff" font-family="Inter,sans-serif" font-size="11" font-weight="700">PRO EXPORT</text></svg>`;
fs.writeFileSync(A('img/pro-visual.svg'),proSvg);
// ---- Icons
fs.writeFileSync(A('img/favicon.svg'),mark(32).replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"'));
for(const [n,s] of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512],['favicon-32.png',32]])render(`<style>body{background:transparent}</style><div style="width:${s}px;height:${s}px">${mark(s)}</div>`,A('img/'+n),s,s);
// ---- OG images
const bg='background:radial-gradient(800px 400px at 100% 0,rgba(192,38,211,.28),transparent),radial-gradient(700px 400px at 0 100%,rgba(91,91,247,.3),transparent),#08090c;color:#fff';
const og=(eyebrow,title,sub,right='',foot=`${nV} vendors · ${nVer} verified · ${nCh} logged changes · o11y-watch.pages.dev`)=>`<div style="${bg};width:1200px;height:630px;padding:64px 72px;display:flex;flex-direction:column">
<div style="display:flex;align-items:center;gap:14px;font-size:30px;font-weight:700;letter-spacing:-.02em">${mark(48)}O11y <span style="color:#8b93a1">Watch</span></div>
<div style="display:flex;gap:40px;flex:1;align-items:center"><div style="flex:1"><div style="font:600 18px ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#a5a5ff">${esc(eyebrow)}</div>
<div style="font-size:${title.length>40?56:68}px;font-weight:800;letter-spacing:-.035em;line-height:1.05;margin:14px 0 18px">${esc(title)}</div><div style="font-size:26px;line-height:1.35;color:#b4bac6;max-width:${right?620:960}px">${esc(sub)}</div></div>${right}</div>
<div style="font-size:19px;color:#8b93a1;border-top:1px solid #23262f;padding-top:18px">${esc(foot)}</div></div>`;
const diffImg=`<img src="file://${A('img/hero-diff.svg')}" width="470">`;
render(og('Observability pricing tracker','The free tier is the product. We watch it.',`Free tiers & pricing changes for ${nV} observability tools — sourced, dated, diffed weekly.`,diffImg),A('og/home.png'));
render(og('O11y Watch Pro · $6/mo','Same-day pricing alerts + exports',`Know within a day when a vendor moves its pricing. Full snapshot history, CSV/JSON. Cancel anytime.`,`<img src="file://${A('img/pro-visual.svg')}" width="480">`),A('og/pro.png'));
render(og('Sponsor · founding rates','Reach engineers choosing observability tools',`One labeled sponsor per weekly issue, plus site placement. Founding rates from $39.`),A('og/sponsor.png'));
render(og('Compare free tiers','Side-by-side observability free tiers',`Pick any 3 of ${nV} tools: limits, gotchas, check date and source link.`),A('og/compare.png'));
render(og('Change log',`${nCh} pricing changes logged`,`Price increases, removed free tiers and sunsets — each with a source link.`,diffImg),A('og/changes.png'));
fs.mkdirSync(A('og/vendors'),{recursive:true});
for(const v of vendors){const ver=v.has_free_tier===true||v.has_free_tier===false;const st=!ver?['UNVERIFIED','#fbbf24']:v.has_free_tier?['FREE TIER','#4ade80']:['NO FREE TIER','#f87171'];
 const sum=ver?(v.free_tier||'').slice(0,150):'Free tier not yet verified — pricing page snapshot saved.';
 render(og(v.type||'Observability',`${v.name} free tier & pricing`,sum,`<div style="border:2px solid ${st[1]};color:${st[1]};border-radius:99px;padding:10px 22px;font:700 22px ui-monospace,Menlo,monospace;white-space:nowrap">${st[0]}</div>`,`Checked ${v.checked||'—'} from ${v.url.replace(/^https?:\/\//,'').replace(/\/$/,'')} · o11y-watch.pages.dev`),A(`og/vendors/${v.id}.png`))}
// ---- Real site screenshots (from local dist build)
const D='file://'+path.join(root,'dist');
shot(D+'/compare.html?v=sentry,honeybadger,rollbar',A('img/shot-compare.png'),1280,820);
shot(D+'/index.html',A('img/shot-home.png'),1280,820);
shot(D+'/directory.html',A('img/shot-directory.png'),1280,820);
// ---- Launch gallery (1270x760, Product Hunt size)
const frame=(img,t,s)=>`<div style="${bg};width:1270px;height:760px;padding:48px 60px;display:flex;flex-direction:column;align-items:center"><div style="font-size:44px;font-weight:800;letter-spacing:-.03em">${t}</div><div style="font-size:22px;color:#b4bac6;margin:8px 0 26px">${s}</div>${img}</div>`;
render(frame(`<img src="file://${A('img/hero-diff.svg')}" width="760">`,'Every pricing change, as a diff','UptimeRobot started testing ~18% higher prices on 2026-10-24. We caught both versions and linked the source.'),A('launch/1-pricing-diff.png'),1270,760);
render(frame(`<img src="file://${A('img/shot-compare.png')}" width="1000" style="border-radius:14px;border:1px solid #2a2f3a;box-shadow:0 20px 60px rgba(0,0,0,.5)">`,`Compare ${nV} free tiers side by side`,'Limits, gotchas, check date and the vendor’s own pricing page — no guesses.'),A('launch/2-compare.png'),1270,760);
render(frame(`<img src="file://${A('img/pro-visual.svg')}" width="820">`,'Pro: same-day alerts + exports','$6/mo. Within ~24h of detection, with full history as CSV/JSON. Cancel anytime.'),A('launch/3-pro.png'),1270,760);
fs.rmSync(tmp,{recursive:true,force:true});console.log('visuals done');
