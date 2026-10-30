// Instant Observability Cost & Stack Audit — static wizard, client-side engine, Kit unlock gate.
// Called from build.mjs. Edit questions in data/audit-form.json, rates in data/audit-rates.json.
export default function buildAudit({
  W, P, page, BASE, SITE, esc, CONTACT, fs, path, root, out,
  AUDIT_CHECKOUT, AUDIT_PRICE, AUDIT_UNLOCK_API
}) {
  const stripNotes = o => { const c = { ...o }; for (const k of Object.keys(c)) if (k.startsWith('$')) delete c[k]; return c; };
  const AUDIT_FORM = stripNotes(JSON.parse(fs.readFileSync(path.join(root, 'data/audit-form.json'), 'utf8')));
  const AUDIT_RATES = stripNotes(JSON.parse(fs.readFileSync(path.join(root, 'data/audit-rates.json'), 'utf8')));
  const unlockPath = 'audit-unlock.html';
  const unlockApi = AUDIT_UNLOCK_API || 'https://growth-ingest.basileion-ops.workers.dev';
  // Full unlock URL with ?t= is NOT built into the site — token lives only in Worker secret
  // (+ local /workspace/secrets/audit-unlock-url.txt for Kit). Path alone for docs/meta:
  const unlockUrl = `${BASE}/${unlockPath}`;

  // Copy client assets
  const jsOut = path.join(out, 'js');
  fs.mkdirSync(jsOut, { recursive: true });
  for (const f of ['audit-engine.js', 'audit-wizard.js']) {
    fs.copyFileSync(path.join(root, 'assets/js', f), path.join(jsOut, f));
  }
  W('audit-form.json', JSON.stringify(AUDIT_FORM, null, 2));
  W('audit-rates.json', JSON.stringify(AUDIT_RATES, null, 2));

  // Public /audit config: NEVER include unlockToken or unlockUrl (those leaked the gate).
  const publicCfg = {
    form: AUDIT_FORM,
    rates: AUDIT_RATES,
    checkout: AUDIT_CHECKOUT,
    price: AUDIT_PRICE,
    unlockPath,
    unlockApi,
    contact: CONTACT
  };
  // Unlock / thanks pages use the same public config — NEVER embed unlockToken in HTML.
  // Token arrives only via Kit redirect ?t= and is validated by the Worker.
  const publicCfgJson = JSON.stringify(publicCfg).replace(/</g, '\u003c');

  const AUDIT_FAQ = [
    ['How does the instant audit work?', 'You answer a short survey (and optionally drop a usage CSV). A deterministic engine runs entirely in your browser against O11y Watch public pricing data. Nothing is uploaded to our servers.'],
    ['Are the numbers quotes?', 'No — they are estimates labeled with sources and check dates from our dataset. If a vendor lacks public unit rates for every dimension you use, we list them under “Insufficient public pricing data” and never show them as savings.'],
    ['What is free vs paid?', `The top-line savings range is free. The full ranked report, levers, migration plan, and Print/PDF view unlock for $${AUDIT_PRICE} via Kit. After payment you are sent straight back to unlock the full report in this browser.`],
    ['How is the unlock gate secured?', 'Pre-purchase pages show only the free teaser — the full report is not in the DOM. Kit’s thank-you redirect includes an unguessable token; our server validates it and stores a proof in this browser. Anyone with the unlock link can still open the report. This is not account auth. The cost engine itself is public client-side code.'],
    ['Is my CSV uploaded?', 'No. CSV parsing happens only in your browser. We never receive the file.'],
    ['What is not included?', 'Implementation, negotiated enterprise discounts, on-call coverage, or multi-cloud FinOps programs. Self-host software may be $0 where stated; we always add an explicit infra+ops cost range with stated assumptions rather than implying $0 TCO.']
  ];

  const AUDIT_GET = [
    ['01', 'Instant model', 'Current cost estimate from your usage + public unit rates.'],
    ['02', 'Covered alternatives', 'Only SaaS options with public rates for every dimension you use; partial coverage listed separately.'],
    ['03', 'Self-host options', 'OSS stacks where the dataset says self-host is available — software $0 plus an explicit infra+ops estimate range.'],
    ['04', 'Savings levers', 'Retention, sampling, log filters, seat rationalization — heuristic % only.'],
    ['05', 'Migration plan', 'Ranked sequence with Low / Medium / High effort ratings + Print/PDF.']
  ];

  const boot2 = `
<div id="unlock-banner" class="ph" hidden style="margin-top:18px"></div>
<section id="wizard-anchor">
<div id="audit-wizard" class="audit-wiz" aria-live="polite"></div>
</section>
<div id="audit-results" hidden></div>
<script>window.__AUDIT__=${publicCfgJson};</script>
<script type="module">
import O11yAudit from './js/audit-engine.js';
window.O11yAudit = O11yAudit;
await import('./js/audit-wizard.js');
</script>`;

  P('audit.html', 'Observability Cost & Stack Audit — O11y Watch',
    `Instant automated observability cost audit: modeled current spend, alternative vendors, savings levers, and migration plan. Free teaser; full report $${AUDIT_PRICE}.`,
    `
<section class="hero" style="padding-bottom:12px"><div class="eyebrow">Instant · automated · runs in your browser</div>
<h1>Datadog bill jumped? See what you’d pay elsewhere <span class="grad">before you migrate anything.</span></h1>
<p>Enter rough hosts, log GB/day, custom metrics, spans and seats. We price that usage against O11y Watch’s sourced public pricing data, entirely in your browser, so you get the numbers without a 3–4 sprint migration or a sales call. Vendors without public rates for your usage are listed separately, never shown as savings.</p>
<p><a class="btn" href="#wizard-anchor" data-grow="audit-lede">See what you’d pay elsewhere →</a> <a class="sm mut" href="#price" style="margin-left:10px">Free estimate · full report $${AUDIT_PRICE}</a></p>
</section>

<h2>Who it’s for</h2>
<ul>
<li>Engineering leads and SREs who own an observability budget and want a fast, sourced estimate.</li>
<li>Teams on Datadog / New Relic / Grafana Cloud (or mix) comparing retention, seats, and overages.</li>
<li>FinOps and founders checking whether a migration or self-host path is even in the ballpark.</li>
</ul>
<p class="mut sm">Best fit when you know rough hosts, log GB/day, series, spans, seats, and monthly spend. Optional usage CSV stays in your browser.</p>

<h2>What you get</h2>
<div class="deliv">${AUDIT_GET.map(([n, t, d]) => `<div class="card"><b>${n}</b><h3 style="margin:6px 0 4px;font-size:16px">${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>

<h2 id="price">Price</h2>
<div class="price-row">
<div class="card"><div class="eyebrow">Free</div><div class="amt">$0</div><p class="mut">Multi-step survey + top-line estimated savings range. Fully client-side.</p><p style="margin-top:12px"><a class="btn ghost" href="#wizard-anchor">Run free teaser</a></p></div>
<div class="card hl"><div class="eyebrow">Full report unlock</div><div class="amt">$${AUDIT_PRICE}</div><p class="mut">Ranked table, alternatives, self-host options, levers, migration plan, Print/PDF. One-time.</p><p style="margin-top:12px"><a class="btn" href="#wizard-anchor">Start audit → unlock</a></p></div>
</div>
<p class="sm mut">Secure one-time checkout via Kit. Your full report unlocks in this browser right after payment.</p>

<h2>FAQ</h2>
${AUDIT_FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}

<h2 id="intake">Run the audit</h2>
<p class="mut">Instant and automated. Your answers never leave this browser unless you choose to Print/Save the report yourself.</p>
${boot2}
`, '', [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Observability Cost & Stack Audit',
      provider: { '@type': 'Organization', name: SITE, url: BASE + '/' },
      description: 'Instant automated observability cost and stack audit that runs client-side against public pricing data.',
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free teaser' },
        { '@type': 'Offer', price: String(AUDIT_PRICE), priceCurrency: 'USD', name: 'Full report unlock' }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: AUDIT_FAQ.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    }
  ]);

  // Unlisted unlock path (noindex). Kit product success redirect should point here with ?t=TOKEN
  W(unlockPath, page(unlockPath, 'Audit unlocked — O11y Watch', 'Unlock confirmation for the Observability Cost & Stack Audit.', `
<section class="hero">
<div class="eyebrow">Purchase unlock</div>
<h1>Full audit <span class="grad">unlocked</span> on this browser.</h1>
<p>Access is stored locally in this browser. Return to the audit page to see the full report for any survey you run here.</p>
<p id="unlock-status" class="ph">Checking token…</p>
<p style="margin-top:18px"><a class="btn" href="audit.html#results">Open the audit</a> <a class="btn ghost" href="audit.html#wizard-anchor">Re-run survey</a></p>
<p class="sm mut">Limitation: this is a private unlock link, not a login. Do not share it. Clearing site data removes unlock on this device.</p>
</section>
<script>window.__AUDIT__=${publicCfgJson};</script>
<script type="module">
import O11yAudit from './js/audit-engine.js';
window.O11yAudit = O11yAudit;
await import('./js/audit-wizard.js');
const params = new URLSearchParams(location.search);
const tok = params.get('t') || params.get('token') || '';
const el = document.getElementById('unlock-status');
const wiz = window.O11yAuditWizard;
if (!tok) {
  el.textContent = 'No token in URL. Open the link from your Kit purchase redirect (includes ?t=…).';
} else if (wiz && wiz.redeemToken) {
  const ok = await wiz.redeemToken(tok);
  if (ok) {
    el.textContent = 'Token accepted. Full report is unlocked on this browser. Opening your audit…';
    el.className = 'ph';
    el.style.borderColor = 'var(--acc2)';
    el.style.color = 'var(--acc2)';
    try {
      const u = new URL(location.href);
      u.searchParams.delete('t');
      u.searchParams.delete('token');
      history.replaceState({}, '', u.pathname + u.search);
    } catch (e) {}
    setTimeout(() => { location.href = 'audit.html#results'; }, 1000);
  } else {
    el.textContent = 'Token did not validate. Check the Kit redirect URL, or try again in a moment.';
    el.style.borderColor = 'var(--no)';
    el.style.color = 'var(--no)';
  }
} else {
  el.textContent = 'Unlock script failed to load. Refresh and try again.';
  el.style.borderColor = 'var(--no)';
  el.style.color = 'var(--no)';
}
</script>
`));

  // Thanks page: do NOT embed the unlock token in HTML. Only redeem if Kit appended ?t=.
  W('audit-thanks.html', page('audit-thanks.html', 'Thanks — audit unlock', 'Thanks for unlocking the Observability Cost & Stack Audit.', `
<section class="hero">
<div class="eyebrow">Thanks</div>
<h1>You’re in — open your <span class="grad">instant audit</span>.</h1>
<p>If you just purchased, Kit should send you to the unlock page automatically. If you landed here with a token in the URL, we’ll activate it below.</p>
<p id="thanks-status" class="ph">Looking for unlock token…</p>
<p style="margin-top:18px"><a class="btn" href="audit.html#wizard-anchor">Go to audit wizard</a> <a class="btn ghost" href="audit-unlock.html">Open unlock page</a></p>
<p class="sm mut">Questions? Email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
</section>
<script>window.__AUDIT__=${publicCfgJson};</script>
<script type="module">
import O11yAudit from './js/audit-engine.js';
window.O11yAudit = O11yAudit;
await import('./js/audit-wizard.js');
const params = new URLSearchParams(location.search);
const tok = params.get('t') || params.get('token') || '';
const el = document.getElementById('thanks-status');
if (!tok) {
  el.textContent = 'No token on this page. Use the Kit thank-you / unlock link (preferred), then open the audit wizard.';
} else if (window.O11yAuditWizard) {
  const ok = await window.O11yAuditWizard.redeemToken(tok);
  el.textContent = ok
    ? 'Unlocked on this browser. Opening your audit…'
    : 'Token present but did not validate. Open the unlock link from Kit.';
  if (ok) {
    el.style.borderColor = 'var(--acc2)'; el.style.color = 'var(--acc2)';
    try {
      const u = new URL(location.href);
      u.searchParams.delete('t');
      u.searchParams.delete('token');
      history.replaceState({}, '', u.pathname + u.search);
    } catch (e) {}
    setTimeout(() => { location.href = 'audit.html#results'; }, 1000);
  } else { el.style.borderColor = 'var(--no)'; el.style.color = 'var(--no)'; }
}
</script>
`));

  return { unlockUrl, unlockPath, AUDIT_PRICE, unlockApi };
}
