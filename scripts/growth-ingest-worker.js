/* growth-ingest Worker — events + audit unlock gate */
const ALLOWED = {
  page_view: 1, cta_click: 1, kit_submit: 1, checkout_click: 1,
  audit_checkout: 1, pro_checkout: 1, sponsor_checkout: 1, ab_expose: 1,
  audit_unlock: 1, audit_unlock_check: 1
};

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };
}

function isTest(body) {
  if (!body) return false;
  if (body.test === true || body.test === 1 || body.test === "1" || body.test === "true") return true;
  const c = String(body.cta || ""), camp = String(body.utm_campaign || "");
  return c.startsWith("__grow_test") || camp.startsWith("__grow_test") || camp === "ACT-TEST";
}

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function unlockProof(env) {
  const secret = env.AUDIT_UNLOCK_TOKEN;
  if (!secret) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(String(secret)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("o11y-audit-unlock-v1"));
  return hex(sig).slice(0, 32);
}

function writeAe(env, site, event, path, cta, utm_source, utm_campaign, utm_medium, variant, referrer_host, test) {
  const ae = env.GROWTH;
  const bound = !!(ae && typeof ae.writeDataPoint === "function");
  if (bound) {
    ae.writeDataPoint({
      indexes: [site || "unknown"],
      blobs: [site, event, path, cta, utm_source, utm_campaign, utm_medium, variant, referrer_host, test ? "test" : ""],
      doubles: [1, test ? 1 : 0]
    });
  }
  return bound;
}

export default {
  async fetch(request, env) {
    const headers = cors(request.headers.get("Origin"));
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "method" }), { status: 405, headers });
    }
    let body;
    try { body = await request.json(); }
    catch { return new Response(JSON.stringify({ ok: false, error: "bad_json" }), { status: 400, headers }); }

    const event = String(body.event || "").slice(0, 40);
    if (!ALLOWED[event]) {
      return new Response(JSON.stringify({ ok: false, error: "bad_event" }), { status: 400, headers });
    }

    const site = String(body.site || "").slice(0, 80);
    const path = String(body.path || "").slice(0, 200);
    const cta = String(body.cta || "").slice(0, 80);
    const utm_source = String(body.utm_source || "").slice(0, 80);
    const utm_campaign = String(body.utm_campaign || "").slice(0, 80);
    const utm_medium = String(body.utm_medium || "").slice(0, 40);
    const variant = String(body.variant || "").slice(0, 40);
    let referrer_host = "";
    try {
      if (body.referrer) referrer_host = new URL(String(body.referrer)).hostname.slice(0, 80);
    } catch { referrer_host = String(body.referrer || "").slice(0, 80); }
    const test = isTest(body);

    // Purchase unlock: Kit thank-you redirect hits /audit-unlock.html?t=TOKEN → client POSTs here.
    if (event === "audit_unlock") {
      const expect = env.AUDIT_UNLOCK_TOKEN;
      if (!expect) {
        return new Response(JSON.stringify({ ok: false, error: "unlock_not_configured" }), { status: 503, headers });
      }
      const token = String(body.token || "");
      if (!token || token !== expect) {
        writeAe(env, site, "audit_unlock_fail", path, cta, utm_source, utm_campaign, utm_medium, variant, referrer_host, test);
        return new Response(JSON.stringify({ ok: false, error: "bad_token" }), { status: 401, headers });
      }
      const proof = await unlockProof(env);
      const bound = writeAe(env, site, event, path, cta, utm_source, utm_campaign, utm_medium, variant, referrer_host, test);
      return new Response(JSON.stringify({ ok: true, proof, bound }), { status: 200, headers });
    }

    if (event === "audit_unlock_check") {
      const expectProof = await unlockProof(env);
      if (!expectProof) {
        return new Response(JSON.stringify({ ok: false, error: "unlock_not_configured" }), { status: 503, headers });
      }
      const proof = String(body.proof || "");
      if (!proof || proof !== expectProof) {
        return new Response(JSON.stringify({ ok: false, error: "bad_proof" }), { status: 401, headers });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    const bound = writeAe(env, site, event, path, cta, utm_source, utm_campaign, utm_medium, variant, referrer_host, test);
    return new Response(JSON.stringify({ ok: true, test: !!test, bound }), { status: 200, headers });
  }
};
