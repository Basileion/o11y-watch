// Writes data/snapshot-history.json from the git history of snapshots/<id>.txt (RT-20261031-32).
// Run before committing a pricing refresh: node scripts/snapshot-history.mjs
// versions = commits in which snapshots/<id>.txt changed. A page that changed and was overwritten
// between two commits is not recoverable; known gaps come from data/changes.json entries that say so.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const vendors=JSON.parse(fs.readFileSync(path.join(root,'data/vendors.json'),'utf8'));
const changes=JSON.parse(fs.readFileSync(path.join(root,'data/changes.json'),'utf8'));
const out={generated:new Date().toISOString().slice(0,10),note:'versions = git commits in which the vendor snapshot text changed; gaps = known overwritten versions',vendors:{}};
for(const v of vendors){
  const f='snapshots/'+v.id+'.txt';
  const dates=fs.existsSync(path.join(root,f))?execFileSync('git',['log','--format=%ad','--date=short','--',f],{cwd:root}).toString().trim().split('\n').filter(Boolean):[];
  const gaps=changes.filter(c=>(String(c.vendor).toLowerCase()===v.name.toLowerCase()||v.name.toLowerCase().startsWith(String(c.vendor).toLowerCase()+" ("))&&/overwritten/i.test(c.summary)).map(c=>({date:c.date,note:'A saved version was overwritten before it was committed; the earlier text is not recoverable.'}));
  out.vendors[v.id]={versions:dates.length,first:dates.at(-1)||null,last:dates[0]||null,gaps};
}
fs.writeFileSync(path.join(root,'data/snapshot-history.json'),JSON.stringify(out,null,1)+'\n');
const S=Object.values(out.vendors);console.log('snapshot history:',S.length,'vendors,',S.reduce((a,b)=>a+b.versions,0),'versions, first',S.map(s=>s.first).filter(Boolean).sort()[0],', gaps',S.filter(s=>s.gaps.length).length);
