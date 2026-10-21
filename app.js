const S=JSON.parse(localStorage.revAlarm||'null')||{wake:'07:00',armed:false,used:[],history:[]};
const save=()=>localStorage.revAlarm=JSON.stringify(S),pick=a=>a[Math.floor(Math.random()*a.length)],$=id=>document.getElementById(id);
let ctx,osc,timer,ringing=false,firedToday=null,snoozeUntil=null;
wake.value=S.wake;
function tick(){const d=new Date();$('now').textContent=d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'});
 const hm=d.toTimeString().slice(0,5);
 if(S.armed&&!ringing&&hm===S.wake&&firedToday!==d.toDateString()){firedToday=d.toDateString();ring()}
 if(snoozeUntil&&Date.now()>=snoozeUntil){snoozeUntil=null;ring()}
 $('status').textContent=S.armed?`Armed for ${S.wake}.`+(snoozeUntil?` Snoozing until ${new Date(snoozeUntil).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}.`:''):'Not armed.'}
setInterval(tick,1000);tick();
function beepLoop(){ctx=ctx||new (window.AudioContext||webkitAudioContext)();ctx.resume();let n=0;
 timer=setInterval(()=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=n++%2?880:1320;g.gain.setValueAtTime(.25,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.25);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+.25)},300)}
function stopSound(){clearInterval(timer)}
function ring(){ringing=true;$('court').hidden=false;$('court').classList.add('ringing');$('result').innerHTML='';$('face').textContent='👨‍⚖️';
 $('speech').textContent=pick(["ORDER! The alarm has spoken. Why should this court grant you five more minutes?","The defendant is AWAKE. Or claims not to be. Explain yourself.","Rise and shine, or rise and argue. Your choice.","This court is in session. The bed is not a valid witness."]);beepLoop();$('court').scrollIntoView({behavior:'smooth'})}
arm.onclick=()=>{S.wake=wake.value;S.armed=true;save();ctx=ctx||new (window.AudioContext||webkitAudioContext)();ctx.resume();tick()};
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
plead.onclick=()=>{const t=excuse.value.trim();if(!t){$('speech').textContent='Silence is not a defense. Speak!';return}
 const r=judge(t);const ok=r.total>=14;S.used.push(t);S.used=S.used.slice(-50);
 let msg=r.rep>.6?pick(REPEAT)+' ':'';msg+=pick(ok?GRANT:DENY);if(r.hits.length)msg+=` (The court notes your use of "${r.hits[0]}". ${pick(['Bold.','Shameless.','Effective.','Desperate.'])})`;
 $('face').textContent=ok?'😴':'😤';$('speech').textContent=msg;
 $('result').innerHTML=`<div class="verdict ${ok?'granted':'denied'}">${ok?'SNOOZE GRANTED':'SNOOZE DENIED'} · ${r.total}/30</div><div class="scores"><div>Creativity: ${r.creativity}/10</div><div>Length: ${r.length}/10</div><div>Keywords: ${r.kw}/10</div><div>Repeat penalty: -${r.penalty}</div></div>`+(ok?'':'<button id="awake">I\'m up. I\'m UP.</button>');
 S.history.unshift({t,ok,s:r.total,at:Date.now()});S.history=S.history.slice(0,20);save();renderHist();excuse.value='';
 if(ok){stopSound();ringing=false;$('court').classList.remove('ringing');snoozeUntil=Date.now()+5*60000}
 else $('awake').onclick=()=>{stopSound();ringing=false;$('court').classList.remove('ringing');$('speech').textContent=pick(['Good morning, defendant. Court adjourned.','Justice is served. So is breakfast, hopefully.']);$('result').innerHTML=''}};
mic.onclick=()=>{const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){$('speech').textContent='Your browser has no ears. Type it, counselor.';return}
 const r=new R();r.lang='en-US';mic.textContent='🎤 Listening...';r.onresult=e=>{excuse.value=e.results[0][0].transcript;mic.textContent='🎤 Plead out loud'};r.onend=()=>mic.textContent='🎤 Plead out loud';r.start()};
function renderHist(){$('history').innerHTML=S.history.length?S.history.map(h=>`<div class="hist">${h.ok?'✅':'❌'} ${h.s}/30 — "${h.t.replace(/</g,'&lt;')}"</div>`).join(''):'<div class="hist">No cases yet. A clean record.</div>'}
renderHist();
