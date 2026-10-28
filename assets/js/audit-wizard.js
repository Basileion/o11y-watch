/**
 * Multi-step audit wizard + monetization gate + report renderer.
 * Expects window.__AUDIT__ = { form, rates, checkout, price, unlockToken, unlockPath }
 * and window.O11yAudit from audit-engine.js
 */
(function () {
  'use strict';
  const CFG = () => window.__AUDIT__ || {};
  const LS_UNLOCK = 'o11y_audit_unlocked';
  const SS_ANSWERS = 'o11y_audit_answers';
  const SS_REPORT = 'o11y_audit_report';

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $all(sel, el) { return [...(el || document).querySelectorAll(sel)]; }
  function money(n) { return (window.O11yAudit && O11yAudit.money) ? O11yAudit.money(n) : '$' + n; }

  function isUnlocked() {
    try {
      const tok = CFG().unlockToken;
      return !!(tok && localStorage.getItem(LS_UNLOCK) === tok);
    } catch (e) { return false; }
  }

  function unlock(token) {
    const expect = CFG().unlockToken;
    if (!expect || token !== expect) return false;
    try { localStorage.setItem(LS_UNLOCK, expect); } catch (e) {}
    return true;
  }

  function checkoutHref() {
    const u = CFG().checkout;
    if (u && u !== '#pending') return u;
    return 'mailto:basileion.ops@gmail.com?subject=' + encodeURIComponent('Observability Cost Audit — unlock ($' + CFG().price + ')');
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function renderField(f, values) {
    const val = values[f.name];
    const req = f.required ? ' required' : '';
    const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
    if (f.type === 'checkbox-group') {
      const opts = (f.options || []).map((o, i) => {
        const v = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        const id = `w_${f.name}_${i}`;
        const checked = Array.isArray(val) && val.includes(v) ? ' checked' : '';
        return `<label for="${id}"><input type="checkbox" id="${id}" name="${esc(f.name)}" value="${esc(v)}"${checked}> ${esc(lab)}</label>`;
      }).join('');
      return `<div class="fg" data-field="${esc(f.name)}"><span class="fl">${esc(f.label)}${f.required ? ' *' : ''}</span>${hint}<div class="cbg" role="group">${opts}</div></div>`;
    }
    if (f.type === 'select') {
      const opts = (f.options || []).map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? (o || 'Select…') : o.label;
        const sel = val === v ? ' selected' : (!val && v === '' ? ' selected' : '');
        const dis = v === '' ? ' disabled' : '';
        return `<option value="${esc(v)}"${sel}${dis}>${esc(lab)}</option>`;
      }).join('');
      return `<div class="fg"><label class="fl" for="w_${f.name}">${esc(f.label)}${f.required ? ' *' : ''}</label>${hint}<select id="w_${f.name}" name="${esc(f.name)}"${req}>${opts}</select></div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="fg"><label class="fl" for="w_${f.name}">${esc(f.label)}${f.required ? ' *' : ''}</label>${hint}<textarea id="w_${f.name}" name="${esc(f.name)}" rows="${f.rows || 3}"${req}>${esc(val || '')}</textarea></div>`;
    }
    if (f.type === 'file') {
      return `<div class="fg"><label class="fl" for="w_${f.name}">${esc(f.label)}</label>${hint}<input type="file" id="w_${f.name}" name="${esc(f.name)}" accept="${esc(f.accept || '.csv')}"><div class="sm mut" id="csv-status"></div></div>`;
    }
    if (f.type === 'number') {
      return `<div class="fg"><label class="fl" for="w_${f.name}">${esc(f.label)}${f.required ? ' *' : ''}</label>${hint}<input type="number" id="w_${f.name}" name="${esc(f.name)}" value="${esc(val ?? '')}" min="${f.min ?? 0}" step="${f.step ?? 1}" placeholder="${esc(f.placeholder || '')}"${req}></div>`;
    }
    return `<div class="fg"><label class="fl" for="w_${f.name}">${esc(f.label)}${f.required ? ' *' : ''}</label>${hint}<input type="text" id="w_${f.name}" name="${esc(f.name)}" value="${esc(val || '')}" placeholder="${esc(f.placeholder || '')}"${req}></div>`;
  }

  function readStep(stepEl, step) {
    const data = {};
    for (const f of step.fields || []) {
      if (f.type === 'checkbox-group') {
        data[f.name] = $all(`input[name="${f.name}"]:checked`, stepEl).map((x) => x.value);
      } else if (f.type === 'file') {
        /* handled separately */
      } else {
        const el = $(`[name="${f.name}"]`, stepEl);
        data[f.name] = el ? el.value : '';
      }
    }
    return data;
  }

  function validateStep(step, data) {
    for (const f of step.fields || []) {
      if (!f.required) continue;
      const v = data[f.name];
      if (f.type === 'checkbox-group') {
        if (!Array.isArray(v) || !v.length) return `Please select at least one option for “${f.label}”.`;
      } else if (f.type === 'number') {
        if (v === '' || v == null || !Number.isFinite(Number(v))) return `Please enter “${f.label}”.`;
      } else if (!v) {
        return `Please complete “${f.label}”.`;
      }
    }
    return null;
  }

  function renderTeaser(report) {
    const t = report.teaser;
    const range = t.savings_low_mo != null
      ? `<div class="amt grad-text">${money(t.savings_low_mo)} – ${money(t.savings_high_mo)}<span class="sm"> / mo</span></div>`
      : `<div class="amt">Range unavailable</div>`;
    return `
      <div class="card hl teaser-card" id="teaser">
        <div class="eyebrow">Free teaser · estimates only</div>
        <h2 style="margin:8px 0 4px;font-size:22px">Top-line savings range</h2>
        ${range}
        <p class="mut">Modeled current baseline: <b>${money(t.current_mo)}/mo</b> (${esc(report.current.baseline_source)}). Full report ranks 4–6 alternatives, self-host options, levers, and a migration plan.</p>
        <p class="sm mut">${esc(t.label)}</p>
      </div>`;
  }

  function renderGate() {
    const price = CFG().price || 149;
    const href = checkoutHref();
    const pending = !CFG().checkout || CFG().checkout === '#pending';
    return `
      <div class="card gate-card" id="gate">
        <div class="eyebrow">Unlock full report</div>
        <h3 style="margin:6px 0">Finance-grade audit — $${price}</h3>
        <p class="mut">One-time unlock. Instant. Runs in your browser against dated public pricing data.</p>
        <ul class="mut sm">
          <li>Ranked savings table (SaaS + self-host)</li>
          <li>Retention / sampling / log-filter levers</li>
          <li>Migration plan with effort ratings</li>
          <li>Print / Save-as-PDF branded report</li>
        </ul>
        <p style="margin-top:14px"><a class="btn" id="buy-audit" href="${esc(href)}"${pending ? '' : ' target="_blank" rel="noopener"'}>Unlock for $${price}</a></p>
        <p class="sm mut">${pending
          ? 'Checkout link is a placeholder (<code>AUDIT_CHECKOUT</code>). Until Kit is wired, use the email link or set the constant and rebuild.'
          : 'After purchase, Kit redirects you to the unlock URL which stores access in this browser.'}</p>
        <p class="sm mut"><b>Gate limitation:</b> unlock is an unlisted token URL + localStorage in this browser — not a signed account. Anyone with the unlock link can open the report. Do not post the unlock URL publicly.</p>
      </div>`;
  }

  function gapList(gaps) {
    if (!gaps || !gaps.length) return '<p class="sm mut">No gaps flagged for this row.</p>';
    return `<ul class="sm mut">${gaps.map((g) => `<li><b>${esc(g.dimension)}</b>: ${esc(g.reason)}</li>`).join('')}</ul>`;
  }

  function renderFullReport(report) {
    const cur = report.current;
    const rankedRows = report.ranked.map((r) => `
      <tr>
        <td><b>${esc(r.name)}</b><div class="sm mut">${esc(r.kind)}${r.checked ? ' · checked ' + esc(r.checked) : ''}</div></td>
        <td>${money(r.monthly)}/mo</td>
        <td>${r.savings_mo == null ? '—' : money(r.savings_mo) + '/mo'}${r.savings_pct != null ? ` <span class="sm mut">(${r.savings_pct}%)</span>` : ''}</td>
        <td><span class="pill">${esc(r.effort.label)}</span></td>
        <td><span class="pill p-${r.confidence === 'high' ? 'yes' : r.confidence === 'medium' ? 'unknown' : 'no'}">${esc(r.confidence)}</span></td>
      </tr>`).join('');

    const altCards = report.alternatives.map((a) => `
      <div class="card">
        <h3 style="margin:0 0 6px;font-size:16px">${esc(a.name)}</h3>
        <div class="amt" style="font-size:28px">${money(a.total)}<span class="sm">/mo est.</span></div>
        <p class="sm mut">Savings vs baseline: ${a.savings_mo == null ? '—' : money(a.savings_mo) + '/mo'} · Effort: ${esc(a.effort.label)} · Confidence: ${esc(a.confidence)}</p>
        <div class="sm">${(a.lines || []).map((l) => `<div>${esc(l.label)}: <b>${money(l.amount)}</b></div>`).join('') || '<i class="mut">No modeled lines</i>'}</div>
        ${gapList(a.gaps)}
        ${a.url ? `<p class="sm"><a href="${esc(a.url)}" rel="nofollow noopener" target="_blank">Pricing source ↗</a> · checked ${esc(a.checked)}</p>` : ''}
      </div>`).join('');

    const selfCards = report.self_hosted.map((s) => `
      <div class="card">
        <h3 style="margin:0 0 6px;font-size:16px">${esc(s.name)}</h3>
        <div class="amt" style="font-size:28px">${s.total == null ? 'n/a' : money(s.total)}<span class="sm">/mo software</span></div>
        <p class="sm mut">${esc((s.notes || [])[0] || '')}</p>
        ${gapList(s.gaps)}
      </div>`).join('');

    const levers = report.levers.length
      ? `<div class="tw"><table><thead><tr><th>Lever</th><th>Est. save</th><th>Notes</th></tr></thead><tbody>
          ${report.levers.map((l) => `<tr><td><b>${esc(l.name)}</b><div class="sm mut">${esc(l.description)}</div></td><td>${money(l.estimated_save_mo)}/mo <span class="sm mut">(~${l.pct}%)</span></td><td class="sm mut">${esc(l.note)}</td></tr>`).join('')}
        </tbody></table></div>`
      : `<p class="mut">No retention/sampling/log/seat levers triggered for this usage profile.</p>`;

    const mig = report.migration.map((m) => `
      <div class="card">
        <b class="eyebrow">Step ${m.step} · ${esc(m.effort.label)} effort</b>
        <h3 style="margin:6px 0;font-size:16px">${esc(m.target)}</h3>
        <p class="sm mut">Modeled ${money(m.monthly)}/mo · savings ${m.savings_mo == null ? '—' : money(m.savings_mo) + '/mo'}</p>
        <ul class="sm">${m.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      </div>`).join('');

    const sources = `<ul class="sm">${report.sources.map((s) => `<li>${esc(s.name)}${s.url ? ` — <a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">source</a>` : ''} (checked ${esc(s.checked)})</li>`).join('')}</ul>`;

    return `
      <article class="report" id="full-report">
        <header class="report-head">
          <div class="eyebrow">O11y Watch · Observability Cost &amp; Stack Audit</div>
          <h2 style="margin:8px 0">Full report</h2>
          <p class="sm mut">Generated ${esc(report.generated_at)} · Dataset checked ${esc(report.dataset_checked)} · All figures are <b>estimates</b></p>
          <p style="margin-top:10px"><button type="button" class="btn" id="print-report">Print / Save as PDF</button></p>
        </header>

        <section>
          <h3>Current cost</h3>
          <div class="card hl">
            <div class="amt">${money(cur.baseline_mo)}<span class="sm">/mo baseline</span></div>
            <p class="sm mut">Source: ${esc(cur.baseline_source)}${cur.modeled_total != null ? ` · unit model: ${money(cur.modeled_total)}/mo (${esc(cur.name)})` : ` · ${esc(cur.name)}`}</p>
            <div class="sm">${(cur.lines || []).map((l) => `<div>${esc(l.label)}: <b>${money(l.amount)}</b></div>`).join('')}</div>
            ${gapList(cur.gaps)}
            ${(cur.notes || []).map((n) => `<p class="sm mut">${esc(n)}</p>`).join('')}
          </div>
        </section>

        <section>
          <h3>Ranked savings</h3>
          <div class="tw"><table>
            <thead><tr><th>Option</th><th>Est. monthly</th><th>Savings</th><th>Effort</th><th>Confidence</th></tr></thead>
            <tbody>${rankedRows}</tbody>
          </table></div>
        </section>

        <section>
          <h3>Alternative vendors (modeled at your usage)</h3>
          <div class="grid">${altCards}</div>
        </section>

        <section>
          <h3>Self-hosted options</h3>
          <div class="grid">${selfCards}</div>
        </section>

        <section>
          <h3>Retention / sampling savings levers</h3>
          ${levers}
        </section>

        <section>
          <h3>Migration plan</h3>
          <div class="steps" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">${mig}</div>
        </section>

        <section>
          <h3>Sources &amp; dates</h3>
          ${sources}
        </section>

        <section class="disclaimer box">
          <h3 style="margin-top:0">Disclaimer</h3>
          <p class="sm mut">${esc(report.disclaimer)}</p>
          <p class="sm mut">Where a dimension has no public unit rate in the O11y Watch dataset, it is listed as a gap — never invented.</p>
        </section>
      </article>`;
  }

  function showResults(report) {
    const mount = $('#audit-results');
    if (!mount) return;
    const unlocked = isUnlocked();
    let html = `<h2 id="results">Your audit results</h2>`;
    html += renderTeaser(report);
    if (unlocked) {
      html += renderFullReport(report);
    } else {
      html += `<div class="locked-wrap">${renderGate()}
        <div class="locked-preview" aria-hidden="true">${renderFullReport(report)}</div>
      </div>`;
    }
    mount.innerHTML = html;
    mount.hidden = false;
    const printBtn = $('#print-report');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
    mount.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initWizard() {
    const formCfg = CFG().form;
    const rates = CFG().rates;
    if (!formCfg || !rates || !window.O11yAudit) {
      console.error('Audit wizard missing config or engine');
      return;
    }

    // Unlock page handling
    const params = new URLSearchParams(location.search);
    const hashTok = (location.hash || '').replace(/^#unlock=/, '');
    const tok = params.get('t') || params.get('token') || hashTok;
    if (tok && unlock(tok)) {
      const banner = $('#unlock-banner');
      if (banner) {
        banner.hidden = false;
        banner.textContent = 'Full audit unlocked on this browser. Run or re-open your results below.';
      }
      // Clean token from URL without reload
      try {
        const u = new URL(location.href);
        u.searchParams.delete('t');
        u.searchParams.delete('token');
        u.hash = '';
        history.replaceState({}, '', u.pathname + u.search);
      } catch (e) {}
    }

    const root = $('#audit-wizard');
    if (!root) return;

    const state = { step: 0, values: {}, csv_overrides: null };
    try {
      const saved = sessionStorage.getItem(SS_ANSWERS);
      if (saved) Object.assign(state.values, JSON.parse(saved));
    } catch (e) {}

    function persist() {
      try { sessionStorage.setItem(SS_ANSWERS, JSON.stringify(state.values)); } catch (e) {}
    }

    function paint() {
      const steps = formCfg.steps;
      const step = steps[state.step];
      const progress = steps.map((s, i) => `<span class="wiz-step${i === state.step ? ' on' : ''}${i < state.step ? ' done' : ''}">${i + 1}. ${esc(s.title)}</span>`).join('<span class="wiz-sep">→</span>');
      root.innerHTML = `
        <div class="wiz-progress">${progress}</div>
        <div class="box aform" id="wiz-panel">
          <h2 style="margin-top:0;font-size:20px">${esc(step.title)}</h2>
          <p class="mut">${esc(step.description || '')}</p>
          <div id="wiz-fields">${step.fields.map((f) => renderField(f, state.values)).join('')}</div>
          <p class="err" id="wiz-err" hidden></p>
          <div class="wiz-nav">
            <button type="button" class="btn ghost" id="wiz-back" ${state.step === 0 ? 'disabled' : ''}>Back</button>
            <button type="button" class="btn" id="wiz-next">${state.step === steps.length - 1 ? esc(formCfg.submitLabel || 'Run my audit') : 'Continue'}</button>
          </div>
        </div>`;

      const fileInput = $('#w_usage_csv');
      if (fileInput) {
        fileInput.addEventListener('change', async () => {
          const status = $('#csv-status');
          const file = fileInput.files && fileInput.files[0];
          if (!file) return;
          if (file.size > (formCfg.csv && formCfg.csv.maxBytes) || 2e6) {
            status.textContent = 'File too large (max 2 MB).';
            return;
          }
          const text = await file.text();
          const parsed = O11yAudit.parseUsageCsv(text);
          if (parsed.error) {
            status.textContent = parsed.error;
            state.csv_overrides = null;
          } else {
            state.csv_overrides = parsed.overrides;
            status.textContent = 'Parsed locally: ' + parsed.matched.join(', ') + '. Values will override matching fields.';
            // Apply to visible number fields if present
            for (const [k, v] of Object.entries(parsed.overrides)) {
              const el = $(`[name="${k}"]`);
              if (el && el.type === 'number') el.value = v;
              state.values[k] = v;
            }
          }
        });
      }

      $('#wiz-back').addEventListener('click', () => {
        if (state.step > 0) { state.step--; paint(); }
      });
      $('#wiz-next').addEventListener('click', () => {
        const panel = $('#wiz-panel');
        const data = readStep(panel, step);
        const err = validateStep(step, data);
        const errEl = $('#wiz-err');
        if (err) {
          errEl.hidden = false;
          errEl.textContent = err;
          return;
        }
        Object.assign(state.values, data);
        persist();
        if (state.step < steps.length - 1) {
          state.step++;
          paint();
          return;
        }
        // Run audit
        const input = { ...state.values, csv_overrides: state.csv_overrides };
        const report = O11yAudit.runAudit(input, rates);
        try { sessionStorage.setItem(SS_REPORT, JSON.stringify(report)); } catch (e) {}
        showResults(report);
      });
    }

    paint();

    // Restore report if unlocked / returning
    try {
      const prev = sessionStorage.getItem(SS_REPORT);
      if (prev) showResults(JSON.parse(prev));
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWizard);
  else initWizard();

  // Expose for unlock page
  window.O11yAuditWizard = { unlock, isUnlocked, showResults };
})();

export {};
