// Billing-unit parsing for paid_from strings (RT-20261031-31).
// A paid_from price is only "lower" than another when both use the same currency and the same billing unit.
// Unit = whatever follows the FIRST currency amount, up to the next amount / bracket / '+' / ';'.
export const UNIT_LABEL={host:'per host',gb:'per GB',volume:'per million spans/events',user:'per user/seat',monitor:'per monitor',month:'flat monthly plan',other:'unit not stated'};
export function parsePrice(s){
  if(!s||/^not stated/i.test(String(s).trim())) return null;
  const str=String(s).replace(/(\d),(\d{3})/g,'$1$2');
  const m=str.match(/([$€£])\s*(\d+(?:\.\d+)?)/); if(!m) return null;
  const seg=str.slice(m.index+m[0].length).split(/[$€£(;+]/)[0].toLowerCase();
  let unit='other';
  if(/\bhost\b/.test(seg)) unit='host';
  else if(/\bgi?b\b/.test(seg)) unit='gb';
  else if(/\b(span|spans|event|events|trace|traces|request|requests)\b/.test(seg)&&/\bper\b/.test(seg)) unit='volume';
  else if(/\b(user|seat|member|responder)s?\b/.test(seg)) unit='user';
  else if(/\bmonitors?\b/.test(seg)) unit='monitor';
  else if(/\/\s*mo\b|\/\s*month\b|\bper month\b|\bmonthly\b/.test(seg)) unit='month';
  return {amount:Number(m[2]),cur:m[1],unit};
}
// Is peer a's stated paid_from lower than subject v's, on a like-for-like basis?
// Vendors with paid_from_scope (e.g. a basic-only entry tier) are never counted as "lower".
export function compareLower(v,a){
  const pv=parsePrice(v.paid_from),pa=parsePrice(a.paid_from);
  if(!pv||!pa) return {lower:false,reason:'missing'};
  if(pv.cur!==pa.cur||pv.unit!==pa.unit||pv.unit==='other') return {lower:false,reason:'unit',unit:pa.unit};
  if(v.paid_from_scope) return {lower:false,reason:'subjtier',unit:pa.unit};
  if(a.paid_from_scope&&pa.amount<pv.amount) return {lower:false,reason:'tier',unit:pa.unit};
  return {lower:pa.amount<pv.amount,reason:'same',unit:pa.unit};
}
