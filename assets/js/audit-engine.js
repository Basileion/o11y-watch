/**
 * O11y Watch — Observability Cost & Stack Audit engine (deterministic, client-side).
 * Uses structured rates from data/audit-rates.json (extracted from vendors.json).
 * Never invents prices: missing dimensions → explicit "not in dataset" gaps.
 *
 * Credibility rules (v2):
 * 1. Coverage: only rank a vendor when dataset rates cover every buyer dimension
 *    the vendor's model is expected to price. Partial coverage → insufficient list.
 * 2. Realism guardrails: floor-fraction + teaser cap + High/Medium/Low confidence.
 *    Free teaser headline = fully priced, HIGH-confidence SaaS options cheaper than the stated bill only
 *    (RT-20261031-77); self-host and levers are shown separately as assumptions.
 * 3. Self-host: software may be $0; infra+ops always estimated as an explicit range.
 */
export function createAuditEngine() {
  'use strict';

  const EFFORT = { none: 0, low: 1, medium: 2, high: 3 };
  const EFFORT_LABEL = ['None', 'Low', 'Medium', 'High'];

  // ---------------------------------------------------------------------------
  // Realism guardrails — heuristics documented for defensibility, not quotes.
  // ---------------------------------------------------------------------------
  // FLOOR_FRACTION (0.30): If a fully-covered modeled alternative lands below 30% of
  // the buyer's stated invoice, treat confidence as Low. Mature Datadog/NR bills
  // include APM, RUM, synthetics, and add-ons that sparse public unit rates miss;
  // a model that implies ~90%+ savings is almost always undercounting, not a deal.
  const FLOOR_FRACTION = 0.30;
  // MAX_TEASER_SAVE_PCT (0.40): Headline / free-teaser savings are capped at 40% of
  // baseline. Public migration case studies and FinOps write-ups rarely sustain
  // >40–50% without cutting retention/scope; advertising uncapped model deltas
  // (e.g. $8.2k → $165) destroys trust. Cap applies to teaser + summary ranges only;
  // full report still shows uncapped modeled totals with confidence labels.
  const MAX_TEASER_SAVE_PCT = 0.40;
  // Material usage thresholds — below these, a dimension is not "used" by the buyer.
  const MATERIAL = { hosts: 1, log_gb_day: 0.1, metric_series: 1000, spans_mo: 100000, users: 1 };

  function num(x, d) {
    const n = Number(x);
    return Number.isFinite(n) ? n : (d ?? 0);
  }

  function money(n) {
    if (n == null || !Number.isFinite(n)) return '—';
    const a = Math.abs(n);
    if (a >= 1000) return (n < 0 ? '-' : '') + '$' + Math.round(a).toLocaleString('en-US');
    // Keep cents on small unit rates (e.g. $0.40/GB) instead of rounding them to $0.
    const frac = a < 100 && Math.round(a * 100) % 100 !== 0 ? 2 : 0;
    return (n < 0 ? '-$' : '$') + (Math.round(a * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: frac, maximumFractionDigits: frac });
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
      peak_hosts: num(raw.peak_hosts),
      containers: num(raw.containers),
      fargate_tasks: num(raw.fargate_tasks),
      secondary_vendors: String(raw.secondary_vendors || ''),
      host_mem_gib: num(raw.host_mem_gib, 0),
      log_gb_day: num(raw.log_gb_day),
      log_gb_mo: num(raw.log_gb_day) * 30,
      metric_series: num(raw.metric_series),
      spans_mo: num(raw.spans_mo),
      // RT-20261031-78/79: optional exact volumes. When given, GB-billed trace pricing and Datadog
      // indexed-log pricing use them instead of an assumption / gap.
      trace_gb_mo: num(raw.trace_gb_mo),
      indexed_logs_m_mo: num(raw.indexed_logs_m_mo),
      retention_days: Math.max(1, num(raw.retention_days, 15)),
      users: num(raw.users),
      core_users: num(raw.core_users),
      team_size: String(raw.team_size || ''),
      priority: String(raw.priority || 'balanced'),
      compliance: Array.isArray(raw.compliance) ? raw.compliance : [],
      region: String(raw.region || ''),
      constraints: String(raw.constraints || ''),
      csv_overrides: raw.csv_overrides || null
    };
  }

  /** Dimensions the buyer actually uses (material non-zero). */
  function buyerDimensions(usage) {
    const dims = [];
    if (usage.hosts >= MATERIAL.hosts) dims.push('hosts');
    if (usage.log_gb_day >= MATERIAL.log_gb_day) dims.push('logs');
    if (usage.metric_series >= MATERIAL.metric_series) dims.push('metrics');
    if (usage.spans_mo >= MATERIAL.spans_mo) dims.push('traces');
    if (usage.users >= MATERIAL.users) dims.push('seats');
    return dims;
  }

  /**
   * Is the buyer replacing APM / full-stack monitoring (vs infrastructure-only)?
   * RT-20261031-45: tiered host vendors (Dynatrace) must be priced at the tier that
   * matches the workload — never the basic infra tier for APM.
   */
  function needsApm(usage) {
    if (usage.spans_mo >= MATERIAL.spans_mo) return true;
    return /\b(apm|full[\s-]?stack|trac(e|es|ing)|profil(e|er|ing)|code[\s-]?level)\b/i.test(usage.plans || '');
  }

  /** Pick the host tier for a tiered per-host vendor. Returns { key, tier, apm } or null. */
  function hostTier(rates, usage) {
    const T = rates.host_tiers;
    if (!T) return null;
    const apm = needsApm(usage);
    const key = apm ? rates.apm_tier : rates.infra_tier;
    return T[key] ? { key, tier: T[key], apm } : null;
  }

  /**
   * Which workload dimensions this vendor can defensibly price from dataset rates.
   * Returns { covered: string[], foldNotes: string[] }.
   *
   * Hosts / seats that the model does not charge are omitted from "required" later
   * (N/A), not counted as covered. Folded meters (one $/GB for logs+metrics+traces)
   * mark all three covered and attach a fold note that lowers confidence.
   */
  function vendorCoverage(vdef, usage) {
    const rates = vdef.rates || {};
    const model = vdef.model;
    const covered = new Set();
    const foldNotes = [];

    if (rates.host_mo_annual != null || rates.host_mo_ondemand != null) covered.add('hosts');
    if (rates.user_mo != null || rates.full_user_tiers) covered.add('seats');
    if (rates.metric_series_1k != null) covered.add('metrics');
    if (rates.span_million != null) covered.add('traces');
    if (rates.log_gb != null) covered.add('logs');

    // All-in-one GB meter: vendor publishes one $/GB for metrics+logs+traces.
    if (model === 'per_gb_all' && rates.log_gb != null) {
      covered.add('logs');
      if (rates.telemetry_gb_only) {
        // RT-20261031-55: vendor bills only GB of (uncompressed) telemetry and publishes no
        // per-host / per-span / per-series rate or bytes-per-span factor. Span and series
        // COUNTS cannot be converted to GB without inventing a factor → not covered
        // (vendor goes to "insufficient data" instead of being modeled at $0).
      } else {
        covered.add('metrics');
        covered.add('traces');
        foldNotes.push('Single $/GB meter covers logs+metrics+traces; volume proxy is survey log GB/mo only (metrics/trace bytes not converted).');
      }
    }

    // New Relic-style user + ingest GB: ingest GB stands in for logs; metrics/traces
    // are not separately metered in the dataset — fold with penalty.
    if (model === 'user_plus_gb' && rates.log_gb != null) {
      covered.add('logs');
      covered.add('metrics');
      covered.add('traces');
      foldNotes.push('Ingest GB used as combined proxy for logs/metrics/traces; dataset does not separate those meters.');
    }

    // RT-20261031-79: per-signal published rates (logs/traces $ per GB, metrics per series / GB / samples).
    // Traces given only as a span COUNT are still "covered" but via a stated conversion assumption
    // (modelVendor records it and confidence is capped at Medium).
    const sig = model === 'signal_gb' ? rates : (rates.signals || null);
    if (sig) {
      if (sig.logs && (sig.logs.gb != null || sig.logs.gib != null)) covered.add('logs');
      if (sig.traces && (sig.traces.gb != null || sig.traces.included_tier)) covered.add('traces');
      if (sig.metrics) covered.add('metrics');
    }

    // Dimensions this pricing model does not charge (N/A for coverage checks).
    const na = new Set();
    const hostModels = new Set(['per_host', 'per_host_plus_products']);
    if (model === 'signal_gb') {
      // Hosts are only charged when the vendor publishes an APM per-host fee and the buyer replaces APM.
      if (rates.apm_host_mo != null && needsApm(usage)) covered.add('hosts');
      else na.add('hosts');
    } else if (!hostModels.has(model)) na.add('hosts');
    if (rates.user_mo == null && model !== 'user_plus_gb') na.add('seats');

    // Opaque floors cannot defensibly cover usage dimensions.
    if (model === 'tier_floor' || model === 'compute_opaque') {
      covered.clear();
      foldNotes.push('Dataset has only a plan floor / opaque compute model — cannot map hosts/GB/series/spans to dollars.');
    }

    // usage_gb_samples: metric_sample_million exists but survey has series, not samples → metrics not covered.
    if (model === 'usage_gb_samples') {
      covered.delete('metrics');
    }

    // per_million_signals: log_million cannot convert from GB → logs not covered unless we invent events/GB.
    if (model === 'per_million_signals') {
      covered.delete('logs');
    }

    return { covered: [...covered], na: [...na], foldNotes };
  }

  /**
   * Coverage gate: required buyer dims minus model-N/A must all be covered.
   */
  function assessCoverage(vdef, usage) {
    const buyer = buyerDimensions(usage);
    const { covered, na, foldNotes } = vendorCoverage(vdef, usage);
    const coveredSet = new Set(covered);
    const naSet = new Set(na);
    const required = buyer.filter((d) => !naSet.has(d));
    const missing = required.filter((d) => !coveredSet.has(d));
    return {
      complete: missing.length === 0 && required.length > 0,
      required,
      missing,
      covered: covered.filter((d) => required.includes(d) || buyer.includes(d)),
      foldNotes,
      buyer
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
    // RT-20261031-78: a free tier that is a separate plan (Datadog Free = up to 5 Basic hosts, 1-day retention)
    // is never deducted from paid hosts.
    const freeHosts = vdef.free && vdef.free.hosts && !vdef.free.separate_plan ? vdef.free.hosts : 0;
    // RT-20261107-25: Datadog bills near the high-water mark (lower 99% of hourly counts). When the
    // buyer gives peak_hosts, use max(hosts, peak_hosts) for Datadog host lines; other vendors keep average.
    const avgHosts = usage.hosts;
    const peakHosts = usage.peak_hosts > 0 ? usage.peak_hosts : 0;
    const usePeak = vdef.model === 'per_host_plus_products' && peakHosts > avgHosts;
    const hostCount = usePeak ? peakHosts : avgHosts;
    const billHosts = Math.max(0, hostCount - freeHosts);

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
    const assumptions = [];
    function assume(dim, why) {
      assumptions.push({ dimension: dim, reason: why });
    }
    const conv = (opts.conversions) || {};
    const SPAN_BYTES = (conv.span_bytes && conv.span_bytes.value) || null;
    const DP_PER_SERIES = (conv.datapoints_per_series_mo && conv.datapoints_per_series_mo.value) || null;
    /** Trace GB/mo: exact when the buyer gave it; else span count x published average span size (assumption). */
    function traceGb() {
      if (usage.trace_gb_mo > 0) return { gb: usage.trace_gb_mo, assumed: false };
      if (usage.spans_mo >= MATERIAL.spans_mo && SPAN_BYTES) {
        const gb = (usage.spans_mo * SPAN_BYTES) / 1e9;
        return { gb, assumed: true, why: `Trace GB estimated from ${(usage.spans_mo / 1e6).toLocaleString('en-US')}M spans × ${SPAN_BYTES} bytes (Uptrace's published average span size, before custom attributes) = ${gb.toFixed(0)} GB. Real spans with attributes are larger; enter your trace GB/month for an exact figure.` };
      }
      return { gb: 0, assumed: false };
    }
    /** Metric datapoints/mo from active series at a 1-minute interval (assumption). */
    function datapoints() {
      const dp = usage.metric_series * (DP_PER_SERIES || 43200);
      return { dp, why: `Datapoints estimated as ${usage.metric_series.toLocaleString('en-US')} series × 1 per minute × 30 days = ${(dp / 1e6).toLocaleString('en-US', { maximumFractionDigits: 0 })}M (the OpenTelemetry/Prometheus default interval; 30s doubles it).` };
    }

    switch (vdef.model) {
      case 'per_host_plus_products': {
        const unit = opts.ondemand ? rates.host_mo_ondemand : rates.host_mo_annual;
        if (unit != null) add(`Infrastructure (${billHosts} hosts × ${money(unit)}/mo)`, billHosts * unit, { dim: 'hosts' });
        else gap('hosts', 'No host rate in dataset');
        const P = rates.products;
        if (!P) {
          if (rates.log_gb == null) gap('logs', 'Log $/GB not in O11y Watch dataset for ' + vdef.name + ' (products billed separately)');
          if (rates.metric_series_1k == null) gap('metrics', 'Custom metrics unit rate not in dataset for ' + vdef.name);
          if (rates.span_million == null) gap('traces', 'APM/span unit rate not in dataset for ' + vdef.name);
          if (rates.user_mo == null) gap('seats', 'Seat pricing not stated for ' + vdef.name);
          break;
        }
        // RT-20261031-78: full Datadog bill from the public list (APM, span ingest, logs, indexed logs, custom metrics).
        const apm = needsApm(usage);
        const apmHosts = apm ? hostCount : 0;
        if (apm && hostCount > 0) {
          const au = opts.ondemand ? P.apm_host_mo_ondemand : P.apm_host_mo_annual;
          add(`APM (${apmHosts} APM hosts × ${money(au)}/mo; assumes every host runs APM)`, apmHosts * au, { dim: 'traces', product: 'apm' });
          const tg = traceGb();
          const allot = apmHosts * P.span_ingest_allot_gb_per_apm_host;
          if (tg.gb > 0) {
            const over = Math.max(0, tg.gb - allot);
            add(`Ingested spans (${tg.gb.toFixed(0)} GB vs ${allot.toLocaleString('en-US')} GB included; ${over.toFixed(0)} GB × ${money(P.span_ingest_gb)})`, over * P.span_ingest_gb, { dim: 'traces', product: 'span_ingest' });
            if (tg.assumed) assume('traces', tg.why);
          }
          gap('indexed_spans', `Indexed spans: ${apmHosts}M included (1M per APM host, 15-day); extra billed ${money(P.indexed_spans_m['15'])}/M (15-day). The survey does not ask how many spans your retention filters index, so extra indexed spans are not added.`);
        } else if (usage.spans_mo >= MATERIAL.spans_mo) {
          gap('traces', 'Spans reported but no hosts entered, so APM host fees cannot be computed');
        }
        if (usage.log_gb_mo > 0) {
          add(`Log ingestion (${usage.log_gb_mo.toFixed(0)} GB × ${money(P.log_ingest_gb)})`, usage.log_gb_mo * P.log_ingest_gb, { dim: 'logs', product: 'log_ingest' });
          const ret = usage.retention_days <= 3 ? '3' : usage.retention_days <= 7 ? '7' : usage.retention_days <= 15 ? '15' : usage.retention_days <= 30 ? '30' : null;
          if (usage.indexed_logs_m_mo > 0 && ret) {
            add(`Indexed log events (${usage.indexed_logs_m_mo.toLocaleString('en-US')}M × ${money(P.indexed_logs_m[ret])}/M, ${ret}-day retention)`, usage.indexed_logs_m_mo * P.indexed_logs_m[ret], { dim: 'logs', product: 'log_index' });
          } else {
            gap('indexed_logs', `Indexed log events are billed per million events (${money(P.indexed_logs_m['15'])}/M at 15-day retention${ret ? '' : '; retention over 30 days is not on the public list'}). ${usage.indexed_logs_m_mo > 0 ? '' : 'Enter indexed log events per month to add this line; '}GB cannot be converted to events without an assumption, so it is not added.`);
          }
        }
        if (usage.metric_series >= MATERIAL.metric_series) {
          const incl = hostCount * P.custom_metrics_allot_per_pro_host;
          const over = Math.max(0, usage.metric_series - incl);
          add(`Custom metrics (${usage.metric_series.toLocaleString('en-US')} − ${incl.toLocaleString('en-US')} included = ${over.toLocaleString('en-US')} × ${money(P.custom_metrics_per_100)}/100)`, (over / 100) * P.custom_metrics_per_100, { dim: 'metrics', product: 'custom_metrics' });
        }
        // RT-20261107-25: model containers / Fargate when the survey provides them; otherwise keep the gap.
        if (usage.containers > 0 && P.container_mo != null) {
          const allot = billHosts * (P.containers_allot_per_pro_host || 0);
          const over = Math.max(0, usage.containers - allot);
          add(`Container Monitoring (${usage.containers.toLocaleString('en-US')} containers − ${allot.toLocaleString('en-US')} included (${P.containers_allot_per_pro_host} per Pro host × ${billHosts}) = ${over.toLocaleString('en-US')} × ${money(P.container_mo)}/mo)`, over * P.container_mo, { dim: 'containers', product: 'containers' });
        }
        if (usage.fargate_tasks > 0) {
          const fApp = opts.ondemand ? P.fargate_app_instance_mo_ondemand : P.fargate_app_instance_mo_annual;
          if (fApp != null) add(`Fargate app monitoring (${usage.fargate_tasks.toLocaleString('en-US')} tasks × ${money(fApp)}/mo)`, usage.fargate_tasks * fApp, { dim: 'containers', product: 'fargate' });
          if (apm) {
            const fApm = opts.ondemand ? P.fargate_apm_instance_mo_ondemand : P.fargate_apm_instance_mo_annual;
            if (fApm != null) add(`Fargate APM (${usage.fargate_tasks.toLocaleString('en-US')} tasks × ${money(fApm)}/mo)`, usage.fargate_tasks * fApm, { dim: 'containers', product: 'fargate_apm' });
          }
        }
        if (!(usage.containers > 0) && !(usage.fargate_tasks > 0)) {
          gap('containers', `Containers/Fargate not entered: Container Monitoring is ${money(P.container_mo)}/container/mo beyond ${P.containers_allot_per_pro_host} per Pro host; Fargate tasks are billed separately at public list rates.`);
        }
        if (usePeak) {
          assume('hosts', `Datadog bills the high-water mark of the lower 99% of hourly host counts (docs.datadoghq.com). Using peak hosts (${peakHosts}) instead of average (${avgHosts}) for Infrastructure/APM host lines.`);
        } else if (peakHosts > 0 && peakHosts <= avgHosts) {
          assume('hosts', `Peak hosts (${peakHosts}) ≤ average (${avgHosts}); billed at average. Datadog’s high-water mark would only raise the bill if peak exceeds average.`);
        }
        break;
      }
      case 'per_host': {
        const ht = hostTier(rates, usage);
        if (ht) {
          // RT-20261031-45: tier matches the workload being replaced (APM → Full-Stack, infra-only → Infrastructure).
          const t = ht.tier;
          if (t.gib_per_unit) {
            const mem = usage.host_mem_gib > 0 ? usage.host_mem_gib : t.gib_per_unit;
            const perHost = t.mo * (mem / t.gib_per_unit);
            add(`${t.label} (${usage.hosts} hosts × ${money(perHost)}/mo; ${money(t.mo)} per ${t.unit}, billed ${t.billed}${usage.host_mem_gib > 0 ? `; ${mem} GiB hosts` : '; assumes 8 GiB hosts — larger hosts cost proportionally more'})`, usage.hosts * perHost, { dim: 'hosts', tier: ht.key });
          } else {
            add(`${t.label} (${usage.hosts} × ${money(t.mo)}/mo per ${t.unit}${ht.apm ? '' : '; infrastructure only — APM needs Full-Stack'})`, usage.hosts * t.mo, { dim: 'hosts', tier: ht.key });
          }
        } else {
          const apmU = needsApm(usage) && rates.apm_host_mo_annual != null ? rates.apm_host_mo_annual : null;
          const unit = apmU != null ? apmU : rates.host_mo_annual;
          if (unit != null) add(`${apmU != null ? 'APM + infrastructure hosts' : 'Hosts'} (${usage.hosts} × ${money(unit)}/mo)`, usage.hosts * unit, { dim: 'hosts' });
          else gap('hosts', 'No host rate');
        }
        const S = rates.signals;
        if (S && ht) {
          // RT-20261031-79: Dynatrace rate card (logs per GiB + retain per GiB-day; metrics per 100k datapoints).
          if (S.logs && usage.log_gb_mo > 0) {
            const ing = usage.log_gb_mo * S.logs.gib;
            const keep = usage.log_gb_day * usage.retention_days * 30 * (S.logs.retain_gib_day || 0);
            add(`Logs (${usage.log_gb_mo.toFixed(0)} GB × ${money(S.logs.gib)}/GiB ingest + retain ${usage.log_gb_day} GB/day × ${usage.retention_days} days kept × $${S.logs.retain_gib_day}/GiB-day)`, ing + keep, { dim: 'logs' });
          }
          if (S.metrics && usage.metric_series >= MATERIAL.metric_series) {
            const d = datapoints();
            add(`Metrics (${(d.dp / 1e5).toLocaleString('en-US', { maximumFractionDigits: 0 })} × 100k datapoints × ${money(S.metrics.datapoints_100k)})`, (d.dp / 1e5) * S.metrics.datapoints_100k, { dim: 'metrics' });
            assume('metrics', d.why + ' Full-Stack may include a metrics allowance that the pricing page does not size, so this may overstate.');
          }
          if (S.traces && usage.spans_mo >= MATERIAL.spans_mo) {
            if (ht.key === S.traces.included_tier) {
              add(`Traces (included with ${ht.tier.label})`, 0, { dim: 'traces' });
              assume('traces', `${ht.tier.label} includes trace ingest, but the allowance size is not stated on the pricing page; overage ($0.20/GiB) not added.`);
            } else gap('traces', 'Traces need Full-Stack Monitoring');
          }
        }
        if (rates.log_gb == null) gap('logs', 'Log unit rate not in dataset');
        if (S && ht) { /* traces handled above */ } else if (rates.span_million == null) {
          if (ht && ht.key === rates.trace_allowance_included_tier) gap('traces', `${ht.tier.label} includes a trace allowance, but its size and the overage rate per span are not stated on the pricing page — span volume not modeled`);
          else gap('traces', 'Span/APM unit rate not in dataset');
        }
        break;
      }
      case 'user_plus_gb': {
        const freeGb = rates.free_gb_mo || 0;
        const ingestGb = usage.log_gb_mo;
        const T = rates.full_user_tiers;
        const nFull = Math.max(0, Math.round(usage.users));
        const nCore = Math.max(0, Math.round(usage.core_users || 0));
        if (T) {
          // Edition-aware full platform seats (all full users sit on one edition).
          const freeUsers = rates.free_full_users || 0;
          if (nFull <= freeUsers && nCore === 0 && ingestGb <= freeGb) {
            add(`Full platform users (${nFull}, Free edition: ${freeUsers} free full user)`, 0, { dim: 'seats' });
          } else if (nFull <= T.standard_max_full_users) {
            const cost = nFull > 0 ? T.standard_first + T.standard_additional * (nFull - 1) : 0;
            add(`Full platform users — Standard (${nFull}: ${money(T.standard_first)} first + ${Math.max(0, nFull - 1)} × ${money(T.standard_additional)})`, cost, { dim: 'seats' });
          } else {
            const unit = opts.ondemand ? T.pro_monthly : T.pro_annual;
            add(`Full platform users — Pro (${nFull} × ${money(unit)}/mo, ${opts.ondemand ? 'monthly pay-as-you-go' : 'annual commitment'}; Standard caps at ${T.standard_max_full_users})`, nFull * unit, { dim: 'seats' });
          }
          if (nCore > 0 && rates.core_user_mo != null) add(`Core users (${nCore} × ${money(rates.core_user_mo)})`, nCore * rates.core_user_mo, { dim: 'seats' });
        } else if (rates.user_mo != null) {
          const freeUsers = rates.free_full_users || 0;
          const billUsers = Math.max(0, usage.users - freeUsers);
          add(`Full platform users (${billUsers} × ${money(rates.user_mo)})`, billUsers * rates.user_mo, { dim: 'seats' });
        } else gap('seats', 'User rate missing');
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
      case 'signal_gb': {
        // RT-20261031-79: every used signal priced from the vendor's published per-signal rate.
        if (rates.platform_fee_mo != null) add(`Platform fee`, rates.platform_fee_mo, { dim: 'platform' });
        if (rates.apm_host_mo != null && needsApm(usage) && usage.hosts > 0) {
          add(`${rates.apm_label || 'APM'} (${usage.hosts} hosts × ${money(rates.apm_host_mo)}/mo)`, usage.hosts * rates.apm_host_mo, { dim: 'hosts' });
        }
        if (rates.user_mo != null && usage.users >= MATERIAL.users) {
          const billU = Math.max(0, Math.round(usage.users) - (rates.free_users || 0));
          add(`Active users (${billU} × ${money(rates.user_mo)}/mo after ${rates.free_users || 0} included)`, billU * rates.user_mo, { dim: 'seats' });
        }
        let sharedFree = null;
        const L = rates.logs, Tr = rates.traces, M = rates.metrics;
        if (L && usage.log_gb_mo > 0) {
          let free = L.free_gb || 0;
          if (L.shared_free) { sharedFree = free; }
          const bill = Math.max(0, usage.log_gb_mo - free);
          if (L.shared_free) sharedFree = Math.max(0, free - usage.log_gb_mo);
          add(`Logs (${bill.toFixed(0)} GB × ${money(L.gb)}${free ? ` after ${free} GB included` : ''})`, bill * L.gb, { dim: 'logs' });
        }
        if (Tr && (usage.spans_mo >= MATERIAL.spans_mo || usage.trace_gb_mo > 0)) {
          const tg = traceGb();
          const free = Tr.shared_free ? (sharedFree ?? Tr.free_gb ?? 0) : (Tr.free_gb || 0);
          const bill = Math.max(0, tg.gb - free);
          add(`Traces (${bill.toFixed(0)} GB × ${money(Tr.gb)}${free ? ` after ${free} GB included` : ''}${tg.assumed ? '; GB estimated from span count' : ''})`, bill * Tr.gb, { dim: 'traces' });
          if (tg.assumed) assume('traces', tg.why);
        }
        if (M && usage.metric_series >= MATERIAL.metric_series) {
          if (M.series_1k != null) {
            const bill = Math.max(0, usage.metric_series - (M.free_series || 0));
            add(`Active series (${(bill / 1000).toFixed(1)}k × ${money(M.series_1k)}/1k${M.free_series ? ` after ${(M.free_series / 1000).toFixed(0)}k included` : ''})`, (bill / 1000) * M.series_1k, { dim: 'metrics' });
          } else if (M.gb != null && M.series_per_gb) {
            const gb = usage.metric_series / M.series_per_gb;
            add(`Metrics (${usage.metric_series.toLocaleString('en-US')} series ÷ ${M.series_per_gb} per GB = ${gb.toFixed(1)} GB × ${money(M.gb)})`, gb * M.gb, { dim: 'metrics' });
          } else if (M.samples_million != null || M.datapoints_million != null) {
            const d = datapoints();
            const r = M.samples_million != null ? M.samples_million : M.datapoints_million;
            add(`Metrics (${(d.dp / 1e6).toLocaleString('en-US', { maximumFractionDigits: 0 })}M datapoints × ${money(r)}/M)`, (d.dp / 1e6) * r, { dim: 'metrics' });
            assume('metrics', d.why);
          }
        }
        if (rates.rate_conflict) assume('rates', `${vdef.name}'s pricing page shows two different starting per-GB rates; we use the higher one.`);
        if (rates.included_retention_days && usage.retention_days > rates.included_retention_days) gap('retention', `Retention over ${rates.included_retention_days} days is quote-only for ${vdef.name}`);
        if (rates.min_mo != null && total < rates.min_mo) add(`Minimum plan (includes ${money(rates.min_mo)} of usage)`, rates.min_mo - total, { dim: 'floor' });
        break;
      }
      case 'usage_gb_samples': {
        const gb = usage.log_gb_mo;
        if (rates.log_gb != null) add(`Usage GB (${gb.toFixed(0)} × ${money(rates.log_gb)})`, gb * rates.log_gb, { dim: 'logs' });
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
        if (vdef.model === 'per_gb_all') {
          if (rates.telemetry_gb_only) {
            if (usage.spans_mo >= MATERIAL.spans_mo) gap('traces', `${vdef.name} bills traces by GB of data volume (${money(rates.log_gb)}/GB); it publishes no per-span rate or bytes-per-span factor, so ${(usage.spans_mo / 1e6).toLocaleString('en-US')}M spans/mo cannot be priced`);
            if (usage.metric_series >= MATERIAL.metric_series) gap('metrics', `${vdef.name} bills metrics by GB of data volume; it publishes no per-series rate, so active series cannot be priced`);
            if (usage.hosts >= MATERIAL.hosts) gap('hosts', `${vdef.name} has no per-host fee; host telemetry is billed as GB of data volume, which this survey does not collect per host`);
          } else {
            gap('volume_proxy', 'All-in-one $/GB applied to log GB/mo only — metrics/trace byte volume not added');
          }
        }
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

    if (usage.retention_days > 30 && !rates.retention_multiplier) {
      gap('retention', 'Retention > 30 days; dataset has no retention surcharge multiplier for ' + vdef.name + ' — not adjusted');
    }

    // Base confidence from gap count (coverage gate applied later in runAudit).
    let confidence = 'low';
    if (modeled && gaps.length <= 1) confidence = 'high';
    else if (modeled && gaps.length <= 3) confidence = 'medium';
    else if (modeled) confidence = 'low';
    else confidence = 'none';
    // RT-20261031-79 honesty rule: High only when NOTHING the buyer uses is assumed or unpriced.
    if (confidence === 'high' && (assumptions.length || hasMaterialGap(gaps, usage))) confidence = 'medium';
    for (const a of assumptions) gaps.push({ dimension: 'assumption', about: a.dimension, reason: 'Assumption: ' + a.reason });

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
      assumptions,
      notes: vdef.notes || [],
      oss_self_host: vdef.oss_self_host,
      oss_label: vdef.oss_label || null
    };
  }

  /** A gap on a dimension the buyer actually uses (or retention/assumption) is material. */
  function hasMaterialGap(gaps, usage) {
    const used = new Set(buyerDimensions(usage));
    return (gaps || []).some((g) => used.has(g.dimension) || g.dimension === 'retention' || g.dimension === 'assumption' || g.dimension === 'volume_proxy' || g.dimension === 'overage' || g.dimension === 'compute' || g.dimension === 'fold');
  }

  /**
   * Apply realism floor: modeled alternative << stated invoice → Low confidence.
   * Fold notes also demote High → Medium.
   */
  function applyConfidenceGuards(model, baselineMo, coverage) {
    let conf = model.confidence;
    if (coverage && coverage.foldNotes && coverage.foldNotes.length) {
      if (conf === 'high') conf = 'medium';
      for (const n of coverage.foldNotes) {
        model.gaps.push({ dimension: 'fold', reason: n });
      }
    }
    if (baselineMo > 0 && model.modeled && model.total > 0) {
      const ratio = model.total / baselineMo;
      if (ratio < FLOOR_FRACTION) {
        conf = 'low';
        model.gaps.push({
          dimension: 'realism',
          reason: `Modeled ${money(model.total)}/mo is below ${(FLOOR_FRACTION * 100).toFixed(0)}% of stated/baseline ${money(baselineMo)}/mo — likely undercounting add-on SKUs. Confidence forced Low.`
        });
      }
    }
    if (conf === 'high' && hasMaterialGap(model.gaps, model._usage || {})) conf = 'medium';
    model.confidence = conf;
    return model;
  }

  function effortFrom(vdef, fromId) {
    const map = vdef.effort_from || {};
    const key = map[fromId] != null ? map[fromId] : (map.default || 'medium');
    return { key, label: EFFORT_LABEL[EFFORT[key] ?? 2], score: EFFORT[key] ?? 2 };
  }

  // RT-20261031-113: every lever is sized against the MODELED cost of the line(s) it acts on, never the stated bill.
  // log levers -> modeled log ingest/index lines; sampling -> modeled span ingest/overage/index lines (not per-host APM);
  // retention -> modeled retention-priced (index / retained-storage) lines; seat -> seat lines; host -> host lines.
  // Saving = pct x that line total, capped at the line. If no such line is modeled -> "not sized" (no $ figure).
  const LEVER_SCOPE = {
    log_filter: { label: 'log ingest + index', test: (l) => l.dim === 'logs' },
    sampling: { label: 'span ingest/overage + index', test: (l) => l.dim === 'traces' && l.product !== 'apm' },
    retention_cut: { label: 'retention-priced index/storage', test: (l) => l.product === 'log_index' || l.product === 'span_index' || /retain|retention|days kept/i.test(l.label || '') },
    seat_rationalize: { label: 'seat/user', test: (l) => l.dim === 'seats' },
    host_rightsize: { label: 'host', test: (l) => l.dim === 'hosts' }
  };
  const LEVER_UNMODELED = {
    log_filter: ['indexed_logs'],
    sampling: ['indexed_spans'],
    retention_cut: ['indexed_logs', 'indexed_spans'],
    seat_rationalize: [],
    host_rightsize: ['containers']
  };
  const GAP_PLAIN = { indexed_spans: 'indexed spans', indexed_logs: 'indexed log events', containers: 'containers/Fargate' };

  function leverScopeLines(id, lines) {
    const sc = LEVER_SCOPE[id];
    if (!sc) return [];
    return (lines || []).filter((l) => l && l.amount != null && sc.test(l));
  }

  function applyLevers(rates, usage, current) {
    const out = [];
    const lines = (current && current.modeled && Array.isArray(current.lines)) ? current.lines : [];
    const gapDims = new Set(((current && current.gaps) || []).map((g) => g.dimension));
    for (const L of rates.levers || []) {
      let applies = false;
      if (L.id === 'retention_cut' && usage.retention_days > 30) applies = true;
      if (L.id === 'sampling' && usage.spans_mo > 5e6) applies = true;
      if (L.id === 'log_filter' && usage.log_gb_day > 20) applies = true;
      if (L.id === 'seat_rationalize' && usage.users > 5) applies = true;
      if (!applies) continue;
      const sc = LEVER_SCOPE[L.id] || { label: 'matching' };
      const hit = leverScopeLines(L.id, lines);
      const base = Math.round(hit.reduce((a, l) => a + (Number(l.amount) || 0), 0) * 100) / 100;
      const pct = L.default_pct_save / 100;
      const unmodeled = (LEVER_UNMODELED[L.id] || []).filter((d) => gapDims.has(d)).map((d) => GAP_PLAIN[d] || d);
      const unNote = unmodeled.length ? ` Any saving on ${unmodeled.join(' and ')} is not sized: ${unmodeled.length === 1 ? 'it is' : 'they are'} not in the modeled cost.` : '';
      if (!hit.length) {
        out.push({
          id: L.id,
          name: L.name,
          description: L.description,
          pct: L.default_pct_save,
          sized: false,
          estimated_save_mo: null,
          line_mo: null,
          line_labels: [],
          basis_label: `Not sized: no modeled ${sc.label} line for ${current && current.name ? current.name : 'your current vendor'}`,
          note: `Not sized — we only put a $ figure on a lever when the line it reduces is modeled from public list prices.${unNote}`
        });
        continue;
      }
      const save = Math.min(Math.round(base * pct), Math.floor(base));
      out.push({
        id: L.id,
        name: L.name,
        description: L.description,
        pct: L.default_pct_save,
        sized: true,
        estimated_save_mo: save,
        line_mo: base,
        line_labels: hit.map((l) => l.label),
        basis_label: `~${L.default_pct_save}% of modeled ${sc.label} cost (${money(base)}/mo), capped at that line`,
        note: `Rule-of-thumb % of the modeled ${sc.label} line, not of your total bill — not a vendor quote. Validate against your bill.${base === 0 ? ' The modeled line is $0 at your usage, so this lever saves $0 there.' : ''}${unNote}`
      });
    }
    return out;
  }

  function pickAlternatives(rates, usage) {
    const primary = usage.primary_vendor;
    const preferSelf = usage.priority === 'selfhost';
    let ids = (rates.default_alternatives || []).slice();
    const extras = ['dynatrace', 'splunk', 'dash0', 'openobserve', 'observe', 'groundcover', 'honeycomb', 'axiom'];
    for (const e of extras) if (!ids.includes(e)) ids.push(e);
    ids = ids.filter((id) => id !== primary && rates.vendors[id]);
    if (preferSelf) {
      ids = ids.filter((id) => rates.vendors[id].oss_self_host).concat(ids.filter((id) => !rates.vendors[id].oss_self_host));
    }
    return ids.slice(0, 8);
  }

  /**
   * Self-host infra + ops range. Software may be $0; this is never $0 when there is usage.
   *
   * Assumptions (heuristic TCO, not a quote — documented for defensibility):
   * - Compute/agents path: ~$3–$8 per host/mo for running collectors + backend footprint
   *   scaled to fleet size (cheap VMs/spot at low end; reserved/HA at high end).
   * - Log/hot storage: ~$0.02–$0.06 per GB-day of retained volume
   *   (log_gb_day × retention_days), rough object/block storage + index overhead.
   * - Ops labor floor: $500/mo low (part-time caretaking) to max($2,000, $5×hosts)/mo
   *   for on-call, upgrades, and cardinality firefighting on a small team.
   * Midpoint of the range is used for ranking totals; UI shows the full range.
   */
  function estimateSelfHostInfra(usage) {
    const hosts = Math.max(0, usage.hosts || 0);
    const logGbDay = Math.max(0, usage.log_gb_day || 0);
    const retention = Math.max(1, usage.retention_days || 15);
    const computeLow = hosts * 3;
    const computeHigh = hosts * 8;
    const storageGb = logGbDay * retention;
    const storageLow = storageGb * 0.02;
    const storageHigh = storageGb * 0.06;
    const opsLow = hosts > 0 || logGbDay > 0 ? 500 : 0;
    const opsHigh = hosts > 0 || logGbDay > 0 ? Math.max(2000, hosts * 5) : 0;
    const low = Math.round(computeLow + storageLow + opsLow);
    const high = Math.round(computeHigh + storageHigh + opsHigh);
    const mid = Math.round((low + high) / 2);
    return {
      infra_low_mo: low,
      infra_high_mo: high,
      infra_mid_mo: mid,
      assumptions: [
        `Compute ~$3–$8/host/mo × ${hosts} hosts`,
        `Log storage ~$0.02–$0.06 per GB-day (${logGbDay} GB/day × ${retention} days kept)`,
        `Ops labor $500–$${Math.max(2000, hosts * 5).toLocaleString('en-US')}/mo`
      ]
    };
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
      current = modelVendor(currentDef, usage, { ondemand: false, conversions: rates.conversions });
      current.is_current = true;
      // RT-20261107-25: VCPU / hourly APM are contract-dependent — honesty note, not a priced line.
      if (currentDef.id === 'datadog') {
        current.notes = (current.notes || []).concat([
          'Datadog VCPU-based infrastructure pricing and hourly APM plans are contract-dependent. This model uses published per-host, per-container, and per-Fargate-task list rates only — we do not invent VCPU or hourly APM figures. Ask Datadog for your contract rates if those apply.'
        ]);
      }
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

    // RT-20261107-25: tool sprawl — note secondary vendors without inventing their list prices.
    if (usage.secondary_vendors && String(usage.secondary_vendors).trim()) {
      current.gaps.push({
        dimension: 'vendor',
        reason: `Other tools on the bill noted (“${String(usage.secondary_vendors).trim()}”). Sprawl is common; we do not invent list prices for secondary tools. Re-run with each as primary, or treat their spend as part of the gap vs your stated bill.`
      });
    } else if (Array.isArray(usage.vendors) && usage.vendors.length > 1) {
      const others = usage.vendors.filter((v) => v && v !== usage.primary_vendor);
      if (others.length) {
        current.gaps.push({
          dimension: 'vendor',
          reason: `Multiple vendors selected (${others.join(', ')} besides ${usage.primary_vendor}). Only the primary vendor is modeled from public list prices; others contribute to bill sprawl and are not invented here.`
        });
      }
    }

    const stated = usage.monthly_spend;
    let currentCost;
    let currentSource;
    if (current.modeled && current.confidence !== 'none' && current.total > 0) {
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
              reason: `Modeled ${money(current.total)}/mo vs stated ${money(stated)}/mo — large gap usually means missing product lines (APM/logs/metrics) in the dataset. Ranked savings use like-for-like modeled current; the free teaser still compares to your stated bill.`
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

    // RT-20261031-112: when public list prices model the current stack for the same usage,
    // rank SaaS/self-host savings against that modeled total (like-for-like). Never label an
    // option that costs more than modeled current as "savings" just because the stated bill is higher.
    // Teaser (RT-77) still compares only to the stated bill.
    const modeledCurrent = (current.modeled && current.total > 0) ? current.total : null;
    const likeForLikeBase = modeledCurrent != null ? modeledCurrent : currentCost;

    const altIds = pickAlternatives(rates, usage);
    const alternatives = [];
    const insufficient = [];

    for (const id of altIds) {
      const vdef = rates.vendors[id];
      const cov = assessCoverage(vdef, usage);
      const m = modelVendor(vdef, usage, { conversions: rates.conversions });
      m._usage = usage;
      const eff = effortFrom(vdef, usage.primary_vendor);

      // RT-20261031-55: a paid alternative may only compute to $0 for non-zero usage when every
      // required dimension is explained by a modeled line (i.e. a published free allowance in the
      // survey's units, e.g. "within 100 GB free"). Otherwise it is "insufficient data", never $0.
      let zeroReason = null;
      if (cov.complete && m.modeled && m.total === 0 && cov.required.length) {
        const lineDims = new Set(m.lines.map((l) => l.dim));
        const unexplained = cov.required.filter((d) => !lineDims.has(d));
        if (unexplained.length) zeroReason = `Computes to $0/mo for non-zero usage, but no published free allowance covers: ${unexplained.join(', ')} — insufficient data, not shown as $0`;
        cov.missing = unexplained;
      }

      if (!cov.complete || zeroReason) {
        insufficient.push({
          id: m.id,
          name: m.name,
          url: m.url,
          checked: m.checked,
          kind: 'saas',
          missing: cov.missing,
          required: cov.required,
          covered: cov.covered,
          reason: zeroReason || (cov.missing.length
            ? `Missing public unit rates for: ${cov.missing.join(', ')}`
            : 'No required usage dimensions to model'),
          gaps: m.gaps,
          // Never attach savings for insufficient coverage
          modeled_partial_total: m.modeled ? m.total : null,
          confidence: 'none',
          effort: eff
        });
        continue;
      }

      applyConfidenceGuards(m, currentCost, cov);
      delete m._usage;
      // RT-20261031-78: when public list prices explain under 40% of the stated bill, the bill holds products the
      // survey did not capture, so a saving against it cannot be High confidence for any alternative.
      if (m.confidence === 'high' && current.model_vs_stated != null && current.model_vs_stated < 0.4) {
        m.confidence = 'medium';
        m.gaps.push({ dimension: 'reconcile', reason: `Public list prices for your entered usage explain only ${Math.round(current.model_vs_stated * 100)}% of your stated bill, so the rest is products we did not ask about. Savings against your bill are not High confidence.` });
      }
      const saveVsStated = currentCost > 0 && m.modeled ? currentCost - m.total : null;
      const save = likeForLikeBase > 0 && m.modeled ? likeForLikeBase - m.total : null;
      alternatives.push({
        ...m,
        effort: eff,
        savings_mo: save,
        savings_pct: save != null && likeForLikeBase > 0 ? Math.round((save / likeForLikeBase) * 100) : null,
        savings_vs_stated_mo: saveVsStated,
        savings_basis: modeledCurrent != null ? 'like_for_like_modeled' : (currentCost > 0 ? 'stated_or_modeled_baseline' : 'none'),
        coverage: cov,
        kind: 'saas'
      });
    }

    // Self-hosted options with explicit infra+ops range (never advertised as $0 TCO).
    const selfHosted = (rates.self_hosted || []).map((s) => {
      const gaps = [];
      const infra = estimateSelfHostInfra(usage);
      if (s.software_mo == null) {
        gaps.push({ dimension: 'license', reason: 'Software license price not stated as a monthly unit rate' });
      }
      gaps.push({
        dimension: 'infra',
        reason: `Infra+ops estimated ${money(infra.infra_low_mo)}–${money(infra.infra_high_mo)}/mo (heuristic; not in O11y Watch dataset). ${infra.assumptions.join('; ')}.`
      });

      const software = s.software_mo == null ? null : s.software_mo;
      const total = software == null ? null : software + infra.infra_mid_mo;
      const totalLow = software == null ? null : software + infra.infra_low_mo;
      const totalHigh = software == null ? null : software + infra.infra_high_mo;
      const saveVsStated = total != null && currentCost > 0 ? currentCost - total : null;
      const save = total != null && likeForLikeBase > 0 ? likeForLikeBase - total : null;

      let confidence = 'low';
      if (software === 0 && infra.infra_mid_mo > 0) confidence = 'medium';
      if (software == null) confidence = 'none';

      return {
        id: s.id,
        name: s.name,
        vendor_id: s.vendor_id,
        total,
        total_low_mo: totalLow,
        total_high_mo: totalHigh,
        software_mo: software,
        infra_low_mo: infra.infra_low_mo,
        infra_high_mo: infra.infra_high_mo,
        infra_mid_mo: infra.infra_mid_mo,
        infra_assumptions: infra.assumptions,
        gaps,
        notes: [
          s.notes,
          `TCO uses software ${software == null ? 'n/a' : money(software)}/mo + infra/ops midpoint ${money(infra.infra_mid_mo)}/mo (range ${money(infra.infra_low_mo)}–${money(infra.infra_high_mo)}).`
        ],
        modeled: total != null,
        confidence,
        effort: { key: 'high', label: 'High', score: 3 },
        savings_mo: save,
        savings_pct: save != null && likeForLikeBase > 0 ? Math.round((save / likeForLikeBase) * 100) : null,
        savings_vs_stated_mo: saveVsStated,
        savings_basis: modeledCurrent != null ? 'like_for_like_modeled' : (currentCost > 0 ? 'stated_or_modeled_baseline' : 'none'),
        kind: 'self_hosted'
      };
    });

    // Rank only fully covered SaaS + self-host with modeled TCO. Never rank insufficient.
    const ranked = [...alternatives, ...selfHosted.filter((a) => a.modeled && a.total != null)]
      .filter((a) => a.modeled && a.total != null)
      .map((a) => ({
        id: a.id,
        name: a.name,
        kind: a.kind || 'saas',
        monthly: a.total,
        monthly_low: a.total_low_mo ?? a.total,
        monthly_high: a.total_high_mo ?? a.total,
        savings_mo: a.savings_mo,
        savings_pct: a.savings_pct,
        savings_vs_stated_mo: a.savings_vs_stated_mo,
        savings_basis: a.savings_basis,
        // RT-20261031-54 + RT-20261031-112: options that cost more than the like-for-like baseline
        // (modeled current when available, else stated bill) are flagged and ranked below every cheaper option.
        // Never label a more-expensive like-for-like option as savings.
        costs_more: likeForLikeBase > 0 && a.savings_mo != null && a.savings_mo < 0,
        costs_more_label: (likeForLikeBase > 0 && a.savings_mo != null && a.savings_mo < 0)
          ? (modeledCurrent != null
            ? `Costs more like-for-like than modeled ${current.name || 'current'} (+${money(-a.savings_mo)}/mo)`
            : `Costs more than your current bill (+${money(-a.savings_mo)}/mo)`)
          : null,
        confidence: a.confidence,
        effort: a.effort,
        gaps: a.gaps,
        url: a.url || null,
        checked: a.checked || rates.dataset_checked,
        caveat: a.kind === 'self_hosted'
          ? `Software ${money(a.software_mo)}/mo + estimated infra/ops ${money(a.infra_low_mo)}–${money(a.infra_high_mo)}/mo`
          : null
      }))
      .sort((a, b) => {
        // RT-20261031-54: savings come first. An option that costs more than the current bill is
        // never ranked above a cheaper option; among those, cheapest first. Confidence is secondary.
        if (a.costs_more !== b.costs_more) return a.costs_more ? 1 : -1;
        if (a.costs_more && b.costs_more) return (a.monthly - b.monthly) || 0;
        // Among options that save money (or when no baseline exists): confidence first
        // (never let Low-confidence "$7k savings" outrank Medium TCO), then savings.
        const confScore = { high: 2, medium: 1, low: 0, none: -1 };
        const ca = confScore[a.confidence] ?? -1;
        const cb = confScore[b.confidence] ?? -1;
        if (cb !== ca) return cb - ca;
        const sa = a.savings_mo == null ? -1e12 : a.savings_mo;
        const sb = b.savings_mo == null ? -1e12 : b.savings_mo;
        const aSelf = a.kind === 'self_hosted' ? 1 : 0;
        const bSelf = b.kind === 'self_hosted' ? 1 : 0;
        if (usage.priority === 'selfhost') {
          if (aSelf !== bSelf) return bSelf - aSelf;
        } else if (aSelf !== bSelf) {
          return aSelf - bSelf; // SaaS before self-host at equal confidence
        }
        if (usage.priority === 'features') {
          if (sa > 0 && sb > 0) return (a.effort.score - b.effort.score) || (sb - sa);
        }
        return sb - sa;
      });

    const levers = applyLevers(rates, usage, current);

    // Teaser (RT-20261031-77): the "conservative" headline counts ONLY fully priced SaaS options
    // (public unit rates cover every dimension the buyer uses) with HIGH confidence that are cheaper
    // than the buyer's own stated bill. Self-host TCO (assumption-driven ops labor + infra) and on-stack
    // levers (rule-of-thumb %) are never folded into it; they are reported separately with their assumptions.
    // If nothing qualifies, the teaser says so plainly instead of inventing a range.
    const statedBaseline = currentSource === 'stated_invoice' || currentSource === 'stated_invoice_only';
    const capSave = (n) => {
      if (n == null || currentCost <= 0) return n;
      return Math.min(n, Math.round(currentCost * MAX_TEASER_SAVE_PCT));
    };
    const conservativePool = statedBaseline && currentCost > 0
      ? ranked.filter((r) => r.kind === 'saas' && r.confidence === 'high' && !r.costs_more && r.savings_mo != null && r.savings_mo > 0)
      : [];
    const vendorSaves = conservativePool.map((r) => capSave(r.savings_mo)).filter((n) => n != null && n > 0).sort((a, b) => a - b);

    let teaserLow = null;
    let teaserHigh = null;
    let teaserBasis = 'none';
    if (vendorSaves.length) {
      teaserLow = vendorSaves[0];
      teaserHigh = vendorSaves[vendorSaves.length - 1];
      teaserBasis = 'priced_saas_high_confidence';
    } else if (!statedBaseline) {
      teaserBasis = 'no_stated_bill';
    }

    // Self-host: separate, explicitly assumption-driven estimate (never part of the conservative number).
    const selfModeled = selfHosted.filter((s) => s.total != null);
    let teaserSelf = null;
    if (selfModeled.length) {
      const infra = estimateSelfHostInfra(usage);
      const lo = Math.min(...selfModeled.map((s) => s.total_low_mo));
      const hi = Math.max(...selfModeled.map((s) => s.total_high_mo));
      teaserSelf = {
        options: selfModeled.length,
        cost_low_mo: lo,
        cost_high_mo: hi,
        assumptions: infra.assumptions.concat(['Span and metric-series storage not included']),
        label: `Self-host (${selfModeled.length} open-source stacks) is NOT in the number above: we estimate ${money(lo)}–${money(hi)}/mo to run it, an assumption, not a quote (${infra.assumptions.join('; ')}; span and metric-series storage not included). If your team's time costs more than that, the saving shrinks or disappears.`
      };
    }
    const teaserLevers = levers.map((l) => l.name);

    // RT-20261031-114: honest, non-leaking teaser for the "no High-confidence range" case.
    // Count (no names) of SaaS options priced below BOTH the stated bill and like-for-like modeled current,
    // with their confidence levels; plus a reconciliation of how much of the stated bill public list prices explain.
    const belowPool = statedBaseline && currentCost > 0
      ? ranked.filter((r) => r.kind === 'saas' && !r.costs_more && r.monthly != null && r.monthly < currentCost && r.savings_mo != null && r.savings_mo > 0)
      : [];
    const confOrder = ['high', 'medium', 'low'];
    const belowConf = confOrder.filter((c) => belowPool.some((r) => r.confidence === c));
    const CONF_WORD = { high: 'High', medium: 'Medium', low: 'Low' };
    const optionsBelow = belowPool.length
      ? { count: belowPool.length, confidence: belowConf, label: `${belowPool.length} SaaS option${belowPool.length === 1 ? '' : 's'} priced below your bill at public list prices (${belowConf.map((c) => CONF_WORD[c]).join('/')} confidence; names, reasons and gaps are in the full report).` }
      : null;
    let reconciliation = null;
    if (statedBaseline && current.modeled && current.modeled_total > 0 && currentCost > 0) {
      const explained = Math.round(current.modeled_total);
      const gapMo = Math.round(currentCost - explained);
      const GAP_ITEM = { indexed_spans: 'indexed spans', indexed_logs: 'indexed log events', containers: 'containers/Fargate', vendor: 'products not in our dataset' };
      const items = [];
      for (const g of current.gaps || []) { const w = GAP_ITEM[g.dimension]; if (w && !items.includes(w)) items.push(w); }
      if (!items.length) items.push('add-on products not in the survey (e.g. RUM, synthetics, security)');
      reconciliation = {
        stated_mo: currentCost,
        explained_mo: explained,
        gap_mo: gapMo,
        likely: items,
        label: gapMo > 0
          ? `Public list prices explain ${money(explained)} of your ${money(currentCost)}/mo bill; the ${money(gapMo)}/mo gap is likely in items we can't model from your answers: ${items.join(', ')}.`
          : `Public list prices explain ${money(explained)}/mo, at or above your stated ${money(currentCost)}/mo bill (you may have discounts or committed-use pricing).`
      };
    }

    const teaserCount = conservativePool.length;
    const teaserLabel = teaserLow != null
      ? `Conservative estimated savings ${money(teaserLow)} – ${money(teaserHigh)} / mo: ${teaserCount} SaaS option${teaserCount === 1 ? '' : 's'} fully priced from public list prices, high confidence, cheaper than your stated bill (capped at ${Math.round(MAX_TEASER_SAVE_PCT * 100)}% of your bill). Self-host and cleanup levers are not counted.`
      : teaserBasis === 'no_stated_bill'
        ? 'Enter your current monthly bill to see a conservative savings figure. We only compare against the bill you state.'
        : optionsBelow
          ? `${optionsBelow.label} No High-confidence savings figure yet: we only show a dollar range when public list prices cover all of your usage with high confidence.`
          : 'No fully priced cheaper SaaS option yet for this setup. We only show a dollar figure when public list prices cover all of your usage with high confidence and come in below your bill.';

    const planTargets = ranked
      .filter((r) => r.confidence === 'high' || r.confidence === 'medium' || r.kind === 'self_hosted')
      .filter((r) => r.savings_mo == null || r.savings_mo > 0)
      .slice(0, 4);
    const migration = planTargets.map((t, i) => ({
      step: i + 1,
      target: t.name,
      id: t.id,
      kind: t.kind,
      effort: t.effort,
      monthly: t.monthly,
      savings_mo: t.savings_mo,
      confidence: t.confidence,
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
    for (const s of insufficient) addSrc(s);
    for (const s of rates.self_hosted || []) {
      const vd = rates.vendors[s.vendor_id];
      if (vd) addSrc(vd);
    }

    return {
      generated_at: new Date().toISOString(),
      disclaimer: rates.disclaimer,
      dataset_checked: rates.dataset_checked,
      guardrails: {
        floor_fraction: FLOOR_FRACTION,
        max_teaser_save_pct: MAX_TEASER_SAVE_PCT,
        teaser_basis: teaserBasis
      },
      usage,
      current: {
        ...current,
        baseline_mo: currentCost,
        baseline_source: currentSource
      },
      alternatives,
      insufficient_pricing: insufficient,
      self_hosted: selfHosted,
      ranked,
      levers,
      migration,
      teaser: {
        current_mo: currentCost,
        savings_low_mo: teaserLow,
        savings_high_mo: teaserHigh,
        basis: teaserBasis,
        options_counted: teaserCount,
        label: teaserLabel,
        self_host: teaserSelf,
        options_below_bill: optionsBelow,
        reconciliation,
        levers: teaserLevers
      },
      sources,
      gaps_summary: collectGaps(current, alternatives, selfHosted, insufficient)
    };
  }

  function collectGaps(current, alts, selfH, insuff) {
    const g = [];
    for (const x of [current, ...alts, ...selfH]) {
      for (const gap of x.gaps || []) {
        g.push({ vendor: x.name, ...gap });
      }
    }
    for (const x of insuff || []) {
      g.push({ vendor: x.name, dimension: 'coverage', reason: x.reason });
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
      acts.push('Budget infra+ops using the estimated range in this report — software $0 ≠ TCO $0.');
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
      hosts: ['hosts', 'host', 'host_count', 'nodes'],
      peak_hosts: ['peak_hosts', 'peak_host', 'peak_host_count', 'max_hosts', 'host_peak'],
      containers: ['containers', 'container_count', 'pods', 'pod_count'],
      fargate_tasks: ['fargate_tasks', 'fargate', 'fargate_task_count', 'serverless_tasks'],
      host_mem_gib: ['host_mem_gib', 'host_memory_gib', 'host_memory_gb', 'mem_gib', 'memory_gib'],
      log_gb_day: ['log_gb_day', 'logs_gb_day', 'log_gb', 'logs_gb', 'gb_day', 'log_volume_gb_day'],
      metric_series: ['metric_series', 'metrics', 'series', 'active_series', 'timeseries', 'custom_metrics'],
      spans_mo: ['spans_mo', 'spans', 'traces', 'spans_per_month', 'trace_spans'],
      trace_gb_mo: ['trace_gb_mo', 'trace_gb', 'ingested_spans_gb', 'apm_ingested_gb', 'span_gb'],
      indexed_logs_m_mo: ['indexed_logs_m_mo', 'indexed_logs_m', 'indexed_log_events_m', 'indexed_logs_millions'],
      retention_days: ['retention_days', 'retention', 'retain_days'],
      users: ['users', 'seats', 'full_users'],
      core_users: ['core_users', 'core_seats'],
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
    if (!matched.length) return { error: 'No recognized columns. Use headers like hosts, peak_hosts, containers, fargate_tasks, log_gb_day, metric_series, spans_mo, retention_days, users, monthly_spend.' };
    return { overrides, matched };
  }

  // Paid-report fields — must never appear in pre-unlock sessionStorage/localStorage (RT-20261031-111).
  const FULL_REPORT_KEYS = [
    'ranked', 'alternatives', 'levers', 'migration',
    'insufficient_pricing', 'self_hosted', 'sources', 'gaps_summary'
  ];

  /** Strip a full runAudit() result down to what the free teaser may persist/render. */
  function toTeaserPayload(report) {
    const cur = report && report.current ? report.current : {};
    return {
      unlocked: false,
      generated_at: report && report.generated_at,
      disclaimer: report && report.disclaimer,
      dataset_checked: report && report.dataset_checked,
      guardrails: report && report.guardrails,
      usage: report && report.usage,
      current: {
        id: cur.id,
        name: cur.name,
        baseline_mo: cur.baseline_mo,
        baseline_source: cur.baseline_source,
        stated_spend: cur.stated_spend,
        modeled_total: cur.modeled_total
      },
      teaser: report && report.teaser
    };
  }

  function hasFullReportFields(obj) {
    if (!obj || typeof obj !== 'object') return false;
    return FULL_REPORT_KEYS.some((k) => obj[k] != null);
  }

  function isTeaserPayload(obj) {
    if (!obj || typeof obj !== 'object' || !obj.teaser) return false;
    return !hasFullReportFields(obj);
  }

  return {
    runAudit,
    modelVendor,
    normalizeInput,
    parseUsageCsv,
    buyerDimensions,
    needsApm,
    assessCoverage,
    estimateSelfHostInfra,
    money,
    hasMaterialGap,
    toTeaserPayload,
    hasFullReportFields,
    leverScopeLines,
    LEVER_SCOPE,
    isTeaserPayload,
    FULL_REPORT_KEYS,
    version: 6,
    FLOOR_FRACTION,
    MAX_TEASER_SAVE_PCT
  };
}

const O11yAudit = createAuditEngine();
export default O11yAudit;
export const runAudit = O11yAudit.runAudit;
export const parseUsageCsv = O11yAudit.parseUsageCsv;
export const money = O11yAudit.money;
if (typeof window !== 'undefined') window.O11yAudit = O11yAudit;
