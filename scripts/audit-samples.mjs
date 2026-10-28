#!/usr/bin/env node
/** Sanity-check the audit engine with 3 realistic profiles. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import O11yAudit from '../assets/js/audit-engine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rates = JSON.parse(fs.readFileSync(path.join(root, 'data/audit-rates.json'), 'utf8'));

const profiles = [
  {
    name: 'Datadog-heavy mid-size',
    input: {
      vendors: ['datadog', 'sentry'],
      primary_vendor: 'datadog',
      plans: 'Infra Pro + APM + Logs',
      monthly_spend: 8200,
      hosts: 180,
      log_gb_day: 75,
      metric_series: 400000,
      spans_mo: 120000000,
      retention_days: 45,
      users: 18,
      team_size: '21-50',
      priority: 'cost',
      compliance: ['soc2'],
      region: 'us'
    }
  },
  {
    name: 'New Relic growth team',
    input: {
      vendors: ['newrelic'],
      primary_vendor: 'newrelic',
      plans: 'Standard full platform users',
      monthly_spend: 3100,
      hosts: 60,
      log_gb_day: 25,
      metric_series: 80000,
      spans_mo: 40000000,
      retention_days: 30,
      users: 14,
      team_size: '6-20',
      priority: 'balanced',
      compliance: ['gdpr'],
      region: 'eu'
    }
  },
  {
    name: 'Grafana Cloud stack',
    input: {
      vendors: ['grafana'],
      primary_vendor: 'grafana',
      plans: 'Grafana Cloud Pro',
      monthly_spend: 1400,
      hosts: 40,
      log_gb_day: 15,
      metric_series: 220000,
      spans_mo: 15000000,
      retention_days: 30,
      users: 8,
      team_size: '6-20',
      priority: 'selfhost',
      compliance: ['none'],
      region: 'us'
    }
  }
];

const summaries = [];
for (const p of profiles) {
  const r = O11yAudit.runAudit(p.input, rates);
  const top = r.ranked.slice(0, 5).map((x) => ({
    name: x.name,
    monthly: x.monthly,
    savings: x.savings_mo,
    effort: x.effort.label,
    confidence: x.confidence,
    kind: x.kind
  }));
  const summary = {
    profile: p.name,
    baseline_mo: r.current.baseline_mo,
    baseline_source: r.current.baseline_source,
    modeled_current: r.current.modeled_total ?? r.current.total,
    teaser: r.teaser,
    top5: top,
    levers: r.levers.map((l) => `${l.name}: ~$${l.estimated_save_mo}/mo`),
    gap_count: r.gaps_summary.length,
    migration_steps: r.migration.length
  };
  summaries.push(summary);
  console.log('\n===', p.name, '===');
  console.log('Baseline:', O11yAudit.money(summary.baseline_mo), `(${summary.baseline_source})`);
  console.log('Teaser:', summary.teaser.label);
  console.log('Top options:');
  for (const t of top) {
    console.log(`  - ${t.name} [${t.kind}]: ${O11yAudit.money(t.monthly)}/mo, save ${t.savings == null ? '—' : O11yAudit.money(t.savings)}, effort ${t.effort}, conf ${t.confidence}`);
  }
  console.log('Levers:', summary.levers.join('; ') || 'none');
  console.log('Gaps recorded:', summary.gap_count);
}

const out = path.join(root, 'reports/audit-samples.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(summaries, null, 2));
console.log('\nWrote', out);
