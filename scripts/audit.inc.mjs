// Instant Observability Cost & Stack Audit — static wizard, client-side engine, Kit unlock gate.
// Called from build.mjs. Edit questions in data/audit-form.json, rates in data/audit-rates.json.
export default function buildAudit({
  W, P, page, BASE, SITE, esc, CONTACT, fs, path, root, out,
  AUDIT_CHECKOUT, AUDIT_PRICE, AUDIT_UNLOCK_TOKEN
}) {
  const AUDIT_FORM = JSON.parse(fs.readFileSync(path.join(root, 'data/audit-form.json'), 'utf8'));
  const AUDIT_RATES = JSON.parse(fs.readFileSync(path.join(root, 'data/audit-rates.json'), 'utf8'));
  const unlockPath = 'audit-unlock.html';
  const unlockUrl = `${BASE}/${unlockPath}?t=${encodeURIComponent(AUDIT_UNLOCK_TOKEN)}`;

  // Copy client assets
  const jsOut = path.join(out, 'js');
  fs.mkdirSync(jsOut, { recursive: true });
  for (const f of ['audit-engine.js', 'audit-wizard.js']) {
    fs.copyFileSync(path.join(root, 'assets/js', f), path.join(jsOut, f));
  }
  W('audit-form.json', JSON.stringify(AUDIT_FORM, null, 2));
  W('audit-rates.json', JSON.stringify(AUDIT_RATES, null, 2));

  const cfgJson = JSON.stringify({
    form: AUDIT_FORM,
    rates: AUDIT_RATES,
    checkout: AUDIT_CHECKOUT,
    price: AUDIT_PRICE,
    unlockToken: AUDIT_UNLOCK_TOKEN,
    unlockPath,
    unlockUrl,
    contact: CONTACT
  }).replace(/</g, '\\u003c');

  const AUDIT_FAQ = [
    ['How does the instant audit work?', 'You answer a short survey (and optionally drop a usage CSV). A deterministic engine runs entirely in your browser against O11y Watch public pricing data. Nothing is uploaded to our servers.'],
    ['Are the numbers quotes?', 'No — they are estimates labeled with sources and check dates from our dataset. If a vendor has no public unit rate for a dimension (hosts, GB, series, spans, seats), we say so instead of inventing a price.'],
    ['What is free vs paid?', `The top-line savings range is free. The full ranked report, levers, migration plan, and Print/PDF view unlock for $${AUDIT_PRICE} via Kit. After purchase, Kit should redirect to the unlisted unlock URL.`],
    ['How is the unlock gate secured?', 'Simplest static-site gate: an unlisted, noindexed unlock URL with a token stored in localStorage on this browser. Anyone with the link can unlock. Do not share the unlock URL publicly. This is not account auth.'],
    ['Is my CSV uploaded?', 'No. CSV parsing happens only in your browser. We never receive the file.'],
    ['What is not included?', 'Implementation, negotiated enterprise discounts, on-call coverage, or multi-cloud FinOps programs. Self-host software may be $0 where stated; compute/storage/ops are outside our dataset.']
  ];

  const AUDIT_GET = [
    ['01', 'Instant model', 'Current cost estimate from your usage + public unit rates.'],
    ['02', '4–6 alternatives', 'Modeled SaaS options at your hosts / GB / series / spans / seats.'],
    ['03', 'Self-host options', 'OSS stacks where the dataset says self-host is available — software $0, infra called out as unknown.'],
    ['04', 'Savings levers', 'Retention, sampling, log filters, seat rationalization — heuristic % only.'],
    ['05', 'Migration plan', 'Ranked sequence with Low / Medium / High effort ratings + Print/PDF.']
  ];

  const boot = `
<div id="unlock-banner" class="ph" hidden style="margin-top:18px"></div>
<div id="audit-wizard" class="audit-wiz"></div>
<div id="audit-results" hidden></div>
<script>window.__AUDIT__=${cfgJson};</script>
<script type="module" src="js/audit-engine.js"></script>
<script type="module">
  import '/js/audit-engine.js';
  const s=document.createElement('script');s.src='js/audit-wizard.js';document.body.appendChild(s);
</script>`;

  // Prefer classic script load order: engine then wizard as modules is tricky for IIFE wizard.
  // Engine is ESM; wizard is IIFE expecting window.O11yAudit. Load engine as module then wizard.
  const boot2 = `
<div id="unlock-banner" class="ph" hidden style="margin-top:18px"></div>
<section id="wizard-anchor">
<div id="audit-wizard" class="audit-wiz" aria-live="polite"></div>
</section>
<div id="audit-results" hidden></div>
<script>window.__AUDIT__=${cfgJson};</script>
<script type="module">
import O11yAudit from './js/audit-engine.js';
window.O11yAudit = O11yAudit;
await import('./js/audit-wizard.js');
</script>`;

  P('audit.html', 'Observability Cost & Stack Audit — O11y Watch',
    `Instant automated observability cost audit: modeled current spend, alternative vendors, savings levers, and migration plan. Free teaser; full report $${AUDIT_PRICE}.`,
    `
<section class="hero" style="padding-bottom:12px"><div class="eyebrow">Instant · automated · runs in your browser</div>
<h1>Observability Cost &amp; <span class="grad">Stack Audit</span></h1>
<p>Answer a short survey. Get an instant cost model against O11y Watch public pricing data — estimated current spend, alternative vendors, savings levers, and a migration plan. No intake call. No human review queue.</p>
<p><a class="btn" href="#wizard-anchor">Start the free audit</a> <a class="btn ghost" href="#price">See pricing</a></p>
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
<p class="sm mut">Checkout is a Kit product. After payment, Kit must redirect to the unlisted unlock URL (see EDITING.md). Gate limitation: token + localStorage in this browser — not account auth.</p>

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
<p class="sm mut">Limitation: this is an unlisted token URL, not a login. Do not share it. Clearing site data removes unlock on this device.</p>
</section>
<script>window.__AUDIT__=${cfgJson};</script>
<script type="module">
import O11yAudit from './js/audit-engine.js';
window.O11yAudit = O11yAudit;
const params = new URLSearchParams(location.search);
const tok = params.get('t') || params.get('token') || '';
const expect = window.__AUDIT__.unlockToken;
const el = document.getElementById('unlock-status');
if (tok && tok === expect) {
  try { localStorage.setItem('o11y_audit_unlocked', expect); } catch (e) {}
  el.textContent = 'Token accepted. Full report is unlocked on this browser.';
  el.className = 'ph';
  el.style.borderColor = 'var(--acc2)';
  el.style.color = 'var(--acc2)';
} else if (!tok) {
  el.textContent = 'No token in URL. Open the link from your Kit purchase redirect (includes ?t=…).';
} else {
  el.textContent = 'Token did not match. Check the Kit redirect URL.';
  el.style.borderColor = 'var(--no)';
  el.style.color = 'var(--no)';
}
</script>
`));

  // Keep a minimal thanks page only as a redirect helper (optional purchase confirmation mirror)
  W('audit-thanks.html', page('audit-thanks.html', 'Thanks — audit unlock', 'Thanks for unlocking the Observability Cost & Stack Audit.', `
<section class="hero">
<div class="eyebrow">Thanks</div>
<h1>You’re in — open your <span class="grad">instant audit</span>.</h1>
<p>If you just purchased, use the unlock link from Kit (or continue below). The wizard runs in your browser with no human review.</p>
<p><a class="btn" href="${esc(unlockPath)}?t=${esc(AUDIT_UNLOCK_TOKEN)}">Activate unlock</a> <a class="btn ghost" href="audit.html#wizard-anchor">Go to audit wizard</a></p>
<p class="sm mut">Questions? Email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
</section>
`));

  return { unlockUrl, unlockPath, AUDIT_PRICE, AUDIT_UNLOCK_TOKEN };
}
