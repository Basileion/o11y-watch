(function(){var L=window.localStorage||{},sub=L.o11ySub==='1';
window.o11ySub=function(f){if(!window.fetch||!window.FormData)return true;var m=f.querySelector('.sub-msg'),b=f.querySelector('button');b.disabled=true;
fetch(f.action,{method:'POST',body:new FormData(f),headers:{Accept:'application/json'}}).then(function(r){if(!r.ok)throw 0;return r.json().catch(function(){return{}})}).then(function(d){if(d&&d.status==='quarantined'&&d.url){location.href=d.url;return}if(d&&d.status&&d.status!=='success')throw 0;try{L.o11ySub='1'}catch(x){}m.textContent='Check your inbox to confirm your subscription.';f.querySelector('input[type=email]').value='';b.disabled=false}).catch(function(){b.disabled=false;f.onsubmit=null;f.submit()});return false};
window.o11yX=function(k){var el=document.getElementById(k==='bar'?'sbar':'exitp');if(el)el.hidden=true;try{L['o11yX_'+k]=Date.now()}catch(x){}};
if(sub)document.querySelectorAll('.cta,.signup').forEach(function(n){n.hidden=true});
var bar=document.getElementById('sbar');if(bar&&!sub&&!L.o11yX_bar&&!/subscribe/.test(location.pathname))bar.hidden=false;
var shown=0;function ex(){if(shown||sub||L.o11yX_exit||/subscribe/.test(location.pathname))return;var d=document.documentElement;if((d.scrollTop+innerHeight)/d.scrollHeight>.85&&d.scrollHeight>innerHeight*1.6){shown=1;document.getElementById('exitp').hidden=false}}
addEventListener('scroll',ex,{passive:true});document.addEventListener('mouseout',function(e){if(!e.relatedTarget&&e.clientY<5&&scrollY>400){ex();shown=1;if(!sub&&!L.o11yX_exit)document.getElementById('exitp').hidden=false}});})();
