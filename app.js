let S0=null;try{S0=JSON.parse(localStorage.revAlarm||'null')}catch(e){}
const S=Object.assign({wake:'07:00',armed:false,target:null,used:[],history:[]},S0||{});
const save=()=>localStorage.revAlarm=JSON.stringify(S),pick=a=>a[Math.floor(Math.random()*a.length)],$=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let ctx,timer=null,ringing=false,lock=null;
const wake=$('wake'),excuse=$('excuse'),plead=$('plead'),mic=$('mic'),arm=$('arm'),test=$('test');
wake.value=S.wake;
function audio(){if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=new A()}
 if(ctx.state!=='running')ctx.resume();return ctx}
// iOS: unlock audio on the very first tap by playing a silent buffer
function unlock(){const c=audio();if(c){const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0)}
 document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('touchend',unlock,true);document.removeEventListener('keydown',unlock,true)}
document.addEventListener('pointerdown',unlock,true);document.addEventListener('touchend',unlock,true);document.addEventListener('keydown',unlock,true);
async function wakeLock(on){try{if(on&&'wakeLock' in navigator&&!lock&&document.visibilityState==='visible'){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',()=>lock=null)}
 else if(!on&&lock){await lock.release();lock=null}}catch(e){lock=null}tick()}
document.addEventListener('visibilitychange',()=>{if(S.armed&&document.visibilityState==='visible')wakeLock(true)});
function nextTarget(hm){const[h,m]=hm.split(':').map(Number),d=new Date();d.setHours(h,m,0,0);if(d.getTime()<=Date.now())d.setDate(d.getDate()+1);return d.getTime()}
const fmt=t=>new Date(t).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
function tick(){$('now').textContent=new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'});
 if(S.armed&&S.target&&!ringing&&Date.now()>=S.target){ring()}
 $('status').textContent=S.armed?(S.snooze?`💤 Snoozing until ${fmt(S.target)}.`:`⏰ Armed for ${fmt(S.target)}.`)+(lock?' Screen will stay on.':(('wakeLock' in navigator)?'':' (This browser can\'t keep the screen on; turn off auto-lock.)')):'Not armed.';
 arm.textContent=S.armed?'Disarm':'Arm the alarm'}
setInterval(tick,1000);
function beepLoop(){const c=audio();if(!c||timer)return;let n=0;
 timer=setInterval(()=>{const o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.value=n++%2?880:1320;g.gain.setValueAtTime(.25,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.25);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.25)},300)}
function stopSound(){clearInterval(timer);timer=null}
function endRing(){stopSound();ringing=false;$('court').classList.remove('ringing')}
function ring(){if(ringing)return;ringing=true;document.body.dataset.rang=(+document.body.dataset.rang||0)+1;
 if(S.armed){S.snooze=false;S.target=nextTarget(S.wake);save()}
 $('court').hidden=false;$('court').classList.add('ringing');$('result').innerHTML='';$('face').textContent='👨‍⚖️';
 $('speech').textContent=pick(["ORDER! The alarm has spoken. Why should this court grant you five more minutes?","The defendant is AWAKE. Or claims not to be. Explain yourself.","Rise and shine, or rise and argue. Your choice.","This court is in session. The bed is not a valid witness."]);beepLoop();$('court').scrollIntoView({behavior:'smooth'});excuse.focus({preventScroll:true})}
const R=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!R){mic.hidden=true;$('micNote').hidden=false}
arm.onclick=()=>{audio();if(S.armed){S.armed=false;S.snooze=false;S.target=null;endRing();save();wakeLock(false);return}
 if(!wake.value){$('status').textContent='Pick a time first, counselor.';return}S.wake=wake.value;S.armed=true;S.snooze=false;S.target=nextTarget(S.wake);save();wakeLock(true)};
wake.onchange=()=>{if(S.armed&&wake.value){S.wake=wake.value;S.target=nextTarget(S.wake);save();tick()}};
test.onclick=ring;
const KW={sick:3,dream:3,dragon:4,cat:2,dog:2,baby:2,storm:2,snow:3,lansing:3,shift:3,closing:3,overtime:4,tired:1,please:1,honor:3,constitution:4,lawyer:4,alien:5,ghost:4,wizard:5,quantum:5,'your honor':4,science:3,mom:2,blanket:2,cold:2,dark:2,michigan:3,spartan:3,prophecy:5,destiny:4};
const words=s=>s.toLowerCase().match(/[a-z']+/g)||[];
function similarity(a,b){const A=new Set(words(a)),B=new Set(words(b));if(!A.size||!B.size)return 0;let i=0;A.forEach(w=>B.has(w)&&i++);return i/Math.min(A.size,B.size)}
function judge(text){const w=words(text),uniq=new Set(w);
 const length=Math.min(10,Math.round(w.length/3));
 let kw=0,hits=[];for(const k in KW)if(text.toLowerCase().includes(k)){kw+=KW[k];hits.push(k)}kw=Math.min(10,kw);
 const creativity=Math.min(10,Math.round((uniq.size/Math.max(1,w.length))*5+w.filter(x=>x.length>7).length*1.2+(/[!?]/.test(text)?1:0)));
 let rep=0,worst='';S.used.forEach(u=>{const s=similarity(text,u);if(s>rep){rep=s;worst=u}});
 const penalty=Math.round(rep*15);const total=Math.max(0,length+kw+creativity-penalty);
 return{length,kw,creativity,penalty,total,hits,rep,worst}}
const GRANT=["The court finds your argument... annoyingly compelling. FIVE MINUTES. Use them wisely.","Motion GRANTED. I haven't heard nonsense this beautiful since law school.","Sustained! Return to your blanket fort, citizen.","Fine. FINE. Five minutes. The jury (your cat) agrees."];
const DENY=["DENIED. That excuse wouldn't survive a parking ticket appeal.","Objection! On the grounds of being weak. Get up.","The court is unmoved. Feet. On. Floor.","I've heard better excuses from a Roomba. Rise.","Motion DENIED. The coffee won't brew itself."];
const REPEAT=["Recycled excuse detected! This court has a memory, unlike you before 9am.","You used that one already. Plagiarizing yourself is still plagiarism.","Déjà vu? No. Lazy. DENIED harder."];
plead.onclick=()=>{if(plead.disabled)return;const t=excuse.value.trim();if(!t){$('speech').textContent='Silence is not a defense. Speak!';return}
 const r=judge(t);const ok=r.total>=14;S.used.push(t);S.used=S.used.slice(-50);
 let msg=r.rep>.6?pick(REPEAT)+' ':'';msg+=pick(ok?GRANT:DENY);if(r.hits.length)msg+=` (The court notes your use of "${r.hits[0]}". ${pick(['Bold.','Shameless.','Effective.','Desperate.'])})`;
 $('face').textContent=ok?'😴':'😤';$('speech').textContent=msg;
 $('result').innerHTML=`<div class="verdict ${ok?'granted':'denied'}">${ok?'SNOOZE GRANTED':'SNOOZE DENIED'} · ${r.total}/30</div><div class="scores"><div>Creativity: ${r.creativity}/10</div><div>Length: ${r.length}/10</div><div>Keywords: ${r.kw}/10</div><div>Repeat penalty: -${r.penalty}</div></div>`+(ok?'':'<button id="awake">I\'m up. I\'m UP.</button>');
 S.history.unshift({t,ok,s:r.total,at:Date.now()});S.history=S.history.slice(0,20);save();renderHist();excuse.value='';
 if(ok&&ringing){endRing();S.armed=true;S.snooze=true;S.target=Date.now()+5*60000;save();wakeLock(true);tick()}
 else if(!ok)$('awake').onclick=()=>{endRing();$('speech').textContent=pick(['Good morning, defendant. Court adjourned.','Justice is served. So is breakfast, hopefully.']);$('result').innerHTML=''}};
let listening=false;mic.onclick=()=>{if(!R||listening)return;try{const r=new R();r.lang='en-US';listening=true;mic.textContent='🎤 Listening...';
 r.onresult=e=>{excuse.value=e.results[0][0].transcript};r.onerror=e=>{$('speech').textContent=e.error==='not-allowed'?'The court can\'t hear you: microphone blocked. Type it instead.':'Your words were lost in the void. Try again or type.'};
 r.onend=()=>{listening=false;mic.textContent='🎤 Plead out loud'};r.start()}catch(e){listening=false;mic.textContent='🎤 Plead out loud'}};
function renderHist(){$('history').innerHTML=S.history.length?S.history.map(h=>`<div class="hist">${h.ok?'✅':'❌'} ${h.s}/30 — "${esc(h.t)}"</div>`).join(''):'<div class="hist">No cases yet. A clean record.</div>'}
renderHist();
if(S.armed&&(!S.target||S.target<Date.now()-3600e3))S.target=nextTarget(S.wake);if(S.armed)wakeLock(true);tick();
