/**
 * O11y Watch — Observability Cost & Stack Audit engine (deterministic, client-side).
 * Uses structured rates from data/audit-rates.json (extracted from vendors.json).
 * Never invents prices: missing dimensions → explicit "not in dataset" gaps.
 */
export function createAuditEngine() {
  'use strict';

  const EFFORT = { none: 0, low: 1, medium: 2, high: 3 };
  const EFFORT_LABEL = ['None', 'Low', 'Medium', 'High'];

  function num(x, d) {
    const n = Number(x);
    return Number.isFinite(n) ? n : (d ?? 0);
  }

  function money(n) {
    if (n == null || !Number.isFinite(n)) return '—';
    const a = Math.abs(n);
    if (a >= 1000) return (n < 0 ? '-' : '') + '$' + Math.round(a).toLocaleString('en-US');
    return (n < 0 ? '-$' : '$') + (Math.round(a * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  /** Normalize survey answers into a usage profile. */
  function normalizeInput(raw) {
    const vendors = Array.isArray(raw.vendors) ? raw.vendors.map(String) : (raw.vendors ? [String(raw.vendors)] : []);
    return {
      vendors,
      primary_vendor: String(raw.primary_vendor || vendors[0] || 'other'),
      plans: String(raw.plans || ''),
      monthly_spend: num(raw.monthly_spend),
      hosts: num(raw.hosts),
      log_gb_day: num(raw.log_gb_day),
      log_gb_mo: num(raw.log_gb_day) * 30,
      metric_series: num(raw.metric_series),
      spans_mo: num(raw.spans_mo),
      retention_days: Math.max(1, num(raw.retention_days, 15)),
      users: num(raw.users),
      team_size: String(raw.team_size || ''),
      priority: String(raw.priority || 'balanced'),
      compliance: Array.isArray(raw.compliance) ? raw.compliance : [],
      region: String(raw.region || ''),
      constraints: String(raw.constraints || ''),
      csv_overrides: raw.csv_overrides || null
    };
  }

  /**
   * Model monthly cost for one vendor at a usage profile.
   * Returns { total, lines[], gaps[], confidence, modeled }
   */
  function modelVendor(vdef, usage, opts) {
    opts = opts || {};
    const rates = vdef.rates || {};
    const lines = [];
    const gaps = [];
    let total = 0;
    let modeled = false;
    const billHosts = Math.max(0, usage.hosts - (vdef.free && vdef.free.hosts ? vdef.free.hosts : 0));

    function add(label, amount, meta) {
      if (amount == null || !Number.isFinite(amount)) return;
      const a = Math.max(0, amount);
      lines.push({ label, amount: a, ...(meta || {}) });
      total += a;
      modeled = true;
    }

    function gap(dim, why) {
      gaps.push({ dimension: dim, reason: why });
    }

    switch (vdef.model) {
      case 'per_host_plus_products': {
        const unit = opts.ondemand ? rates.host_mo_ondemand : rates.host_mo_annual;
        if (unit != null) add(`Infrastructure (${billHosts} hosts × ${money(unit)}/mo)`, billHosts * unit, { dim: 'hosts' });
        else gap('hosts', 'No host rate in dataset');
        if (rates.log_gb == null) gap('logs', 'Log $/GB not in O11y Watch dataset for ' + vdef.name + ' (products billed separately)');
        if (rates.metric_series_1k == null) gap('metrics', 'Custom metrics unit rate not in dataset for ' + vdef.name);
        if (rates.span_million == null) gap('traces', 'APM/span unit rate not in dataset for ' + vdef.name);
        if (rates.user_mo == null) gap('seats', 'Seat pricing not stated for ' + vdef.name);
        break;
      }
      case 'per_host': {
        const unit = rates.host_mo_annual;
        if (unit != null) add(`Hosts (${usage.hosts} × ${money(unit)}/mo)`, usage.hosts * unit, { dim: 'hosts' });
        else gap('hosts', 'No host rate');
        if (rates.log_gb == null) gap('logs', 'Log unit rate not in dataset');
        if (rates.span_million == null) gap('traces', 'Span/APM unit rate not in dataset');
        break;
      }
      case 'user_plus_gb': {
        const freeUsers = rates.free_full_users || 0;
        const billUsers = Math.max(0, usage.users - freeUsers);
        if (rates.user_mo != null) add(`Full platform users (${billUsers} × ${money(rates.user_mo)})`, billUsers * rates.user_mo, { dim: 'seats' });
        else gap('seats', 'User rate missing');
        const freeGb = rates.free_gb_mo || 0;
        // Combined ingest: logs + rough span weight if we only have GB rate
        const ingestGb = usage.log_gb_mo;
        const billGb = Math.max(0, ingestGb - freeGb);
        if (rates.log_gb != null) add(`Data ingest (${billGb.toFixed(0)} GB × ${money(rates.log_gb)}/GB after ${freeGb} GB free)`, billGb * rates.log_gb, { dim: 'logs' });
        else gap('logs', 'GB rate missing');
        if (rates.metric_series_1k == null) gap('metrics', 'Metric series not separately priced in dataset (folded into ingest GB where applicable)');
        if (rates.span_million == null) gap('traces', 'Spans not separately priced — only GB ingest modeled; span count not converted without a published bytes/span factor');
        break;
      }
      case 'platform_plus_series': {
        if (rates.platform_fee_mo != null) add(`Platform fee`, rates.platform_fee_mo, { dim: 'platform' });
        const freeSeries = (vdef.free && vdef.free.active_series) || 0;
        const billSeries = Math.max(0, usage.metric_series - freeSeries);
        const k = billSeries / 1000;
        if (rates.metric_series_1k != null) add(`Active series (${(billSeries / 1000).toFixed(1)}k × ${money(rates.metric_series_1k)}/1k)`, k * rates.metric_series_1k, { dim: 'metrics' });
        else gap('metrics', 'Series rate missing');
        if (rates.log_gb == null) gap('logs', 'Log $/GB not stated in captured dataset fields for Grafana Cloud');
        if (rates.span_million == null) gap('traces', 'Trace unit rate not stated in captured dataset fields for Grafana Cloud');
        break;
      }
      case 'usage_gb_samples': {
        const gb = usage.log_gb_mo;
        if (rates.log_gb != null) add(`Usage GB (${gb.toFixed(0)} × ${money(rates.log_gb)})`, gb * rates.log_gb, { dim: 'logs' });
        // Approximate metric samples from series × scrape assumption is invention — don't.
        if (rates.metric_sample_million != null) {
          gap('metrics', 'Dataset prices $0.10/M samples but survey collects series count, not samples — metrics line not estimated');
        }
        if (rates.min_mo != null && total < rates.min_mo) {
          const bump = rates.min_mo - total;
          add(`Minimum plan floor`, bump, { dim: 'floor' });
        }
        break;
      }
      case 'per_gb': {
        const freeGb = rates.free_gb_mo || 0;
        const billGb = Math.max(0, usage.log_gb_mo - freeGb);
        if (rates.log_gb != null) add(`Ingest (${billGb.toFixed(0)} GB × ${money(rates.log_gb)} after ${freeGb} GB free)`, billGb * rates.log_gb, { dim: 'logs' });
        if (rates.free_timeseries != null && usage.metric_series > rates.free_timeseries) {
          gap('metrics', `Free timeseries allowance is ${rates.free_timeseries}; overage unit rate not in dataset`);
        }
        break;
      }
      case 'per_gb_logs':
      case 'per_gib_logs':
      case 'per_gb_all': {
        const freeGb = rates.free_gb_mo || 0;
        const billGb = Math.max(0, usage.log_gb_mo - freeGb);
        if (rates.log_gb != null) add(`Logs/data (${billGb.toFixed(0)} GB × ${money(rates.log_gb)})`, billGb * rates.log_gb, { dim: 'logs' });
        if (vdef.model === 'per_gib_logs') gap('metrics', 'Per-DPM metrics rate not in dataset');
        break;
      }
      case 'per_gb_ingest_query': {
        if (rates.log_gb != null) add(`Ingest (${usage.log_gb_mo.toFixed(0)} GB × ${money(rates.log_gb)})`, usage.log_gb_mo * rates.log_gb, { dim: 'logs' });
        gap('query', 'Query GB volume not collected — $0.01/GB queried not applied');
        break;
      }
      case 'per_million_signals': {
        const mSpans = usage.spans_mo / 1e6;
        if (rates.span_million != null) add(`Spans (${mSpans.toFixed(1)}M × ${money(rates.span_million)})`, mSpans * rates.span_million, { dim: 'traces' });
        const mLogs = usage.log_gb_mo; // cannot convert GB→million log lines without inventing — gap
        if (rates.log_million != null) gap('logs', 'Log rate is per million events; survey has GB/day — not converted without inventing events/GB');
        break;
      }
      case 'tier_floor': {
        const floor = rates.pro_floor_mo != null ? rates.pro_floor_mo : rates.paid_from_mo;
        const freeEvents = rates.free_events_mo;
        if (floor != null) {
          if (freeEvents != null && usage.spans_mo <= freeEvents && usage.log_gb_mo === 0) {
            add(`Within free tier (floor not applied)`, 0, { dim: 'tier' });
          } else {
            add(`Plan floor (Pro/paid from)`, floor, { dim: 'tier' });
            gap('overage', 'Tier overage unit rates not fully captured — floor only');
          }
        } else gap('tier', 'No paid_from floor in dataset');
        break;
      }
      case 'compute_opaque': {
        const floor = rates.paid_from_mo;
        // Free: 500 GB loading compute — if log_gb_mo > rough allowance, apply floor; else $0
        const freeLoad = (vdef.free && vdef.free.loading_compute_gb_mo) || 0;
        if (usage.log_gb_mo > freeLoad && floor != null) {
          add(`Paid plan floor (compute model opaque)`, floor, { dim: 'tier' });
          gap('compute', 'Axiom prices compute units, not log GB — cannot map usage precisely; showing paid_from floor only');
        } else if (floor != null) {
          add(`Likely within free compute allowance (estimate $0)`, 0, { dim: 'tier' });
          gap('compute', 'Cannot confirm compute-unit burn from GB/day alone');
        }
        break;
      }
      default:
        gap('model', 'No structured model for ' + vdef.name);
    }

    // Retention lever hint only — don't invent retention multipliers unless vendor publishes them
    if (usage.retention_days > 30 && !rates.retention_multiplier) {
      gap('retention', 'Retention > 30 days; dataset has no retention surcharge multiplier for ' + vdef.name + ' — not adjusted');
    }

    let confidence = 'low';
    if (modeled && gaps.length <= 1) confidence = 'high';
    else if (modeled && gaps.length <= 3) confidence = 'medium';
    else if (modeled) confidence = 'low';
    else confidence = 'none';

    return {
      id: vdef.id,
      name: vdef.name,
      url: vdef.url,
      checked: vdef.checked,
      total: Math.round(total * 100) / 100,
      lines,
      gaps,
      confidence,
      modeled,
      notes: vdef.notes || [],
      oss_self_host: vdef.oss_self_host,
      oss_label: vdef.oss_label || null
    };
  }

  function effortFrom(vdef, fromId) {
    const map = vdef.effort_from || {};
    const key = map[fromId] != null ? map[fromId] : (map.default || 'medium');
    return { key, label: EFFORT_LABEL[EFFORT[key] ?? 2], score: EFFORT[key] ?? 2 };
  }

  function applyLevers(rates, usage, currentTotal) {
    const out = [];
    for (const L of rates.levers || []) {
      let applies = false;
      if (L.id === 'retention_cut' && usage.retention_days > 30) applies = true;
      if (L.id === 'sampling' && usage.spans_mo > 5e6) applies = true;
      if (L.id === 'log_filter' && usage.log_gb_day > 20) applies = true;
      if (L.id === 'seat_rationalize' && usage.users > 5) applies = true;
      if (!applies) continue;
      const pct = L.default_pct_save / 100;
      const save = Math.round(currentTotal * pct);
      out.push({
        id: L.id,
        name: L.name,
        description: L.description,
        pct: L.default_pct_save,
        estimated_save_mo: save,
        note: 'Heuristic % of modeled current cost — not a vendor quote. Validate against your bill.'
      });
    }
    return out;
  }

  function pickAlternatives(rates, usage) {
    const primary = usage.primary_vendor;
    const preferSelf = usage.priority === 'selfhost';
    const preferCost = usage.priority === 'cost' || usage.priority === 'balanced';
    let ids = (rates.default_alternatives || []).slice();
    // Always consider strong unit-priced options
    const extras = ['dynatrace', 'splunk', 'dash0', 'openobserve', 'observe', 'groundcover', 'honeycomb', 'axiom'];
    for (const e of extras) if (!ids.includes(e)) ids.push(e);
    // Drop primary from "alternatives" list for comparison table (still model current separately)
    ids = ids.filter((id) => id !== primary && rates.vendors[id]);
    if (preferSelf) {
      ids = ids.filter((id) => rates.vendors[id].oss_self_host).concat(ids.filter((id) => !rates.vendors[id].oss_self_host));
    }
    // Cap to 6 cloud alternatives
    return ids.slice(0, 6);
  }

  /**
   * Full audit report from survey input + rates dataset.
   */
  function runAudit(rawInput, rates) {
    const usage = normalizeInput(rawInput);
    if (usage.csv_overrides) {
      Object.assign(usage, usage.csv_overrides);
      usage.log_gb_mo = usage.log_gb_day * 30;
    }

    const primaryId = rates.vendors[usage.primary_vendor] ? usage.primary_vendor : null;
    const currentDef = primaryId ? rates.vendors[primaryId] : null;

    let current;
    if (currentDef) {
      current = modelVendor(currentDef, usage, { ondemand: false });
      current.is_current = true;
    } else {
      current = {
        id: usage.primary_vendor || 'unknown',
        name: usage.primary_vendor || 'Unknown vendor',
        total: null,
        lines: [],
        gaps: [{ dimension: 'vendor', reason: 'Primary vendor has no structured rates in O11y Watch dataset — cannot model unit cost. Using stated monthly spend as current baseline.' }],
        confidence: 'none',
        modeled: false,
        notes: [],
        is_current: true,
        checked: rates.dataset_checked
      };
    }

    // Prefer stated spend as "current" when model under/over shoots badly OR when model has low coverage
    const stated = usage.monthly_spend;
    let currentCost;
    let currentSource;
    if (current.modeled && current.confidence !== 'none' && current.total > 0) {
      // Blend: if stated spend provided, use stated as baseline for savings math, keep model as estimate
      if (stated > 0) {
        currentCost = stated;
        currentSource = 'stated_invoice';
        current.stated_spend = stated;
        current.modeled_total = current.total;
        if (stated > 0 && current.total > 0) {
          const ratio = current.total / stated;
          current.model_vs_stated = Math.round(ratio * 100) / 100;
          if (ratio < 0.4 || ratio > 2.5) {
            current.gaps.push({
              dimension: 'reconcile',
              reason: `Modeled ${money(current.total)}/mo vs stated ${money(stated)}/mo — large gap usually means missing product lines (APM/logs/metrics) in the dataset. Savings ranked against stated spend.`
            });
          }
        }
      } else {
        currentCost = current.total;
        currentSource = 'modeled';
      }
    } else if (stated > 0) {
      currentCost = stated;
      currentSource = 'stated_invoice_only';
    } else {
      currentCost = 0;
      currentSource = 'unavailable';
    }

    const altIds = pickAlternatives(rates, usage);
    const alternatives = altIds.map((id) => {
      const m = modelVendor(rates.vendors[id], usage);
      const eff = effortFrom(rates.vendors[id], usage.primary_vendor);
      const save = currentCost > 0 && m.modeled ? currentCost - m.total : null;
      return { ...m, effort: eff, savings_mo: save, savings_pct: save != null && currentCost > 0 ? Math.round((save / currentCost) * 100) : null };
    });

    // Self-hosted options
    const selfHosted = (rates.self_hosted || []).map((s) => {
      const gaps = [];
      if (!s.infra_in_dataset) gaps.push({ dimension: 'infra', reason: 'Compute/storage/ops cost not in O11y Watch dataset' });
      if (s.software_mo == null) gaps.push({ dimension: 'license', reason: 'Software license price not stated as a monthly unit rate' });
      const total = s.software_mo == null ? null : s.software_mo;
      const save = total != null && currentCost > 0 ? currentCost - total : null;
      return {
        id: s.id,
        name: s.name,
        vendor_id: s.vendor_id,
        total,
        software_mo: s.software_mo,
        gaps,
        notes: [s.notes],
        modeled: s.software_mo != null,
        confidence: s.software_mo === 0 ? 'medium' : 'low',
        effort: { key: 'high', label: 'High', score: 3 },
        savings_mo: save,
        savings_pct: save != null && currentCost > 0 ? Math.round((save / currentCost) * 100) : null,
        kind: 'self_hosted'
      };
    });

    // Ranked savings: SaaS first (self-host $0 software is misleading without infra).
    // Self-host listed after SaaS unless priority === selfhost.
    const ranked = [...alternatives, ...selfHosted]
      .filter((a) => a.modeled && a.total != null)
      .map((a) => ({
        id: a.id,
        name: a.name,
        kind: a.kind || 'saas',
        monthly: a.total,
        savings_mo: a.savings_mo,
        savings_pct: a.savings_pct,
        confidence: a.confidence,
        effort: a.effort,
        gaps: a.gaps,
        url: a.url || null,
        checked: a.checked || rates.dataset_checked,
        caveat: a.kind === 'self_hosted' ? 'Software license only — compute/storage/ops not in dataset' : null
      }))
      .sort((a, b) => {
        const sa = a.savings_mo == null ? -1e12 : a.savings_mo;
        const sb = b.savings_mo == null ? -1e12 : b.savings_mo;
        const aSelf = a.kind === 'self_hosted' ? 1 : 0;
        const bSelf = b.kind === 'self_hosted' ? 1 : 0;
        if (usage.priority === 'selfhost') {
          if (aSelf !== bSelf) return bSelf - aSelf;
        } else if (aSelf !== bSelf) {
          return aSelf - bSelf; // SaaS before self-host
        }
        if (usage.priority === 'features') {
          if (sa > 0 && sb > 0) return (a.effort.score - b.effort.score) || (sb - sa);
        }
        return sb - sa;
      });

    const levers = applyLevers(rates, usage, currentCost);

    // Top-line savings range for teaser (best modeled saver among SaaS with confidence not none)
    const savers = ranked.filter((r) => r.savings_mo != null && r.savings_mo > 0 && r.kind === 'saas');
    const selfSavers = ranked.filter((r) => r.kind === 'self_hosted' && r.savings_mo != null && r.savings_mo > 0);
    let teaserLow = null;
    let teaserHigh = null;
    if (savers.length) {
      const saves = savers.map((s) => s.savings_mo).sort((a, b) => a - b);
      teaserLow = saves[0];
      teaserHigh = saves[saves.length - 1];
      // Also consider on-stack levers
      if (levers.length) {
        const leverMax = Math.max(...levers.map((l) => l.estimated_save_mo));
        teaserHigh = Math.max(teaserHigh, leverMax);
      }
    } else if (levers.length) {
      const saves = levers.map((l) => l.estimated_save_mo).sort((a, b) => a - b);
      teaserLow = saves[0];
      teaserHigh = saves[saves.length - 1];
    } else if (selfSavers.length && currentCost > 0) {
      // Do not advertise software-$0 as dollar savings without infra — use levers only if present
      teaserLow = null;
      teaserHigh = null;
    }

    // Migration plan from top 3 ranked (excluding current-equivalent $0 save noise)
    const planTargets = ranked.filter((r) => (r.savings_mo == null || r.savings_mo > 0) || r.kind === 'self_hosted').slice(0, 4);
    const migration = planTargets.map((t, i) => ({
      step: i + 1,
      target: t.name,
      id: t.id,
      kind: t.kind,
      effort: t.effort,
      monthly: t.monthly,
      savings_mo: t.savings_mo,
      actions: migrationActions(usage, t),
      gaps: t.gaps
    }));

    const sources = [];
    const seen = new Set();
    function addSrc(v) {
      if (!v || seen.has(v.id || v.name)) return;
      seen.add(v.id || v.name);
      sources.push({
        name: v.name,
        url: v.url || null,
        checked: v.checked || rates.dataset_checked
      });
    }
    if (currentDef) addSrc(currentDef);
    for (const a of alternatives) addSrc(a);
    for (const s of rates.self_hosted || []) {
      const vd = rates.vendors[s.vendor_id];
      if (vd) addSrc(vd);
    }

    return {
      generated_at: new Date().toISOString(),
      disclaimer: rates.disclaimer,
      dataset_checked: rates.dataset_checked,
      usage,
      current: {
        ...current,
        baseline_mo: currentCost,
        baseline_source: currentSource
      },
      alternatives,
      self_hosted: selfHosted,
      ranked,
      levers,
      migration,
      teaser: {
        current_mo: currentCost,
        savings_low_mo: teaserLow,
        savings_high_mo: teaserHigh,
        label: teaserLow != null
          ? `Estimated savings range ${money(teaserLow)} – ${money(teaserHigh)} / mo`
          : 'Insufficient public unit rates to estimate a savings range for this profile'
      },
      sources,
      gaps_summary: collectGaps(current, alternatives, selfHosted)
    };
  }

  function collectGaps(current, alts, selfH) {
    const g = [];
    for (const x of [current, ...alts, ...selfH]) {
      for (const gap of x.gaps || []) {
        g.push({ vendor: x.name, ...gap });
      }
    }
    return g;
  }

  function migrationActions(usage, target) {
    const acts = [];
    if (target.kind === 'self_hosted') {
      acts.push('Spike: run OSS stack in a non-prod cluster; measure cardinality and retention disk.');
      acts.push('Confirm compliance/region constraints for self-host data plane.');
      acts.push('Plan dual-run (30–60 days) before cutting SaaS ingest.');
      acts.push('Budget infra separately — not in O11y Watch dataset.');
    } else {
      acts.push('Export current dashboards/alerts; map to target product equivalents.');
      acts.push('Pilot one service with OpenTelemetry → new backend; compare cardinality.');
      if (usage.retention_days > 30) acts.push('Negotiate or set retention to the minimum useful window before cutover.');
      if (usage.spans_mo > 5e6) acts.push('Enable head/tail sampling before full cutover.');
      acts.push('Keep current vendor read-only for one billing cycle as rollback.');
    }
    return acts;
  }

  /** Parse a simple usage CSV in-browser. Returns overrides object or { error }. */
  function parseUsageCsv(text) {
    if (!text || !String(text).trim()) return { error: 'Empty CSV' };
    const lines = String(text).trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return { error: 'Need a header row and at least one data row' };
    const split = (row) => {
      // simple CSV split with quotes
      const out = [];
      let cur = '', q = false;
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c === '"') { q = !q; continue; }
        if (c === ',' && !q) { out.push(cur.trim()); cur = ''; continue; }
        cur += c;
      }
      out.push(cur.trim());
      return out;
    };
    const headers = split(lines[0]).map((h) => h.toLowerCase().replace(/[\s-]+/g, '_'));
    const row = split(lines[1]);
    const map = {};
    headers.forEach((h, i) => { map[h] = row[i]; });

    const aliases = {
      hosts: ['hosts', 'host', 'host_count', 'containers', 'nodes'],
      log_gb_day: ['log_gb_day', 'logs_gb_day', 'log_gb', 'logs_gb', 'gb_day', 'log_volume_gb_day'],
      metric_series: ['metric_series', 'metrics', 'series', 'active_series', 'timeseries', 'custom_metrics'],
      spans_mo: ['spans_mo', 'spans', 'traces', 'spans_per_month', 'trace_spans'],
      retention_days: ['retention_days', 'retention', 'retain_days'],
      users: ['users', 'seats', 'full_users'],
      monthly_spend: ['monthly_spend', 'spend', 'bill', 'cost_mo', 'invoice']
    };
    const overrides = {};
    const matched = [];
    for (const [key, names] of Object.entries(aliases)) {
      for (const n of names) {
        if (map[n] != null && map[n] !== '') {
          const v = Number(String(map[n]).replace(/[$,]/g, ''));
          if (Number.isFinite(v)) {
            overrides[key] = v;
            matched.push(n + '→' + key);
            break;
          }
        }
      }
    }
    // Also support key,value two-column layout
    if (!matched.length && headers.length >= 2) {
      for (let i = 0; i < lines.length; i++) {
        const cols = split(lines[i]);
        const k = (cols[0] || '').toLowerCase().replace(/[\s-]+/g, '_');
        const v = Number(String(cols[1] || '').replace(/[$,]/g, ''));
        for (const [key, names] of Object.entries(aliases)) {
          if (names.includes(k) && Number.isFinite(v)) {
            overrides[key] = v;
            matched.push(k);
          }
        }
      }
    }
    if (!matched.length) return { error: 'No recognized columns. Use headers like hosts, log_gb_day, metric_series, spans_mo, retention_days, users, monthly_spend.' };
    return { overrides, matched };
  }

  return {
    runAudit,
    modelVendor,
    normalizeInput,
    parseUsageCsv,
    money,
    version: 1
  };
}

const O11yAudit = createAuditEngine();
export default O11yAudit;
export const runAudit = O11yAudit.runAudit;
export const parseUsageCsv = O11yAudit.parseUsageCsv;
export const money = O11yAudit.money;
if (typeof window !== 'undefined') window.O11yAudit = O11yAudit;
