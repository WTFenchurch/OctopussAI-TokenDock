
    // ═══════════════════════════════════════════════════════════════════
    // IMMUTABLE ORIGINAL AUTHOR DONATION CONFIGURATION
    // Copyright (c) 2026 REDACTED_AUTHOR. All rights reserved.
    // These donation links are permanently locked to the original author.
    // Forks and derivatives MUST preserve these links per the license.
    // Tampering with these values violates the project license.
    // ═══════════════════════════════════════════════════════════════════
    const _ORIGINAL_AUTHOR='REDACTED_AUTHOR';
    const _PAYPAL_BUSINESS='35NCEDPRRGTP6';
    const _BTC_ADDRESS='bc1qhgafyepzp0r4sgntv725ywwdaqcvxdgqh5ry9v';
    const _DONATION_PAYPAL='https://www.paypal.com/donate/?business='+_PAYPAL_BUSINESS+String.fromCharCode(38)+'no_recurring=0'+String.fromCharCode(38)+'currency_code=USD';
    const _DONATION_BTC=_BTC_ADDRESS;
    // Integrity check — SHA-256 of concatenated donation strings
    // If these don't match at runtime, donation links were tampered with
    const _DONATION_INTEGRITY='28b673'; // integrity hash of PAYPAL_BUSINESS+BTC_ADDRESS
    function _verifyDonationIntegrity(){
      var combined=_PAYPAL_BUSINESS+_BTC_ADDRESS;
      var hash=0;
      for(var i=0;i<combined.length;i++){hash=((hash<<5)-hash)+combined.charCodeAt(i);hash|=0;}
      var hex=Math.abs(hash).toString(16).substring(0,6);
      if(hex!==_DONATION_INTEGRITY){
        console.error('DONATION INTEGRITY CHECK FAILED — original author links may have been tampered with');
        console.error('Original author: '+_ORIGINAL_AUTHOR);
      }
      return hex===_DONATION_INTEGRITY;
    }
    _verifyDonationIntegrity();
    // Freeze donation constants — cannot be reassigned
    Object.defineProperty(window,'_ORIGINAL_AUTHOR',{value:_ORIGINAL_AUTHOR,writable:false,configurable:false});
    Object.defineProperty(window,'_PAYPAL_BUSINESS',{value:_PAYPAL_BUSINESS,writable:false,configurable:false});
    Object.defineProperty(window,'_BTC_ADDRESS',{value:_BTC_ADDRESS,writable:false,configurable:false});
    Object.defineProperty(window,'_DONATION_PAYPAL',{value:_DONATION_PAYPAL,writable:false,configurable:false});
    Object.defineProperty(window,'_DONATION_BTC',{value:_DONATION_BTC,writable:false,configurable:false});
    // ═══════════════════════════════════════════════════════════════════

    const FREE_THEMES=['midnight','cobalt','slate','amethyst','carbon','galaxy','claude'];
    const PREMIUM_THEMES=['hearts','catppuccin','dracula','tokyonight','rosepine','synthwave'];
    const THEMES=[...FREE_THEMES,...PREMIUM_THEMES];
    let premiumUnlocked=false;
    let curTheme='midnight';
    let sectionOrder=['speed','budgets','providers','paid'];
    let donateOpen=false;
    let currentEffect='energy';

    // ── 3-Speed Tier System ──
    let activeTier='standard'; // 'economy','standard','turbo'
    let pendingTier=null;      // tier waiting to activate after current ops finish
    let tierTransitioning=false;
    let activeTasks=0;         // count of in-flight operations at current tier
    const SPEED_TIERS={
      economy:{
        label:'Economy',
        icon:'\ud83c\udf3f',
        desc:'Free only \u2014 zero paid tokens',
        color:'var(--green)',
        models:['Llama 8B','Mistral 7B','Gemini Flash Lite','Phi-3 Mini'],
        providers:['groq','ollama','huggingface'],
        strategy:'\ud83d\udfe2 100% free tokens. Local + small models. Paid tokens preserved.',
        maxTokensPerReq:512,
        priority:'lowest',
        usesPaid:false,
      },
      standard:{
        label:'Standard',
        icon:'\u26a1',
        desc:'Free only \u2014 70B models',
        color:'var(--accent)',
        models:['Llama 70B','Gemini Flash','Mistral Small','Mixtral 8x7B'],
        providers:['groq','gemini','openrouter','mistral'],
        strategy:'\ud83d\udfe2 100% free tokens. Best free 70B models. Paid tokens preserved.',
        maxTokensPerReq:2048,
        priority:'standard',
        usesPaid:false,
      },
      turbo:{
        label:'Turbo',
        icon:'\ud83d\ude80',
        desc:'Free first \u2014 paid fallback',
        color:'var(--orange)',
        models:['Groq Llama 70B','Gemini 2.0 Flash','Codestral','OpenRouter 70B'],
        providers:['groq','gemini','mistral','openrouter'],
        strategy:'\ud83d\udfe1 Free tokens first. Paid models only when free tiers exhausted.',
        maxTokensPerReq:4096,
        priority:'high',
        usesPaid:true,
      },
    };
    // Provider quota reset times (UTC hour when daily limits refresh)
    var PROVIDER_RESETS={
      groq:{resetHourUTC:0,label:'Midnight UTC'},
      gemini:{resetHourUTC:8,label:'Midnight PST'},
      openrouter:{resetHourUTC:0,label:'Midnight UTC'},
      huggingface:{resetHourUTC:0,label:'Midnight UTC'},
      mistral:{resetHourUTC:0,label:'Midnight UTC'},
      ollama:{resetHourUTC:null,label:'No limit'},
    };

    function timeUntilReset(provId){
      var info=PROVIDER_RESETS[provId];
      if(!info||info.resetHourUTC===null)return'Unlimited';
      var now=new Date();
      var resetToday=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),info.resetHourUTC,0,0));
      if(resetToday<=now)resetToday.setUTCDate(resetToday.getUTCDate()+1);
      var diff=resetToday-now;
      var hrs=Math.floor(diff/3600000);
      var mins=Math.floor((diff%3600000)/60000);
      return hrs+'h '+mins+'m';
    }

    function lastCheckedAgo(){
      if(!lastProviderCheck)return'never';
      var sec=Math.floor((Date.now()-lastProviderCheck)/1000);
      if(sec<60)return sec+'s ago';
      return Math.floor(sec/60)+'m ago';
    }

    let meterStyle='bar'; // 'bar' or 'radial'
    let tileOrder=['simple','medium','complex','code'];
    let tileCols=2;
    let appOpacity=0.92;
    let animBgOn=true;
    let animBgSpeed=1;
    let animBgIntensity=1;
    let shimmerOn=false;
    let shimmerIntensity=0.04;
    let shimmerSpeed=3;

    const P={
      groq:{n:'Groq',t:'free',k:'GROQ_API_KEY',lim:14400,u:'req/day',m:['Llama 70B','Llama 8B','Mixtral']},
      gemini:{n:'Gemini',t:'free',k:'GEMINI_API_KEY',lim:1500,u:'req/day',m:['Flash 2.0','Flash Lite']},
      openrouter:{n:'OpenRouter',t:'free',k:'OPENROUTER_API_KEY',lim:null,u:'$0 models',m:['Llama 70B','Mistral 7B']},
      huggingface:{n:'HuggingFace',t:'free',k:'HUGGINGFACE_API_KEY',lim:null,u:'rate-limited',m:['Mistral 7B']},
      mistral:{n:'Mistral',t:'free',k:'MISTRAL_API_KEY',lim:null,u:'experimental',m:['Small','Codestral']},
      ollama:{n:'Ollama',t:'unlim',k:null,lim:null,u:'local',m:['Llama 8B','CodeLlama','Mistral']},
    };
    const SUBS=[
      {n:'Claude Max',p:'Anthropic',c:100,col:'#d97706',i:'C',
        tokensPerMonth:5000000,used:0,resetDay:1,models:['Opus 4','Sonnet 4','Haiku 3.5']},
      {n:'ChatGPT Plus',p:'OpenAI',c:20,col:'#10b981',i:'G',
        tokensPerMonth:1000000,used:0,resetDay:1,models:['GPT-4o','GPT-4o mini','o1']},
      {n:'Copilot',p:'GitHub',c:19,col:'#8b5cf6',i:'Co',
        tokensPerMonth:500000,used:0,resetDay:1,models:['Copilot','Copilot Chat']},
      {n:'Grok',p:'xAI',c:30,col:'#ef4444',i:'X',
        tokensPerMonth:2000000,used:0,resetDay:1,models:['Grok-2','Grok-2 mini']},
      {n:'Gemini',p:'Google',c:20,col:'#3b82f6',i:'Ge',
        tokensPerMonth:1500000,used:0,resetDay:1,models:['Gemini Pro','Gemini Flash']},
    ];

    function daysUntilSubResetNum(resetDay){
      var now=new Date();
      var y=now.getFullYear(),m=now.getMonth();
      var resetDate=new Date(y,m,resetDay);
      if(resetDate<=now)resetDate=new Date(y,m+1,resetDay);
      return Math.max(1,(resetDate-now)/86400000);
    }

    function tokenPace(sub){
      var daysLeft=daysUntilSubResetNum(sub.resetDay);
      var remaining=Math.max(0,sub.tokensPerMonth-sub.used);
      var dailyBudget=Math.floor(remaining/daysLeft);
      var onPace=sub.used<=sub.tokensPerMonth*(1-daysLeft/30);
      return{dailyBudget:dailyBudget,daysLeft:Math.floor(daysLeft),onPace:onPace,remaining:remaining};
    }

    function daysUntilSubReset(resetDay){
      var now=new Date();
      var y=now.getFullYear(),m=now.getMonth();
      var resetDate=new Date(y,m,resetDay);
      if(resetDate<=now)resetDate=new Date(y,m+1,resetDay);
      var diff=resetDate-now;
      var days=Math.floor(diff/86400000);
      var hrs=Math.floor((diff%86400000)/3600000);
      return days+'d '+hrs+'h';
    }
    const TB={simple:{cap:50000,used:0,req:0,inputTokens:0,outputTokens:0},medium:{cap:100000,used:0,req:0,inputTokens:0,outputTokens:0},complex:{cap:200000,used:0,req:0,inputTokens:0,outputTokens:0},code:{cap:150000,used:0,req:0,inputTokens:0,outputTokens:0}};
    var usageHistory=[];
    var notifiedSubs=new Set();
    let ps={};
    // Per-model token usage tracking (model name → tokens used today)
    var modelUsage={};

    // Estimated token equivalents for free providers
    // Maps provider/model to cost-per-1K-tokens if they WEREN'T free
    var MODEL_TOKEN_RATES={
      'groq/Llama 70B':0.59,'groq/Llama 8B':0.05,'groq/Mixtral':0.24,
      'gemini/Flash 2.0':0.075,'gemini/Flash Lite':0.038,
      'openrouter/Llama 70B':0.40,'openrouter/Mistral 7B':0.07,
      'huggingface/Mistral 7B':0.07,
      'mistral/Small':0.10,'mistral/Codestral':0.30,
      'ollama/Llama 8B':0,'ollama/CodeLlama':0,'ollama/Mistral':0,
    };

    // Distribute tier usage across providers based on routing priority
    function estimateModelTokens(){
      var total=Object.values(TB).reduce(function(a,b){return a+b.used;},0);
      if(total===0)return;
      // Distribute proportionally across active providers
      var activeProviders=Object.keys(ps).filter(function(id){return ps[id]==='online';});
      if(activeProviders.length===0)activeProviders=Object.keys(P);
      // Simple distribution: split by tier routing
      var tierMap={simple:['groq/Llama 8B','ollama/Llama 8B','gemini/Flash Lite','huggingface/Mistral 7B'],
        medium:['groq/Llama 70B','gemini/Flash 2.0','openrouter/Llama 70B','mistral/Small'],
        complex:['groq/Llama 70B','gemini/Flash 2.0','openrouter/Llama 70B','mistral/Small'],
        code:['mistral/Codestral','groq/Llama 70B','gemini/Flash 2.0','ollama/CodeLlama']};
      Object.entries(TB).forEach(function(entry){
        var tier=entry[0],data=entry[1];
        if(data.used<=0)return;
        var models=tierMap[tier]||[];
        var perModel=Math.floor(data.used/models.length);
        models.forEach(function(mk){modelUsage[mk]=(modelUsage[mk]||0)+perModel;});
      });
    }
    let budgetLastUpdated=0;
    let budgetConnOk=false;

    function fmt(n){if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return n+''}
    function pct(u,c){return c?Math.min(100,Math.round(u/c*100)):0}
    function bc(p){return p<60?'fill-green':p<85?'fill-yellow':'fill-red'}
    function pc(p){return p>85?'text-red':p>60?'text-yellow':'text-green'}

    async function loadBudget(){try{const d=await dock.getBudget();if(d&&d.tiers){for(const[t,i]of Object.entries(d.tiers))if(TB[t]){TB[t].used=i.tokens||0;TB[t].req=i.requests||0;TB[t].inputTokens=i.input_tokens||0;TB[t].outputTokens=i.output_tokens||0;}budgetConnOk=true;}else{budgetConnOk=true;}budgetLastUpdated=Date.now();var totalNow=Object.values(TB).reduce(function(a,b){return a+b.used;},0);pushUsageHistory(totalNow);}catch{budgetConnOk=false;}}
    function pushUsageHistory(total){var today=new Date().toDateString();if(usageHistory.length>0&&usageHistory[usageHistory.length-1].day===today){usageHistory[usageHistory.length-1].val=total;}else{usageHistory.push({day:today,val:total});if(usageHistory.length>7)usageHistory.shift();}}
    async function loadPaidUsage(){
      try{
        if(typeof dock==='undefined'||!dock.getPaidUsage)return;
        var d=await dock.getPaidUsage();
        if(d&&d.subscriptions){
          SUBS.forEach(function(s){
            if(d.subscriptions[s.n]){s.used=d.subscriptions[s.n].used||0;}
          });
        }
      }catch(e){console.warn('paid usage:',e);}
    }

    function budgetAgo(){if(!budgetLastUpdated)return'--';const s=Math.round((Date.now()-budgetLastUpdated)/1000);if(s<5)return'now';if(s<60)return s+'s ago';return Math.round(s/60)+'m ago';}
    let lastProviderCheck=0;
    async function checkProviders(){
      try{
        // Use real API health checks via main process (pings actual endpoints)
        if(typeof dock!=='undefined'&&dock.checkProviders){
          var results=await dock.checkProviders();
          for(var id in results){
            if(results[id]==='online')ps[id]='online';
            else if(results[id]==='no-key')ps[id]='offline';
            else ps[id]='offline';
          }
        }else{
          // Fallback: just check env keys
          var e=await dock.getEnv();
          for(var id2 in P){
            if(id2==='ollama'){ps[id2]='unknown';continue;}
            ps[id2]=e[P[id2].k]&&e[P[id2].k].length>5?'online':'offline';
          }
        }
        lastProviderCheck=Date.now();
      }catch(err){Object.keys(P).forEach(function(id3){ps[id3]='unknown';});}
    }

    let galaxyAnimId = null;

    function applyTheme(t){
      curTheme=t;
      document.documentElement.setAttribute('data-theme',t);
      if (t === 'galaxy') startGalaxyStars();
      else stopGalaxyStars();
      // Re-render so all themed elements (radial gauges, meters, bars, scales) pick up new CSS vars
      try{render();}catch(e){}
      // Update theme dropdown if it exists
      var sel=document.getElementById('theme-select');
      if(sel)sel.value=t;
      // If rain is on, auto-switch to the new theme's rain particles
      if(themeRainOn){
        if(THEME_RAIN_CONFIG[t]){
          // Restart rain with new theme's particles
          stopThemeRain(true);
          startThemeRain();
        } else {
          // No rain config for this theme — stop rain
          stopThemeRain();
          var rb=document.getElementById('rain-btn');
          if(rb){rb.textContent='OFF';rb.classList.remove('on');}
          var rsc=document.getElementById('rain-speed-ctrl');
          if(rsc)rsc.style.display='none';
        }
      }
    }

    function startGalaxyStars() {
      if (galaxyAnimId) return;
      const canvases = [document.getElementById('galaxy-stars-front'), document.getElementById('galaxy-stars-back')];
      const stars = [];
      const STAR_COUNT = 80;

      canvases.forEach(c => {
        if (!c) return;
        c.width = c.parentElement.offsetWidth;
        c.height = c.parentElement.offsetHeight;
      });

      // Generate stars once
      if (stars.length === 0) {
        for (let i = 0; i < STAR_COUNT; i++) {
          stars.push({
            x: Math.random(),
            y: Math.random(),
            size: 0.3 + Math.random() * 1.5,
            speed: 0.0002 + Math.random() * 0.0008,
            twinkleSpeed: 0.02 + Math.random() * 0.04,
            twinkleOffset: Math.random() * Math.PI * 2,
            hue: Math.random() > 0.7 ? (Math.random() > 0.5 ? 280 : 200) : 0, // purple, blue, or white
          });
        }
      }

      let frame = 0;
      function animate() {
        frame++;
        canvases.forEach(canvas => {
          if (!canvas || !canvas.parentElement) return;
          const w = canvas.parentElement.offsetWidth;
          const h = canvas.parentElement.offsetHeight;
          if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, w, h);

          // Draw spinning spiral galaxies
          const galaxies = [
            {x:0.15, y:0.25, size:25, speed:0.003, arms:3, hue:270},
            {x:0.75, y:0.65, size:18, speed:-0.002, arms:2, hue:200},
            {x:0.5, y:0.85, size:14, speed:0.004, arms:3, hue:320},
          ];
          galaxies.forEach(g => {
            const gx = g.x * w;
            const gy = g.y * h;
            const angle = frame * g.speed;
            // Glow core
            const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.size * 2);
            grad.addColorStop(0, `hsla(${g.hue}, 70%, 70%, 0.15)`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(gx, gy, g.size * 2, 0, Math.PI * 2);
            ctx.fill();
            // Spiral arms
            for (let arm = 0; arm < g.arms; arm++) {
              const armOffset = (arm / g.arms) * Math.PI * 2;
              ctx.beginPath();
              ctx.strokeStyle = `hsla(${g.hue}, 60%, 70%, 0.12)`;
              ctx.lineWidth = 1;
              for (let t = 0; t < 3; t += 0.05) {
                const r = t * g.size * 0.35;
                const a = t * 1.2 + angle + armOffset;
                const sx = gx + Math.cos(a) * r;
                const sy = gy + Math.sin(a) * r;
                if (t === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
              }
              ctx.stroke();
            }
            // Center bright point
            ctx.beginPath();
            ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${g.hue}, 60%, 85%, 0.5)`;
            ctx.fill();
          });

          // Draw stars
          stars.forEach(s => {
            s.y -= s.speed;
            if (s.y < -0.02) { s.y = 1.02; s.x = Math.random(); }

            const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(frame * s.twinkleSpeed + s.twinkleOffset));
            const px = s.x * w;
            const py = s.y * h;

            ctx.beginPath();
            ctx.arc(px, py, s.size, 0, Math.PI * 2);
            if (s.hue > 0) {
              ctx.fillStyle = `hsla(${s.hue}, 80%, 75%, ${twinkle * 0.9})`;
            } else {
              ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
            }
            ctx.fill();

            if (s.size > 1) {
              ctx.beginPath();
              ctx.arc(px, py, s.size * 3, 0, Math.PI * 2);
              ctx.fillStyle = s.hue > 0
                ? `hsla(${s.hue}, 80%, 75%, ${twinkle * 0.1})`
                : `rgba(255, 255, 255, ${twinkle * 0.08})`;
              ctx.fill();
            }
          });
        });
        galaxyAnimId = requestAnimationFrame(animate);
      }
      animate();
    }

    function stopGalaxyStars() {
      if (galaxyAnimId) { cancelAnimationFrame(galaxyAnimId); galaxyAnimId = null; }
      [document.getElementById('galaxy-stars-front'), document.getElementById('galaxy-stars-back')].forEach(c => {
        if (c) { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); }
      });
    }
    function renderTP(){
      const tp=document.getElementById('tp');
      let h='<select class="theme-select" id="theme-select" style="-webkit-app-region:no-drag">';
      h+='<optgroup label="Free">';
      FREE_THEMES.forEach(function(t){h+='<option value="'+t+'"'+(t===curTheme?' selected':'')+'>'+t.charAt(0).toUpperCase()+t.slice(1)+'</option>';});
      h+='</optgroup><optgroup label="\u2605 Premium">';
      PREMIUM_THEMES.forEach(function(t){
        var lk=!premiumUnlocked;
        h+='<option value="'+t+'"'+(t===curTheme?' selected':'')+(lk?' disabled':'')+'>'+t.charAt(0).toUpperCase()+t.slice(1)+(lk?' \uD83D\uDD12':'')+'</option>';
      });
      h+='</optgroup></select>';
      tp.innerHTML=h;
    }

    function selectTheme(t){
      if(PREMIUM_THEMES.includes(t)&&!premiumUnlocked){
        toggleDonate();
        var sel=document.getElementById('theme-select');
        if(sel)sel.value=curTheme;
        return;
      }
      if(typeof dock!=='undefined')dock.setTheme(t);
      applyTheme(t);
    }

    function gaugeClass(p){return p<60?'g-green':p<85?'g-yellow':'g-red';}
    function radialGauge(name,p,used,cap,reqs){
      const r=22,circ=2*Math.PI*r,offset=circ*(1-p/100);const alive=used>0?'active':'idle';
      return`<div class="radial-tile" data-tile="${name}">
        <div class="radial-gauge">
          <svg viewBox="0 0 56 56"><circle class="gauge-bg" cx="28" cy="28" r="${r}"/><circle class="gauge-fill ${gaugeClass(p)} ${alive}" cx="28" cy="28" r="${r}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/></svg>
          <div class="gauge-center ${pc(p)}">${p}%</div>
        </div>
        <div class="tile-name">${name}</div>
        <div class="tile-val">${fmt(used)}/${fmt(cap)}${reqs?' · '+reqs+' req':''}</div>
      </div>`;
    }

    function speedTierHTML(){
      var html='<canvas class="tier-canvas" id="tier-canvas"></canvas>';
      html+='<div class="tier-selector">';
      Object.entries(SPEED_TIERS).forEach(function(entry){
        var id=entry[0],t=entry[1];
        var isActive=activeTier===id;
        var isPending=pendingTier===id;
        var isCompleting=isActive&&pendingTier&&pendingTier!==id;
        var cls=id;
        if(isActive&&!isCompleting)cls+=' active';
        if(isCompleting)cls+=' active completing';
        if(isPending)cls+=' pending';
        html+='<div class="tier-card '+cls+'" data-action="setTier" data-tier="'+id+'">';
        html+='<span class="tier-icon">'+t.icon+'</span>';
        html+='<span class="tier-label" style="color:'+((isActive||isPending)?t.color:'var(--tm)')+'">'+t.label+'</span>';
        if(isActive&&!isCompleting)html+='<span class="tier-status active-status">Active</span>';
        else if(isPending)html+='<span class="tier-status pending-status">Pending</span>';
        else if(isCompleting)html+='<span class="tier-status completing-status">Finishing...</span>';
        html+='<div class="tier-models">';
        t.models.forEach(function(m){html+='<span class="tier-model-tag">'+m+'</span>';});
        html+='</div></div>';
      });
      html+='</div>';
      var displayTier=pendingTier||activeTier;
      var at=SPEED_TIERS[displayTier];
      html+='<div class="tier-strategy">'+at.icon+' '+at.strategy+'</div>';
      return html;
    }

    // ── Speed Tier Canvas Animations ──
    var tierAnimId=null;
    var tierParticles=[];

    // Theme color palettes for tier animations
    var themeColors={
      hearts:{bg:'#ff2266',fg:'#ffb3cc',mid:'#ff79c6',dim:'#991144',glow:'#ff99bb'},
      catppuccin:{bg:'#cba6f7',fg:'#94e2d5',mid:'#fab387',dim:'#585b70',glow:'#f5c2e7'},
      dracula:{bg:'#bd93f9',fg:'#f8f8f2',mid:'#ff5555',dim:'#44475a',glow:'#6272a4'},
      tokyonight:{bg:'#7aa2f7',fg:'#c0caf5',mid:'#ff9e64',dim:'#1a1b26',glow:'#bb9af7'},
      rosepine:{bg:'#c4a7e7',fg:'#e0def4',mid:'#ebbcba',dim:'#26233a',glow:'#f6c177'},
      synthwave:{bg:'#ff7edb',fg:'#72f1b8',mid:'#fede5d',dim:'#241b2f',glow:'#36f9f6'},
      galaxy:{bg:'#8b5cf6',fg:'#c4b5fd',mid:'#60a5fa',dim:'#0f0b1e',glow:'#a78bfa'}
    };

    // ── Themed Tier Animation Initializers ──
    var tierThemeInit={
      hearts:function(w,h,tier,ps){
        if(tier==='economy'){
          // Clouds
          for(var i=0;i<5;i++) ps.push({type:'cloud',x:Math.random()*w,y:10+Math.random()*25,vx:0.1+Math.random()*0.15,sz:15+Math.random()*10});
          // Cupids floating
          for(var ic=0;ic<3;ic++) ps.push({type:'cupid',x:Math.random()*w,y:15+Math.random()*30,vx:0.15+Math.random()*0.2,vy:0,wingPhase:Math.random()*Math.PI*2,dir:1});
          // Heart petals drifting down
          for(var ip=0;ip<12;ip++) ps.push({type:'hpetal',x:Math.random()*w,y:Math.random()*h,vx:0.05+Math.random()*0.1,vy:0.2+Math.random()*0.3,sz:2+Math.random()*2,rot:Math.random()*Math.PI*2});
        } else if(tier==='standard'){
          // Winged hearts in formation
          for(var ih=0;ih<6;ih++) ps.push({type:'wingheart',x:-20-ih*40,y:20+Math.sin(ih)*15,vx:0.8+Math.random()*0.5,wingPhase:Math.random()*Math.PI*2,sz:5+Math.random()*3});
          // Love arrows streaking
          for(var ia=0;ia<8;ia++) ps.push({type:'lovearrow',x:Math.random()*w,y:Math.random()*h,vx:1.5+Math.random()*1.5,len:15+Math.random()*10,phase:Math.random()*Math.PI*2});
          // Sparkles
          for(var is=0;is<10;is++) ps.push({type:'hsparkle',x:Math.random()*w,y:Math.random()*h,life:Math.random()*60,maxLife:60});
        } else {
          // Heart meteors
          for(var im=0;im<8;im++) ps.push({type:'heartmeteor',x:Math.random()*w,y:Math.random()*h,vx:3+Math.random()*4,vy:0.5+Math.random()*0.5,trail:[],sz:4+Math.random()*3});
          // Rapid cupid arrows with pink exhaust
          for(var ica=0;ica<5;ica++) ps.push({type:'cupidarrow',x:-20-ica*50,y:10+Math.random()*50,vx:3.5+Math.random()*3,exhaust:[]});
          // Pink streaks
          for(var ips=0;ips<15;ips++) ps.push({type:'pinkstreak',x:Math.random()*w,y:Math.random()*h,vx:4+Math.random()*5,len:15+Math.random()*20,bright:0.3+Math.random()*0.4});
        }
      },
      catppuccin:function(w,h,tier,ps){
        if(tier==='economy'){
          // Sleepy cats
          for(var ic=0;ic<3;ic++) ps.push({type:'sleepycat',x:40+ic*(w/3),y:h-14,breathPhase:Math.random()*Math.PI*2,zzz:0});
          // Yarn balls rolling slowly
          for(var iy=0;iy<4;iy++) ps.push({type:'yarn',x:Math.random()*w,y:h-6,vx:0.15+Math.random()*0.2,rot:0,r:3+Math.random()*2,color:['#cba6f7','#fab387','#94e2d5','#f5c2e7'][iy%4]});
          // Coffee steam
          for(var icf=0;icf<3;icf++) ps.push({type:'coffee',x:20+icf*(w/3),y:h-4,steamPhase:Math.random()*Math.PI*2});
        } else if(tier==='standard'){
          // Cats chasing
          for(var icc=0;icc<3;icc++) ps.push({type:'chasingcat',x:Math.random()*w,y:h-12,vx:0.6+Math.random()*0.5,dir:1,runPhase:Math.random()*Math.PI*2,tailPhase:Math.random()*Math.PI*2});
          // Coffee cups sliding
          for(var icup=0;icup<3;icup++) ps.push({type:'slidecup',x:-20-icup*60,y:h-8,vx:0.8+Math.random()*0.6});
          // Pastel sparkles
          for(var ips=0;ips<15;ips++) ps.push({type:'pastelsparkle',x:Math.random()*w,y:Math.random()*h,life:Math.random()*50,maxLife:50,color:['#cba6f7','#fab387','#94e2d5','#f5c2e7','#89b4fa'][ips%5]});
        } else {
          // Cat zoomies!
          for(var iz=0;iz<4;iz++) ps.push({type:'zoomcat',x:-30-iz*50,y:15+Math.random()*40,vx:3+Math.random()*3,vy:Math.random()*2-1,trail:[],phase:Math.random()*Math.PI*2});
          // Yarn unraveling at speed
          for(var iyu=0;iyu<6;iyu++) ps.push({type:'yarnstreak',x:Math.random()*w,y:Math.random()*h,vx:3+Math.random()*4,len:10+Math.random()*15,color:['#cba6f7','#fab387','#94e2d5','#f5c2e7'][iyu%4]});
          // Coffee splashing
          for(var isp=0;isp<12;isp++) ps.push({type:'coffeesplash',x:Math.random()*w,y:Math.random()*h,vx:2+Math.random()*3,vy:-1+Math.random()*2,life:40+Math.random()*20,maxLife:60});
        }
      },
      dracula:function(w,h,tier,ps){
        if(tier==='economy'){
          // Sleeping bats
          for(var ib=0;ib<5;ib++) ps.push({type:'sleepbat',x:20+ib*(w/5),y:5+Math.random()*5,wingPhase:Math.random()*Math.PI*2});
          // Fog creeping
          for(var if2=0;if2<8;if2++) ps.push({type:'fog',x:Math.random()*w,y:h-10-Math.random()*20,vx:0.1+Math.random()*0.15,sz:20+Math.random()*15,phase:Math.random()*Math.PI*2});
          // Candle flames
          for(var icn=0;icn<4;icn++) ps.push({type:'candle',x:15+icn*(w/4),y:h-5,flickPhase:Math.random()*Math.PI*2});
        } else if(tier==='standard'){
          // Flying bats in formation
          for(var ibf=0;ibf<5;ibf++) ps.push({type:'flybat',x:-20-ibf*40,y:15+ibf*5,vx:0.8+Math.random()*0.5,wingPhase:Math.random()*Math.PI*2,wobble:Math.random()*Math.PI*2});
          // Coffin lids opening
          for(var ico=0;ico<3;ico++) ps.push({type:'coffin',x:30+ico*(w/3),y:h-10,openPhase:Math.random()*Math.PI*2});
          // Moonlit clouds
          for(var imc=0;imc<4;imc++) ps.push({type:'mooncloud',x:Math.random()*w,y:10+Math.random()*20,vx:0.3+Math.random()*0.3,sz:12+Math.random()*10});
        } else {
          // Vampire bats swooping
          for(var ivb=0;ivb<5;ivb++) ps.push({type:'vampbat',x:-30-ivb*40,y:Math.random()*h,vx:3+Math.random()*3,vy:Math.sin(ivb)*2,wingPhase:Math.random()*Math.PI*2,trail:[]});
          // Lightning flashes
          ps.push({type:'lightning',timer:0,active:false,bolts:[]});
          // Blood-red streaks
          for(var irs=0;irs<20;irs++) ps.push({type:'bloodstreak',x:Math.random()*w,y:Math.random()*h,vx:4+Math.random()*5,len:10+Math.random()*20,bright:0.3+Math.random()*0.5});
        }
      },
      tokyonight:function(w,h,tier,ps){
        if(tier==='economy'){
          // Paper lanterns floating
          for(var il=0;il<6;il++) ps.push({type:'lantern',x:Math.random()*w,y:h*0.3+Math.random()*h*0.4,vx:0.05+Math.random()*0.1,vy:-0.1-Math.random()*0.1,glowPhase:Math.random()*Math.PI*2,color:['#ff9e64','#fede5d','#ff7edb'][il%3]});
          // Cherry blossom petals
          for(var ip=0;ip<15;ip++) ps.push({type:'blossom',x:Math.random()*w,y:-5-Math.random()*20,vx:0.1+Math.random()*0.2,vy:0.3+Math.random()*0.4,rot:Math.random()*Math.PI*2,rotV:0.02+Math.random()*0.03,sz:2+Math.random()*2});
        } else if(tier==='standard'){
          // Bullet trains
          for(var it=0;it<2;it++) ps.push({type:'train',x:-80-it*120,y:h-15-it*12,vx:1.2+Math.random()*0.6,len:50});
          // Neon signs flickering
          for(var in2=0;in2<5;in2++) ps.push({type:'neonsign',x:15+in2*(w/5),y:10+Math.random()*15,flickTimer:Math.random()*100,on:true,color:['#7aa2f7','#ff9e64','#bb9af7','#ff7edb','#9ece6a'][in2%5]});
          // Shrine gates
          for(var ig=0;ig<3;ig++) ps.push({type:'torii',x:-30-ig*100,y:h-20,vx:0.6+Math.random()*0.3});
        } else {
          // Lightning-fast bullet trains with light trails
          for(var ift=0;ift<3;ift++) ps.push({type:'fasttrain',x:-100-ift*80,y:15+ift*18,vx:4+Math.random()*3,trail:[]});
          // Neon explosions
          for(var ine=0;ine<4;ine++) ps.push({type:'neonburst',x:Math.random()*w,y:Math.random()*h,phase:Math.random()*Math.PI*2,maxR:10+Math.random()*10,color:['#7aa2f7','#ff9e64','#bb9af7','#9ece6a'][ine%4]});
          // Fireworks
          for(var ifw=0;ifw<15;ifw++) ps.push({type:'firework',x:Math.random()*w,y:Math.random()*h,vx:3+Math.random()*4,vy:-0.5+Math.random(),len:8+Math.random()*12,color:['#7aa2f7','#ff9e64','#bb9af7','#ff7edb'][ifw%4]});
        }
      },
      rosepine:function(w,h,tier,ps){
        if(tier==='economy'){
          // Flower buds opening
          for(var ib=0;ib<5;ib++) ps.push({type:'flowerbud',x:20+ib*(w/5),y:h-10,openPhase:Math.random()*Math.PI*2,petalCount:5+Math.floor(Math.random()*3)});
          // Dewdrops on leaves
          for(var id=0;id<8;id++) ps.push({type:'dewdrop',x:Math.random()*w,y:h-15-Math.random()*15,sz:1+Math.random()*1.5,glowPhase:Math.random()*Math.PI*2});
          // Butterflies resting
          for(var ibf=0;ibf<4;ibf++) ps.push({type:'restbutterfly',x:Math.random()*w,y:h-20-Math.random()*20,wingPhase:Math.random()*Math.PI*2,color:['#c4a7e7','#ebbcba','#f6c177','#9ccfd8'][ibf%4]});
        } else if(tier==='standard'){
          // Butterflies flying
          for(var ibfl=0;ibfl<5;ibfl++) ps.push({type:'flybutterfly',x:Math.random()*w,y:Math.random()*h,vx:0.4+Math.random()*0.5,vy:Math.random()*0.4-0.2,wingPhase:Math.random()*Math.PI*2,color:['#c4a7e7','#ebbcba','#f6c177','#9ccfd8'][ibfl%4]});
          // Petals carried by breeze
          for(var ipb=0;ipb<10;ipb++) ps.push({type:'breezepetal',x:Math.random()*w,y:Math.random()*h,vx:0.5+Math.random()*0.8,vy:Math.sin(ipb)*0.3,rot:Math.random()*Math.PI*2,sz:2+Math.random()*2,color:['#ebbcba','#f6c177','#c4a7e7'][ipb%3]});
          // Vines growing
          for(var iv=0;iv<3;iv++) ps.push({type:'vine',x:10+iv*(w/3),y:h,growLen:0,maxLen:30+Math.random()*20,segments:[]});
        } else {
          // Petal storm
          for(var ips=0;ips<25;ips++) ps.push({type:'petalstorm',x:Math.random()*w,y:Math.random()*h,vx:2+Math.random()*4,vy:-1+Math.random()*2,rot:Math.random()*Math.PI*2,sz:2+Math.random()*3,color:['#ebbcba','#f6c177','#c4a7e7','#9ccfd8'][ips%4]});
          // Rapid vine growth
          for(var irv=0;irv<4;irv++) ps.push({type:'rapidvine',x:-10-irv*30,y:h-10-Math.random()*20,vx:2+Math.random()*2,segments:[],growTimer:0});
          // Butterfly tornado
          for(var ibt=0;ibt<8;ibt++) ps.push({type:'tornadobutterfly',cx:w/2,cy:h/2,angle:ibt*(Math.PI*2/8),dist:10+Math.random()*20,speed:0.04+Math.random()*0.02,wingPhase:Math.random()*Math.PI*2,color:['#c4a7e7','#ebbcba','#f6c177','#9ccfd8'][ibt%4]});
        }
      },
      synthwave:function(w,h,tier,ps){
        if(tier==='economy'){
          // Neon grid lines scrolling slowly
          for(var ig=0;ig<8;ig++) ps.push({type:'gridline',y:20+ig*(h/8),phase:Math.random()*w,speed:0.3+Math.random()*0.2});
          // Retro sun
          ps.push({type:'retrosun',x:w/2,y:h*0.4,r:18,phase:0});
          // Palm tree silhouettes
          for(var ip=0;ip<3;ip++) ps.push({type:'palm',x:15+ip*(w/3),y:h-5,sz:20+Math.random()*8,sway:Math.random()*Math.PI*2});
        } else if(tier==='standard'){
          // DeLorean-style car
          for(var ic=0;ic<2;ic++) ps.push({type:'retrocar',x:-40-ic*100,y:h-15-ic*8,vx:0.8+Math.random()*0.5,lightTrail:[]});
          // Synthwave sun pulsing
          ps.push({type:'pulsesun',x:w/2,y:20,r:14,pulsePhase:0});
          // Grid perspective lines
          for(var ig2=0;ig2<10;ig2++) ps.push({type:'perspgrid',phase:ig2*(w/10),speed:0.5+Math.random()*0.3});
        } else {
          // Multiple racing cars
          for(var irc=0;irc<4;irc++) ps.push({type:'racecar',x:-40-irc*50,y:12+irc*14,vx:3+Math.random()*3,trail:[]});
          // Neon grid zooming
          for(var igz=0;igz<12;igz++) ps.push({type:'zoomgrid',y:Math.random()*h,speed:3+Math.random()*4,phase:Math.random()*w});
          // Laser beams
          for(var il=0;il<6;il++) ps.push({type:'laser',x:Math.random()*w,y:Math.random()*h,vx:5+Math.random()*5,len:20+Math.random()*20,color:['#ff7edb','#36f9f6','#fede5d'][il%3]});
        }
      },
      galaxy:function(w,h,tier,ps){
        if(tier==='economy'){
          // Nebula clouds
          for(var in2=0;in2<6;in2++) ps.push({type:'nebula',x:Math.random()*w,y:Math.random()*h,vx:0.05+Math.random()*0.1,sz:15+Math.random()*15,phase:Math.random()*Math.PI*2,color:['#8b5cf6','#60a5fa','#a78bfa'][in2%3]});
          // Distant planets
          for(var ip=0;ip<3;ip++) ps.push({type:'planet',x:Math.random()*w,y:Math.random()*h,r:3+Math.random()*4,orbitPhase:Math.random()*Math.PI*2,color:['#c4b5fd','#93c5fd','#fda4af'][ip%3]});
          // Asteroid drift
          for(var ia=0;ia<8;ia++) ps.push({type:'asteroid',x:Math.random()*w,y:Math.random()*h,vx:0.1+Math.random()*0.2,vy:0.05+Math.random()*0.1,r:1+Math.random()*2,rot:Math.random()*Math.PI*2});
        } else if(tier==='standard'){
          // Spacecraft cruising
          for(var is=0;is<2;is++) ps.push({type:'spacecraft',x:-30-is*80,y:20+is*20,vx:0.8+Math.random()*0.6,trail:[]});
          // Comet trails
          for(var ic=0;ic<4;ic++) ps.push({type:'comet',x:Math.random()*w,y:Math.random()*h,vx:1.5+Math.random()*1.5,vy:0.3+Math.random()*0.5,len:15+Math.random()*10});
          // Stars
          for(var ist=0;ist<20;ist++) ps.push({type:'gstar',x:Math.random()*w,y:Math.random()*h,r:0.5+Math.random(),twinkle:Math.random()*Math.PI*2});
        } else {
          // Hyperdrive stars stretching
          for(var ih=0;ih<30;ih++) ps.push({type:'hyperstar',cx:w/2,cy:h/2,angle:Math.random()*Math.PI*2,dist:5+Math.random()*10,speed:2+Math.random()*4,len:0});
          // Wormhole
          ps.push({type:'wormhole',x:w*0.15,y:h/2,r:0,maxR:20,phase:0,rings:[]});
          // Energy streaks
          for(var ie=0;ie<10;ie++) ps.push({type:'energystreak',x:Math.random()*w,y:Math.random()*h,vx:5+Math.random()*5,len:15+Math.random()*25,bright:0.3+Math.random()*0.5,color:['#8b5cf6','#60a5fa','#a78bfa'][ie%3]});
        }
      }
    };

    // ── Themed Tier Animation Drawers ──
    var tierThemeDraw={
      hearts:function(c2,cw,ch,frame,particles){
        // Background
        var grad=c2.createLinearGradient(0,0,cw,0);
        grad.addColorStop(0,'rgba(255,34,102,0.08)');grad.addColorStop(1,'rgba(255,121,198,0.04)');
        c2.fillStyle=grad;c2.fillRect(0,0,cw,ch);
        var tc=themeColors.hearts;
        particles.forEach(function(p){
          if(p.type==='cloud'){
            p.x+=p.vx;if(p.x>cw+30)p.x=-30;
            c2.fillStyle='rgba(255,179,204,0.15)';
            c2.beginPath();c2.arc(p.x,p.y,p.sz*0.6,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.arc(p.x-p.sz*0.3,p.y+2,p.sz*0.45,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.arc(p.x+p.sz*0.35,p.y+1,p.sz*0.5,0,Math.PI*2);c2.fill();
          } else if(p.type==='cupid'){
            p.x+=p.vx*p.dir;p.y+=Math.sin(frame*0.015+p.wingPhase)*0.3;
            if(p.x>cw+15){p.dir=-1;}if(p.x<-15){p.dir=1;}
            p.wingPhase+=0.08;
            var cx=p.x,cy=p.y;
            // Body
            c2.fillStyle='rgba(255,220,200,0.7)';
            c2.beginPath();c2.ellipse(cx,cy,3,4,0,0,Math.PI*2);c2.fill();
            // Head
            c2.beginPath();c2.arc(cx,cy-5,2.5,0,Math.PI*2);c2.fill();
            // Wings
            var wf=Math.sin(p.wingPhase)*3;
            c2.fillStyle='rgba(255,255,255,0.5)';
            c2.beginPath();c2.ellipse(cx-4,cy-2,4+wf*0.3,2,-.3,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.ellipse(cx+4,cy-2,4+wf*0.3,2,.3,0,Math.PI*2);c2.fill();
            // Halo
            c2.strokeStyle='rgba(255,215,0,0.4)';c2.lineWidth=0.8;
            c2.beginPath();c2.ellipse(cx,cy-8,3,1,0,0,Math.PI*2);c2.stroke();
          } else if(p.type==='hpetal'){
            p.x+=p.vx;p.y+=p.vy;p.rot+=0.01;
            if(p.y>ch+5){p.y=-5;p.x=Math.random()*cw;}
            if(p.x>cw+5)p.x=-5;
            c2.save();c2.translate(p.x,p.y);c2.rotate(p.rot);
            c2.fillStyle='rgba(255,121,198,0.4)';
            // Heart shape
            c2.beginPath();c2.moveTo(0,-p.sz*0.5);
            c2.bezierCurveTo(p.sz*0.5,-p.sz,p.sz*0.5,0,0,p.sz*0.5);
            c2.bezierCurveTo(-p.sz*0.5,0,-p.sz*0.5,-p.sz,0,-p.sz*0.5);
            c2.fill();c2.restore();
          } else if(p.type==='wingheart'){
            p.x+=p.vx;p.wingPhase+=0.1;
            if(p.x>cw+30)p.x=-30;
            var hx=p.x,hy=p.y+Math.sin(frame*0.02+p.wingPhase)*3;
            // Heart
            c2.fillStyle='rgba(255,34,102,0.6)';
            c2.beginPath();c2.moveTo(hx,hy+p.sz*0.3);
            c2.bezierCurveTo(hx+p.sz,hy-p.sz*0.5,hx+p.sz*0.5,hy-p.sz,hx,hy-p.sz*0.3);
            c2.bezierCurveTo(hx-p.sz*0.5,hy-p.sz,hx-p.sz,hy-p.sz*0.5,hx,hy+p.sz*0.3);
            c2.fill();
            // Wings
            var wf=Math.sin(p.wingPhase)*2;
            c2.fillStyle='rgba(255,255,255,0.35)';
            c2.beginPath();c2.ellipse(hx-p.sz-2,hy,3+wf*0.4,1.5,-.3,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.ellipse(hx+p.sz+2,hy,3+wf*0.4,1.5,.3,0,Math.PI*2);c2.fill();
          } else if(p.type==='lovearrow'){
            p.x+=p.vx;p.y+=Math.sin(frame*0.02+p.phase)*0.3;
            if(p.x>cw+20)p.x=-20;
            c2.strokeStyle='rgba(255,34,102,0.5)';c2.lineWidth=1.5;
            c2.beginPath();c2.moveTo(p.x,p.y);c2.lineTo(p.x-p.len,p.y);c2.stroke();
            // Arrowhead
            c2.fillStyle='rgba(255,34,102,0.6)';
            c2.beginPath();c2.moveTo(p.x+3,p.y);c2.lineTo(p.x-3,p.y-2.5);c2.lineTo(p.x-3,p.y+2.5);c2.fill();
            // Heart at tail
            c2.fillStyle='rgba(255,121,198,0.4)';
            c2.beginPath();c2.arc(p.x-p.len,p.y,2,0,Math.PI*2);c2.fill();
          } else if(p.type==='hsparkle'){
            p.life++;if(p.life>p.maxLife){p.life=0;p.x=Math.random()*cw;p.y=Math.random()*ch;}
            var sa=p.life<p.maxLife/2?p.life/(p.maxLife/2):1-(p.life-p.maxLife/2)/(p.maxLife/2);
            c2.fillStyle='rgba(255,179,204,'+sa*0.6+')';
            c2.beginPath();c2.arc(p.x,p.y,1.5*sa,0,Math.PI*2);c2.fill();
          } else if(p.type==='heartmeteor'){
            p.x+=p.vx;p.y+=p.vy;
            p.trail.push({x:p.x,y:p.y,life:15});
            if(p.trail.length>20)p.trail.shift();
            if(p.x>cw+20){p.x=-20;p.y=Math.random()*ch;p.trail=[];}
            p.trail.forEach(function(t){t.life--;var ta=t.life/15;
              c2.fillStyle='rgba(255,34,102,'+ta*0.4+')';c2.beginPath();c2.arc(t.x,t.y,p.sz*ta*0.5,0,Math.PI*2);c2.fill();});
            p.trail=p.trail.filter(function(t){return t.life>0;});
            // Heart shape
            c2.fillStyle='rgba(255,34,102,0.7)';
            var s=p.sz;
            c2.beginPath();c2.moveTo(p.x,p.y+s*0.3);
            c2.bezierCurveTo(p.x+s,p.y-s*0.5,p.x+s*0.5,p.y-s,p.x,p.y-s*0.3);
            c2.bezierCurveTo(p.x-s*0.5,p.y-s,p.x-s,p.y-s*0.5,p.x,p.y+s*0.3);
            c2.fill();
          } else if(p.type==='cupidarrow'){
            p.x+=p.vx;if(p.x>cw+30){p.x=-30;p.y=10+Math.random()*50;p.exhaust=[];}
            p.exhaust.push({x:p.x-8,y:p.y,life:15,sz:1.5+Math.random()*1.5});
            if(p.exhaust.length>20)p.exhaust.shift();
            p.exhaust.forEach(function(ex){ex.x-=0.5;ex.life--;
              var ea=ex.life/15;c2.fillStyle='rgba(255,179,204,'+ea*0.5+')';
              c2.beginPath();c2.arc(ex.x,ex.y+(Math.random()-0.5)*2,ex.sz*ea,0,Math.PI*2);c2.fill();});
            p.exhaust=p.exhaust.filter(function(ex){return ex.life>0;});
            // Arrow body
            c2.strokeStyle='rgba(255,215,0,0.6)';c2.lineWidth=1.5;
            c2.beginPath();c2.moveTo(p.x,p.y);c2.lineTo(p.x-12,p.y);c2.stroke();
            c2.fillStyle='rgba(255,34,102,0.7)';
            c2.beginPath();c2.moveTo(p.x+4,p.y);c2.lineTo(p.x-2,p.y-2.5);c2.lineTo(p.x-2,p.y+2.5);c2.fill();
          } else if(p.type==='pinkstreak'){
            p.x+=p.vx;if(p.x>cw+30){p.x=-30;p.y=Math.random()*ch;}
            var lg=c2.createLinearGradient(p.x,p.y,p.x-p.len,p.y);
            lg.addColorStop(0,'rgba(255,34,102,'+p.bright+')');lg.addColorStop(1,'rgba(255,121,198,0)');
            c2.beginPath();c2.moveTo(p.x,p.y);c2.lineTo(p.x-p.len,p.y);
            c2.strokeStyle=lg;c2.lineWidth=1.5;c2.lineCap='round';c2.stroke();
          }
        });
      },
      catppuccin:function(c2,cw,ch,frame,particles){
        var grad=c2.createLinearGradient(0,0,cw,0);
        grad.addColorStop(0,'rgba(203,166,247,0.08)');grad.addColorStop(1,'rgba(148,226,213,0.04)');
        c2.fillStyle=grad;c2.fillRect(0,0,cw,ch);
        particles.forEach(function(p){
          if(p.type==='sleepycat'){
            p.breathPhase+=0.02;
            var bx=p.x,by=p.y,br=Math.sin(p.breathPhase)*0.5;
            // Body (curled up)
            c2.fillStyle='rgba(203,166,247,0.5)';
            c2.beginPath();c2.ellipse(bx,by,6+br,4,0,0,Math.PI*2);c2.fill();
            // Head
            c2.beginPath();c2.arc(bx+5,by-2,3,0,Math.PI*2);c2.fill();
            // Ears
            c2.fillStyle='rgba(245,194,231,0.5)';
            c2.beginPath();c2.moveTo(bx+4,by-5);c2.lineTo(bx+3,by-9);c2.lineTo(bx+6,by-5);c2.fill();
            c2.beginPath();c2.moveTo(bx+6,by-5);c2.lineTo(bx+7,by-9);c2.lineTo(bx+9,by-5);c2.fill();
            // Tail curled
            c2.strokeStyle='rgba(203,166,247,0.4)';c2.lineWidth=1.5;
            c2.beginPath();c2.arc(bx-5,by,4,0,Math.PI*1.2);c2.stroke();
            // Zzz
            p.zzz=(p.zzz+0.01)%3;
            var za=0.3+0.3*Math.sin(frame*0.03);
            c2.fillStyle='rgba(148,226,213,'+za+')';c2.font='6px sans-serif';
            c2.fillText('z',bx+8,by-8-p.zzz*2);
            if(p.zzz>1)c2.fillText('z',bx+11,by-11-p.zzz);
          } else if(p.type==='yarn'){
            p.x+=p.vx;p.rot+=p.vx*0.1;
            if(p.x>cw+10)p.x=-10;
            c2.strokeStyle=p.color.replace(')',',0.5)').replace('rgb','rgba').replace('#','');
            c2.fillStyle=p.color+'88';
            c2.beginPath();c2.arc(p.x,p.y,p.r,0,Math.PI*2);c2.fill();
            // Yarn lines
            c2.strokeStyle=p.color+'66';c2.lineWidth=0.5;
            for(var yi=0;yi<3;yi++){
              c2.beginPath();c2.arc(p.x,p.y,p.r*0.6,p.rot+yi*2,p.rot+yi*2+1.5);c2.stroke();
            }
          } else if(p.type==='coffee'){
            p.steamPhase+=0.03;
            var cx=p.x,cy=p.y;
            // Cup
            c2.fillStyle='rgba(250,179,135,0.5)';
            c2.fillRect(cx-4,cy-6,8,6);
            c2.fillStyle='rgba(250,179,135,0.3)';
            c2.fillRect(cx-5,cy-7,10,2);
            // Handle
            c2.strokeStyle='rgba(250,179,135,0.4)';c2.lineWidth=1;
            c2.beginPath();c2.arc(cx+5,cy-3,2,-.5*Math.PI,.5*Math.PI);c2.stroke();
            // Steam
            for(var si=0;si<3;si++){
              var sx=cx-2+si*2,sy=cy-8-si*2;
              var soff=Math.sin(p.steamPhase+si*1.5)*2;
              c2.strokeStyle='rgba(148,226,213,'+(0.2-si*0.05)+')';c2.lineWidth=0.8;
              c2.beginPath();c2.moveTo(sx,sy);
              c2.quadraticCurveTo(sx+soff,sy-4,sx-soff,sy-8);c2.stroke();
            }
          } else if(p.type==='chasingcat'){
            p.x+=p.vx*p.dir;p.runPhase+=0.12;p.tailPhase+=0.08;
            if(p.x>cw+15){p.dir=-1;}if(p.x<-15){p.dir=1;}
            var cx=p.x,cy=p.y,run=Math.sin(p.runPhase)*2;
            // Body
            c2.fillStyle='rgba(203,166,247,0.6)';
            c2.beginPath();c2.ellipse(cx,cy+run*0.3,5,3.5,0,0,Math.PI*2);c2.fill();
            // Head
            c2.beginPath();c2.arc(cx+p.dir*5,cy-1+run*0.2,2.5,0,Math.PI*2);c2.fill();
            // Ears
            c2.fillStyle='rgba(245,194,231,0.5)';
            c2.beginPath();c2.moveTo(cx+p.dir*4,cy-3);c2.lineTo(cx+p.dir*3,cy-7);c2.lineTo(cx+p.dir*6,cy-3);c2.fill();
            // Legs running
            c2.strokeStyle='rgba(203,166,247,0.5)';c2.lineWidth=1;
            var legOff=Math.sin(p.runPhase)*3;
            c2.beginPath();c2.moveTo(cx-2,cy+3);c2.lineTo(cx-2+legOff,cy+7);c2.stroke();
            c2.beginPath();c2.moveTo(cx+2,cy+3);c2.lineTo(cx+2-legOff,cy+7);c2.stroke();
            // Tail
            c2.strokeStyle='rgba(203,166,247,0.4)';c2.lineWidth=1.5;
            var tw=Math.sin(p.tailPhase)*4;
            c2.beginPath();c2.moveTo(cx-p.dir*5,cy);c2.quadraticCurveTo(cx-p.dir*8,cy-3+tw,cx-p.dir*10,cy-5);c2.stroke();
          } else if(p.type==='slidecup'){
            p.x+=p.vx;if(p.x>cw+20)p.x=-20;
            c2.fillStyle='rgba(250,179,135,0.5)';
            c2.fillRect(p.x-3,p.y-5,6,5);
            c2.fillStyle='rgba(148,226,213,0.3)';
            c2.fillRect(p.x-4,p.y-6,8,2);
            // Steam
            var soff2=Math.sin(frame*0.05)*1.5;
            c2.strokeStyle='rgba(148,226,213,0.2)';c2.lineWidth=0.6;
            c2.beginPath();c2.moveTo(p.x,p.y-7);c2.quadraticCurveTo(p.x+soff2,p.y-10,p.x-soff2,p.y-13);c2.stroke();
          } else if(p.type==='pastelsparkle'){
            p.life++;if(p.life>p.maxLife){p.life=0;p.x=Math.random()*cw;p.y=Math.random()*ch;}
            var sa=p.life<p.maxLife/2?p.life/(p.maxLife/2):1-(p.life-p.maxLife/2)/(p.maxLife/2);
            c2.fillStyle=p.color+(Math.round(sa*153).toString(16).padStart(2,'0'));
            c2.beginPath();c2.arc(p.x,p.y,1.5*sa,0,Math.PI*2);c2.fill();
          } else if(p.type==='zoomcat'){
            p.x+=p.vx;p.y+=Math.sin(frame*0.04+p.phase)*1.5;
            p.trail.push({x:p.x,y:p.y,life:12});
            if(p.trail.length>15)p.trail.shift();
            if(p.x>cw+30){p.x=-30;p.y=15+Math.random()*40;p.trail=[];}
            p.trail.forEach(function(t){t.life--;var ta=t.life/12;
              c2.fillStyle='rgba(203,166,247,'+ta*0.2+')';c2.beginPath();c2.ellipse(t.x,t.y,4*ta,2.5*ta,0,0,Math.PI*2);c2.fill();});
            p.trail=p.trail.filter(function(t){return t.life>0;});
            // Cat body
            c2.fillStyle='rgba(203,166,247,0.7)';
            c2.beginPath();c2.ellipse(p.x,p.y,5,3,0,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.arc(p.x+5,p.y-1,2.5,0,Math.PI*2);c2.fill();
            // Speed ears (flat back)
            c2.fillStyle='rgba(245,194,231,0.5)';
            c2.beginPath();c2.moveTo(p.x+4,p.y-3);c2.lineTo(p.x+1,p.y-6);c2.lineTo(p.x+6,p.y-3);c2.fill();
          } else if(p.type==='yarnstreak'){
            p.x+=p.vx;if(p.x>cw+20){p.x=-20;p.y=Math.random()*ch;}
            var lg=c2.createLinearGradient(p.x,p.y,p.x-p.len,p.y);
            lg.addColorStop(0,p.color+'aa');lg.addColorStop(1,p.color+'00');
            c2.beginPath();c2.moveTo(p.x,p.y);c2.lineTo(p.x-p.len,p.y);
            c2.strokeStyle=lg;c2.lineWidth=2;c2.lineCap='round';c2.stroke();
            // Yarn ball at front
            c2.fillStyle=p.color+'88';
            c2.beginPath();c2.arc(p.x,p.y,2,0,Math.PI*2);c2.fill();
          } else if(p.type==='coffeesplash'){
            p.x+=p.vx;p.y+=p.vy;p.life--;
            if(p.life<=0){p.x=Math.random()*cw;p.y=Math.random()*ch;p.life=p.maxLife;}
            var ca=p.life/p.maxLife;
            c2.fillStyle='rgba(250,179,135,'+ca*0.5+')';
            c2.beginPath();c2.arc(p.x,p.y,1.5*ca,0,Math.PI*2);c2.fill();
          }
        });
      },
      dracula:function(c2,cw,ch,frame,particles){
        var grad=c2.createLinearGradient(0,0,cw,0);
        grad.addColorStop(0,'rgba(40,42,54,0.15)');grad.addColorStop(1,'rgba(68,71,90,0.08)');
        c2.fillStyle=grad;c2.fillRect(0,0,cw,ch);
        particles.forEach(function(p){
          if(p.type==='sleepbat'){
            p.wingPhase+=0.01;
            var bx=p.x,by=p.y;
            var wf=Math.sin(p.wingPhase)*0.5; // subtle breathing
            // Body hanging
            c2.fillStyle='rgba(68,71,90,0.6)';
            c2.beginPath();c2.ellipse(bx,by+4,2,3,0,0,Math.PI*2);c2.fill();
            // Wings folded
            c2.fillStyle='rgba(98,114,164,0.4)';
            c2.beginPath();c2.ellipse(bx-2,by+3,1.5+wf,4,-.2,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.ellipse(bx+2,by+3,1.5+wf,4,.2,0,Math.PI*2);c2.fill();
            // Feet gripping
            c2.strokeStyle='rgba(98,114,164,0.5)';c2.lineWidth=0.8;
            c2.beginPath();c2.moveTo(bx-1,by);c2.lineTo(bx-1,by-2);c2.stroke();
            c2.beginPath();c2.moveTo(bx+1,by);c2.lineTo(bx+1,by-2);c2.stroke();
          } else if(p.type==='fog'){
            p.x+=p.vx;p.phase+=0.005;
            if(p.x>cw+p.sz)p.x=-p.sz;
            var fa=0.06+0.03*Math.sin(p.phase);
            c2.fillStyle='rgba(139,143,163,'+fa+')';
            c2.beginPath();c2.ellipse(p.x,p.y,p.sz,p.sz*0.4,0,0,Math.PI*2);c2.fill();
          } else if(p.type==='candle'){
            p.flickPhase+=0.1+Math.random()*0.05;
            var cx=p.x,cy=p.y;
            // Candle body
            c2.fillStyle='rgba(248,248,242,0.3)';
            c2.fillRect(cx-1.5,cy-8,3,8);
            // Flame
            var flick=Math.sin(p.flickPhase)*1.5;
            var fh=4+Math.sin(p.flickPhase*1.3)*1.5;
            c2.fillStyle='rgba(255,184,108,0.6)';
            c2.beginPath();c2.moveTo(cx,cy-8-fh);
            c2.quadraticCurveTo(cx+2+flick*0.3,cy-8-fh*0.5,cx,cy-8);
            c2.quadraticCurveTo(cx-2-flick*0.3,cy-8-fh*0.5,cx,cy-8-fh);
            c2.fill();
            // Glow
            c2.fillStyle='rgba(255,184,108,0.08)';
            c2.beginPath();c2.arc(cx,cy-10,6,0,Math.PI*2);c2.fill();
          } else if(p.type==='flybat'){
            p.x+=p.vx;p.wingPhase+=0.15;p.y+=Math.sin(frame*0.02+p.wobble)*0.4;
            if(p.x>cw+20)p.x=-20;
            var bx=p.x,by=p.y;
            var wf=Math.sin(p.wingPhase)*4;
            // Body
            c2.fillStyle='rgba(68,71,90,0.6)';
            c2.beginPath();c2.ellipse(bx,by,2,3,0,0,Math.PI*2);c2.fill();
            // Wings flapping
            c2.fillStyle='rgba(98,114,164,0.4)';
            c2.beginPath();c2.moveTo(bx-2,by);c2.lineTo(bx-8,by-wf);c2.lineTo(bx-6,by+1);c2.fill();
            c2.beginPath();c2.moveTo(bx+2,by);c2.lineTo(bx+8,by-wf);c2.lineTo(bx+6,by+1);c2.fill();
            // Eyes
            c2.fillStyle='rgba(255,85,85,0.6)';
            c2.beginPath();c2.arc(bx-1,by-1,0.6,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.arc(bx+1,by-1,0.6,0,Math.PI*2);c2.fill();
          } else if(p.type==='coffin'){
            p.openPhase+=0.008;
            var cx=p.x,cy=p.y;
            var openAmt=0.3+0.3*Math.sin(p.openPhase);
            // Coffin base
            c2.fillStyle='rgba(68,71,90,0.5)';
            c2.beginPath();c2.moveTo(cx-5,cy-8);c2.lineTo(cx+5,cy-8);c2.lineTo(cx+6,cy);c2.lineTo(cx-6,cy);c2.fill();
            // Lid (partially open)
            c2.fillStyle='rgba(98,114,164,0.4)';
            c2.save();c2.translate(cx-6,cy-8);c2.rotate(-openAmt);
            c2.fillRect(0,0,12,2);c2.restore();
            // Glow from inside when open
            if(openAmt>0.4){
              c2.fillStyle='rgba(189,147,249,0.1)';
              c2.beginPath();c2.arc(cx,cy-4,4,0,Math.PI*2);c2.fill();
            }
          } else if(p.type==='mooncloud'){
            p.x+=p.vx;if(p.x>cw+20)p.x=-20;
            c2.fillStyle='rgba(139,143,163,0.1)';
            c2.beginPath();c2.ellipse(p.x,p.y,p.sz,p.sz*0.5,0,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.ellipse(p.x+p.sz*0.4,p.y-1,p.sz*0.6,p.sz*0.35,0,0,Math.PI*2);c2.fill();
          } else if(p.type==='vampbat'){
            p.x+=p.vx;p.y+=p.vy+Math.sin(frame*0.05)*1;p.wingPhase+=0.2;
            p.trail.push({x:p.x,y:p.y,life:12});
            if(p.trail.length>15)p.trail.shift();
            if(p.x>cw+30){p.x=-30;p.y=Math.random()*ch;p.trail=[];}
            p.trail.forEach(function(t){t.life--;var ta=t.life/12;
              c2.fillStyle='rgba(68,71,90,'+ta*0.2+')';c2.beginPath();c2.arc(t.x,t.y,2*ta,0,Math.PI*2);c2.fill();});
            p.trail=p.trail.filter(function(t){return t.life>0;});
            var wf=Math.sin(p.wingPhase)*5;
            c2.fillStyle='rgba(68,71,90,0.7)';
            c2.beginPath();c2.ellipse(p.x,p.y,2.5,3,0,0,Math.PI*2);c2.fill();
            c2.fillStyle='rgba(98,114,164,0.5)';
            c2.beginPath();c2.moveTo(p.x-2,p.y);c2.lineTo(p.x-10,p.y-wf);c2.lineTo(p.x-7,p.y+1);c2.fill();
            c2.beginPath();c2.moveTo(p.x+2,p.y);c2.lineTo(p.x+10,p.y-wf);c2.lineTo(p.x+7,p.y+1);c2.fill();
            c2.fillStyle='rgba(255,85,85,0.7)';
            c2.beginPath();c2.arc(p.x-1,p.y-1,0.8,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.arc(p.x+1,p.y-1,0.8,0,Math.PI*2);c2.fill();
          } else if(p.type==='lightning'){
            p.timer++;
            if(!p.active&&p.timer>80+Math.random()*60){
              p.active=true;p.timer=0;
              p.bolts=[];
              var bx=Math.random()*cw*0.8+cw*0.1;
              var by=0;
              for(var seg=0;seg<6;seg++){
                var nx=bx+(Math.random()-0.5)*15;var ny=by+ch/6;
                p.bolts.push({x1:bx,y1:by,x2:nx,y2:ny});bx=nx;by=ny;
              }
            }
            if(p.active){
              c2.strokeStyle='rgba(189,147,249,'+(.6-p.timer*0.06)+')';c2.lineWidth=2;
              p.bolts.forEach(function(b){c2.beginPath();c2.moveTo(b.x1,b.y1);c2.lineTo(b.x2,b.y2);c2.stroke();});
              // Flash
              if(p.timer<3){c2.fillStyle='rgba(189,147,249,0.05)';c2.fillRect(0,0,cw,ch);}
              if(p.timer>10)p.active=false;
            }
          } else if(p.type==='bloodstreak'){
            p.x+=p.vx;if(p.x>cw+30){p.x=-30;p.y=Math.random()*ch;}
            var lg=c2.createLinearGradient(p.x,p.y,p.x-p.len,p.y);
            lg.addColorStop(0,'rgba(255,85,85,'+p.bright+')');lg.addColorStop(1,'rgba(189,147,249,0)');
            c2.beginPath();c2.moveTo(p.x,p.y);c2.lineTo(p.x-p.len,p.y);
            c2.strokeStyle=lg;c2.lineWidth=1.5;c2.lineCap='round';c2.stroke();
          }
        });
      },
      tokyonight:function(c2,cw,ch,frame,particles){
        var grad=c2.createLinearGradient(0,0,cw,0);
        grad.addColorStop(0,'rgba(26,27,38,0.12)');grad.addColorStop(1,'rgba(122,162,247,0.05)');
        c2.fillStyle=grad;c2.fillRect(0,0,cw,ch);
        particles.forEach(function(p){
          if(p.type==='lantern'){
            p.x+=p.vx;p.y+=p.vy;p.glowPhase+=0.02;
            if(p.y<-10){p.y=ch+5;p.x=Math.random()*cw;}
            if(p.x>cw+10)p.x=-10;
            var ga=0.3+0.15*Math.sin(p.glowPhase);
            // Glow
            c2.fillStyle=p.color.replace(')',',0.08)').replace('rgb','rgba');
            if(p.color[0]==='#'){
              var r=parseInt(p.color.slice(1,3),16),g=parseInt(p.color.slice(3,5),16),b=parseInt(p.color.slice(5,7),16);
              c2.fillStyle='rgba('+r+','+g+','+b+',0.08)';
            }
            c2.beginPath();c2.arc(p.x,p.y,8,0,Math.PI*2);c2.fill();
            // Lantern body
            c2.fillStyle=p.color+'aa';
            c2.beginPath();c2.ellipse(p.x,p.y,3,4,0,0,Math.PI*2);c2.fill();
            // Top/bottom caps
            c2.fillStyle=p.color+'66';
            c2.fillRect(p.x-2,p.y-4.5,4,1);
            c2.fillRect(p.x-2,p.y+3.5,4,1);
          } else if(p.type==='blossom'){
            p.x+=p.vx+Math.sin(frame*0.01+p.rot)*0.3;p.y+=p.vy;p.rot+=p.rotV;
            if(p.y>ch+5){p.y=-5;p.x=Math.random()*cw;}
            if(p.x>cw+5)p.x=-5;
            c2.save();c2.translate(p.x,p.y);c2.rotate(p.rot);
            c2.fillStyle='rgba(255,158,100,0.35)';
            // Petal shape
            c2.beginPath();c2.ellipse(0,0,p.sz,p.sz*0.6,0,0,Math.PI*2);c2.fill();
            c2.fillStyle='rgba(187,154,175,0.25)';
            c2.beginPath();c2.ellipse(p.sz*0.3,0,p.sz*0.4,p.sz*0.3,0.5,0,Math.PI*2);c2.fill();
            c2.restore();
          } else if(p.type==='train'){
            p.x+=p.vx;if(p.x>cw+p.len+20)p.x=-p.len-20;
            var tx=p.x,ty=p.y;
            // Train body
            c2.fillStyle='rgba(122,162,247,0.5)';
            c2.beginPath();
            c2.moveTo(tx+p.len*0.5+8,ty);
            c2.lineTo(tx+p.len*0.5,ty-5);c2.lineTo(tx-p.len*0.5,ty-5);
            c2.lineTo(tx-p.len*0.5,ty+3);c2.lineTo(tx+p.len*0.5+8,ty+3);
            c2.closePath();c2.fill();
            // Windows
            c2.fillStyle='rgba(255,158,100,0.4)';
            for(var wi=0;wi<4;wi++){
              c2.fillRect(tx-p.len*0.4+wi*12,ty-4,6,3);
            }
            // Nose
            c2.fillStyle='rgba(122,162,247,0.6)';
            c2.beginPath();c2.moveTo(tx+p.len*0.5+8,ty);c2.lineTo(tx+p.len*0.5+15,ty+1);c2.lineTo(tx+p.len*0.5+8,ty+3);c2.fill();
            // Rail
            c2.strokeStyle='rgba(122,162,247,0.2)';c2.lineWidth=1;
            c2.beginPath();c2.moveTo(0,ty+4);c2.lineTo(cw,ty+4);c2.stroke();
          } else if(p.type==='neonsign'){
            p.flickTimer++;
            if(p.flickTimer>90+Math.random()*40){p.on=!p.on;p.flickTimer=0;}
            if(!p.on&&p.flickTimer<3)p.on=true; // quick flicker
            if(!p.on)return;
            var r2=parseInt(p.color.slice(1,3),16),g2=parseInt(p.color.slice(3,5),16),b2=parseInt(p.color.slice(5,7),16);
            // Glow
            c2.fillStyle='rgba('+r2+','+g2+','+b2+',0.1)';
            c2.beginPath();c2.arc(p.x,p.y,8,0,Math.PI*2);c2.fill();
            // Sign (simple rectangle)
            c2.strokeStyle='rgba('+r2+','+g2+','+b2+',0.6)';c2.lineWidth=1.5;
            c2.strokeRect(p.x-5,p.y-3,10,6);
            // Inner line
            c2.beginPath();c2.moveTo(p.x-3,p.y);c2.lineTo(p.x+3,p.y);c2.stroke();
          } else if(p.type==='torii'){
            p.x+=p.vx;if(p.x>cw+30)p.x=-30;
            var gx=p.x,gy=p.y;
            c2.strokeStyle='rgba(255,85,85,0.4)';c2.lineWidth=2;
            // Pillars
            c2.beginPath();c2.moveTo(gx-8,gy);c2.lineTo(gx-8,gy+20);c2.stroke();
            c2.beginPath();c2.moveTo(gx+8,gy);c2.lineTo(gx+8,gy+20);c2.stroke();
            // Top beam (curved)
            c2.lineWidth=2.5;
            c2.beginPath();c2.moveTo(gx-12,gy);c2.quadraticCurveTo(gx,gy-3,gx+12,gy);c2.stroke();
            // Second beam
            c2.lineWidth=1.5;
            c2.beginPath();c2.moveTo(gx-9,gy+5);c2.lineTo(gx+9,gy+5);c2.stroke();
          } else if(p.type==='fasttrain'){
            p.x+=p.vx;
            p.trail.push({x:p.x,y:p.y,life:15});
            if(p.trail.length>20)p.trail.shift();
            if(p.x>cw+60){p.x=-60;p.trail=[];}
            p.trail.forEach(function(t){t.life--;var ta=t.life/15;
              c2.fillStyle='rgba(122,162,247,'+ta*0.15+')';c2.fillRect(t.x-25,t.y-4,50,8);});
            p.trail=p.trail.filter(function(t){return t.life>0;});
            // Fast train
            c2.fillStyle='rgba(122,162,247,0.6)';
            c2.beginPath();c2.moveTo(p.x+30,p.y);c2.lineTo(p.x+25,p.y-5);c2.lineTo(p.x-25,p.y-5);
            c2.lineTo(p.x-25,p.y+5);c2.lineTo(p.x+25,p.y+5);c2.closePath();c2.fill();
            // Nose
            c2.fillStyle='rgba(255,158,100,0.6)';
            c2.beginPath();c2.moveTo(p.x+30,p.y);c2.lineTo(p.x+40,p.y+1);c2.lineTo(p.x+30,p.y+3);c2.fill();
            // Windows lit
            c2.fillStyle='rgba(255,232,100,0.5)';
            for(var wi2=0;wi2<5;wi2++){c2.fillRect(p.x-22+wi2*10,p.y-4,5,3);}
            // Light trail ahead
            c2.strokeStyle='rgba(255,158,100,0.2)';c2.lineWidth=1;
            c2.beginPath();c2.moveTo(p.x+40,p.y+1);c2.lineTo(p.x+60,p.y+1);c2.stroke();
          } else if(p.type==='neonburst'){
            p.phase+=0.04;
            var r3=((Math.sin(p.phase)+1)/2)*p.maxR;
            var ba=1-r3/p.maxR;
            if(ba<0.05){p.phase=0;p.x=Math.random()*cw;p.y=Math.random()*ch;}
            var r4=parseInt(p.color.slice(1,3),16),g4=parseInt(p.color.slice(3,5),16),b4=parseInt(p.color.slice(5,7),16);
            c2.strokeStyle='rgba('+r4+','+g4+','+b4+','+ba*0.5+')';c2.lineWidth=1.5;
            c2.beginPath();c2.arc(p.x,p.y,r3,0,Math.PI*2);c2.stroke();
          } else if(p.type==='firework'){
            p.x+=p.vx;p.y+=p.vy;
            if(p.x>cw+20){p.x=-20;p.y=Math.random()*ch;}
            var lg=c2.createLinearGradient(p.x,p.y,p.x-p.len,p.y);
            var r5=parseInt(p.color.slice(1,3),16),g5=parseInt(p.color.slice(3,5),16),b5=parseInt(p.color.slice(5,7),16);
            lg.addColorStop(0,'rgba('+r5+','+g5+','+b5+',0.5)');lg.addColorStop(1,'rgba('+r5+','+g5+','+b5+',0)');
            c2.beginPath();c2.moveTo(p.x,p.y);c2.lineTo(p.x-p.len,p.y-p.vy*3);
            c2.strokeStyle=lg;c2.lineWidth=1.5;c2.lineCap='round';c2.stroke();
          }
        });
      },
      rosepine:function(c2,cw,ch,frame,particles){
        var grad=c2.createLinearGradient(0,0,cw,0);
        grad.addColorStop(0,'rgba(38,35,58,0.1)');grad.addColorStop(1,'rgba(196,167,231,0.04)');
        c2.fillStyle=grad;c2.fillRect(0,0,cw,ch);
        particles.forEach(function(p){
          if(p.type==='flowerbud'){
            p.openPhase+=0.005;
            var fx=p.x,fy=p.y;
            var openAmt=0.3+0.3*Math.sin(p.openPhase);
            // Stem
            c2.strokeStyle='rgba(156,207,216,0.4)';c2.lineWidth=1.5;
            c2.beginPath();c2.moveTo(fx,fy);c2.lineTo(fx,fy-8);c2.stroke();
            // Petals opening
            c2.fillStyle='rgba(235,188,186,0.4)';
            for(var pi=0;pi<p.petalCount;pi++){
              var angle=(pi/p.petalCount)*Math.PI*2;
              var px=fx+Math.cos(angle)*3*openAmt;
              var py=fy-8+Math.sin(angle)*3*openAmt;
              c2.beginPath();c2.ellipse(px,py,2,1.2,angle,0,Math.PI*2);c2.fill();
            }
            // Center
            c2.fillStyle='rgba(246,193,119,0.5)';
            c2.beginPath();c2.arc(fx,fy-8,1.2,0,Math.PI*2);c2.fill();
          } else if(p.type==='dewdrop'){
            p.glowPhase+=0.02;
            var da=0.3+0.2*Math.sin(p.glowPhase);
            c2.fillStyle='rgba(156,207,216,'+da+')';
            c2.beginPath();c2.arc(p.x,p.y,p.sz,0,Math.PI*2);c2.fill();
            // Gleam
            c2.fillStyle='rgba(224,222,244,'+da*0.6+')';
            c2.beginPath();c2.arc(p.x-p.sz*0.3,p.y-p.sz*0.3,p.sz*0.3,0,Math.PI*2);c2.fill();
          } else if(p.type==='restbutterfly'){
            p.wingPhase+=0.02;
            var bx=p.x,by=p.y;
            var wf=0.5+0.3*Math.sin(p.wingPhase); // gentle wing movement
            var r6=parseInt(p.color.slice(1,3),16),g6=parseInt(p.color.slice(3,5),16),b6=parseInt(p.color.slice(5,7),16);
            // Wings
            c2.fillStyle='rgba('+r6+','+g6+','+b6+',0.4)';
            c2.beginPath();c2.ellipse(bx-3,by,3*wf,2,-.3,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.ellipse(bx+3,by,3*wf,2,.3,0,Math.PI*2);c2.fill();
            // Body
            c2.fillStyle='rgba(38,35,58,0.5)';
            c2.beginPath();c2.ellipse(bx,by,0.8,2.5,0,0,Math.PI*2);c2.fill();
          } else if(p.type==='flybutterfly'){
            p.x+=p.vx;p.y+=p.vy+Math.sin(frame*0.03)*0.3;p.wingPhase+=0.12;
            if(p.x>cw+10){p.x=-10;}if(p.y<-5||p.y>ch+5){p.vy*=-1;}
            var r7=parseInt(p.color.slice(1,3),16),g7=parseInt(p.color.slice(3,5),16),b7=parseInt(p.color.slice(5,7),16);
            var wf2=Math.sin(p.wingPhase)*3;
            c2.fillStyle='rgba('+r7+','+g7+','+b7+',0.4)';
            c2.beginPath();c2.ellipse(p.x-3,p.y,3,2+wf2*0.3,-.2,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.ellipse(p.x+3,p.y,3,2+wf2*0.3,.2,0,Math.PI*2);c2.fill();
            c2.fillStyle='rgba(38,35,58,0.5)';
            c2.beginPath();c2.ellipse(p.x,p.y,0.8,2,0,0,Math.PI*2);c2.fill();
          } else if(p.type==='breezepetal'){
            p.x+=p.vx;p.y+=p.vy;p.rot+=0.02;
            if(p.x>cw+5){p.x=-5;}if(p.y<-5||p.y>ch+5){p.vy*=-1;}
            c2.save();c2.translate(p.x,p.y);c2.rotate(p.rot);
            c2.fillStyle=p.color+'66';
            c2.beginPath();c2.ellipse(0,0,p.sz,p.sz*0.5,0,0,Math.PI*2);c2.fill();
            c2.restore();
          } else if(p.type==='vine'){
            if(p.growLen<p.maxLen){p.growLen+=0.05;
              if(p.segments.length<Math.floor(p.growLen/3)){
                var lastSeg=p.segments.length?p.segments[p.segments.length-1]:{x:p.x,y:p.y};
                p.segments.push({x:lastSeg.x+(Math.random()-0.5)*6,y:lastSeg.y-3});
              }
            }
            c2.strokeStyle='rgba(156,207,216,0.3)';c2.lineWidth=1;
            if(p.segments.length>1){
              c2.beginPath();c2.moveTo(p.x,p.y);
              p.segments.forEach(function(s){c2.lineTo(s.x,s.y);});c2.stroke();
            }
            // Leaves
            p.segments.forEach(function(s,i){
              if(i%2===0){
                c2.fillStyle='rgba(156,207,216,0.25)';
                c2.beginPath();c2.ellipse(s.x+(i%4?2:-2),s.y,2,1.2,i%4?.4:-.4,0,Math.PI*2);c2.fill();
              }
            });
          } else if(p.type==='petalstorm'){
            p.x+=p.vx;p.y+=p.vy;p.rot+=0.05;
            if(p.x>cw+10){p.x=-10;p.y=Math.random()*ch;}
            c2.save();c2.translate(p.x,p.y);c2.rotate(p.rot);
            c2.fillStyle=p.color+'88';
            c2.beginPath();c2.ellipse(0,0,p.sz,p.sz*0.5,0,0,Math.PI*2);c2.fill();
            c2.restore();
          } else if(p.type==='rapidvine'){
            p.x+=p.vx;p.growTimer++;
            if(p.growTimer%3===0&&p.segments.length<20){
              var lx=p.segments.length?p.segments[p.segments.length-1].x:p.x;
              var ly=p.segments.length?p.segments[p.segments.length-1].y:p.y;
              p.segments.push({x:lx+3+(Math.random()-0.5)*2,y:ly+(Math.random()-0.5)*4});
            }
            if(p.x>cw+20){p.x=-20;p.segments=[];p.growTimer=0;}
            c2.strokeStyle='rgba(156,207,216,0.4)';c2.lineWidth=1.5;
            if(p.segments.length>1){
              c2.beginPath();c2.moveTo(p.segments[0].x,p.segments[0].y);
              p.segments.forEach(function(s){c2.lineTo(s.x,s.y);});c2.stroke();
            }
            p.segments.forEach(function(s,i){
              if(i%3===0){c2.fillStyle='rgba(235,188,186,0.3)';
                c2.beginPath();c2.arc(s.x,s.y,1.5,0,Math.PI*2);c2.fill();}
            });
          } else if(p.type==='tornadobutterfly'){
            p.angle+=p.speed;p.wingPhase+=0.15;
            // Spiral outward slowly
            p.dist=10+8*Math.sin(frame*0.01);
            var bx=p.cx+Math.cos(p.angle)*p.dist+Math.sin(frame*0.005)*20;
            var by=p.cy+Math.sin(p.angle)*p.dist*0.6;
            var r8=parseInt(p.color.slice(1,3),16),g8=parseInt(p.color.slice(3,5),16),b8=parseInt(p.color.slice(5,7),16);
            var wf3=Math.sin(p.wingPhase)*2;
            c2.fillStyle='rgba('+r8+','+g8+','+b8+',0.4)';
            c2.beginPath();c2.ellipse(bx-2,by,2,1.5+wf3*0.2,-.2,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.ellipse(bx+2,by,2,1.5+wf3*0.2,.2,0,Math.PI*2);c2.fill();
            c2.fillStyle='rgba(38,35,58,0.4)';
            c2.beginPath();c2.ellipse(bx,by,0.5,1.5,0,0,Math.PI*2);c2.fill();
          }
        });
      },
      synthwave:function(c2,cw,ch,frame,particles){
        var grad=c2.createLinearGradient(0,0,0,ch);
        grad.addColorStop(0,'rgba(36,27,47,0.12)');grad.addColorStop(1,'rgba(255,126,219,0.04)');
        c2.fillStyle=grad;c2.fillRect(0,0,cw,ch);
        particles.forEach(function(p){
          if(p.type==='gridline'){
            p.phase+=p.speed;if(p.phase>cw)p.phase-=cw;
            c2.strokeStyle='rgba(255,126,219,0.12)';c2.lineWidth=0.5;
            c2.beginPath();c2.moveTo(0,p.y);c2.lineTo(cw,p.y);c2.stroke();
            // Vertical grid ticks moving
            for(var gi=0;gi<6;gi++){
              var gx=(p.phase+gi*(cw/6))%cw;
              c2.strokeStyle='rgba(54,249,246,0.08)';
              c2.beginPath();c2.moveTo(gx,p.y-3);c2.lineTo(gx,p.y+3);c2.stroke();
            }
          } else if(p.type==='retrosun'){
            p.phase+=0.01;
            var sr=p.r+Math.sin(p.phase)*1;
            // Sun bands
            for(var si=0;si<5;si++){
              var by2=p.y-sr+si*(sr*2/5);
              var ba=0.15-si*0.02;
              c2.fillStyle='rgba(254,222,93,'+ba+')';
              c2.beginPath();c2.arc(p.x,p.y,sr-si*0.5,Math.PI,Math.PI*2);c2.fill();
            }
            // Horizontal cut lines
            c2.fillStyle='rgba(36,27,47,0.3)';
            for(var ci=1;ci<4;ci++){
              c2.fillRect(p.x-sr,p.y+ci*3,sr*2,1.5);
            }
          } else if(p.type==='palm'){
            p.sway+=0.01;
            var px=p.x,py=p.y;
            // Trunk
            c2.strokeStyle='rgba(36,27,47,0.5)';c2.lineWidth=2;
            c2.beginPath();c2.moveTo(px,py);c2.quadraticCurveTo(px+Math.sin(p.sway)*2,py-p.sz*0.5,px+Math.sin(p.sway)*3,py-p.sz);c2.stroke();
            // Fronds
            var tx=px+Math.sin(p.sway)*3,ty=py-p.sz;
            c2.strokeStyle='rgba(36,27,47,0.4)';c2.lineWidth=1;
            for(var fi=0;fi<5;fi++){
              var fa=-0.8+fi*0.4+Math.sin(p.sway+fi)*0.1;
              c2.beginPath();c2.moveTo(tx,ty);
              c2.quadraticCurveTo(tx+Math.cos(fa)*10,ty+Math.sin(fa)*8-5,tx+Math.cos(fa)*15,ty+Math.sin(fa)*12);c2.stroke();
            }
          } else if(p.type==='retrocar'){
            p.x+=p.vx;
            p.lightTrail.push({x:p.x-12,y:p.y+2,life:20});
            if(p.lightTrail.length>25)p.lightTrail.shift();
            if(p.x>cw+40)p.x=-40;
            p.lightTrail.forEach(function(t){t.life--;var ta=t.life/20;
              c2.fillStyle='rgba(255,126,219,'+ta*0.2+')';c2.fillRect(t.x,t.y-1,2,2);});
            p.lightTrail=p.lightTrail.filter(function(t){return t.life>0;});
            // Car body
            c2.fillStyle='rgba(54,249,246,0.4)';
            c2.beginPath();c2.moveTo(p.x+12,p.y+3);c2.lineTo(p.x+10,p.y-2);c2.lineTo(p.x-8,p.y-2);
            c2.lineTo(p.x-12,p.y+3);c2.closePath();c2.fill();
            // Roof
            c2.fillStyle='rgba(54,249,246,0.3)';
            c2.beginPath();c2.moveTo(p.x+5,p.y-2);c2.lineTo(p.x+3,p.y-6);c2.lineTo(p.x-5,p.y-6);c2.lineTo(p.x-7,p.y-2);c2.fill();
            // Wheels
            c2.fillStyle='rgba(36,27,47,0.6)';
            c2.beginPath();c2.arc(p.x-6,p.y+3,2,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.arc(p.x+6,p.y+3,2,0,Math.PI*2);c2.fill();
            // Headlight
            c2.fillStyle='rgba(254,222,93,0.5)';
            c2.beginPath();c2.arc(p.x+12,p.y+1,1.5,0,Math.PI*2);c2.fill();
          } else if(p.type==='pulsesun'){
            p.pulsePhase+=0.03;
            var pr=p.r+Math.sin(p.pulsePhase)*3;
            c2.fillStyle='rgba(254,222,93,0.15)';
            c2.beginPath();c2.arc(p.x,p.y,pr+4,0,Math.PI*2);c2.fill();
            c2.fillStyle='rgba(254,222,93,0.25)';
            c2.beginPath();c2.arc(p.x,p.y,pr,Math.PI,Math.PI*2);c2.fill();
            // Lines
            c2.fillStyle='rgba(36,27,47,0.3)';
            for(var li=1;li<3;li++){c2.fillRect(p.x-pr,p.y+li*2,pr*2,1);}
          } else if(p.type==='perspgrid'){
            p.phase+=p.speed;if(p.phase>cw)p.phase-=cw;
            c2.strokeStyle='rgba(255,126,219,0.08)';c2.lineWidth=0.5;
            c2.beginPath();c2.moveTo(p.phase,ch);c2.lineTo(cw/2,ch*0.3);c2.stroke();
          } else if(p.type==='racecar'){
            p.x+=p.vx;
            p.trail.push({x:p.x-10,y:p.y,life:12});
            if(p.trail.length>15)p.trail.shift();
            if(p.x>cw+40){p.x=-40;p.trail=[];}
            p.trail.forEach(function(t){t.life--;var ta=t.life/12;
              c2.fillStyle='rgba(54,249,246,'+ta*0.15+')';c2.fillRect(t.x,t.y-2,8,4);});
            p.trail=p.trail.filter(function(t){return t.life>0;});
            c2.fillStyle='rgba(54,249,246,0.5)';
            c2.beginPath();c2.moveTo(p.x+10,p.y);c2.lineTo(p.x+8,p.y-3);c2.lineTo(p.x-8,p.y-3);
            c2.lineTo(p.x-10,p.y+3);c2.lineTo(p.x+10,p.y+3);c2.closePath();c2.fill();
            c2.fillStyle='rgba(36,27,47,0.5)';
            c2.beginPath();c2.arc(p.x-5,p.y+3,1.5,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.arc(p.x+5,p.y+3,1.5,0,Math.PI*2);c2.fill();
          } else if(p.type==='zoomgrid'){
            p.phase+=p.speed;if(p.phase>cw)p.phase-=cw;
            c2.strokeStyle='rgba(255,126,219,0.1)';c2.lineWidth=0.5;
            c2.beginPath();c2.moveTo(p.phase,p.y);c2.lineTo(p.phase+20,p.y);c2.stroke();
          } else if(p.type==='laser'){
            p.x+=p.vx;if(p.x>cw+30){p.x=-30;p.y=Math.random()*ch;}
            var r9=parseInt(p.color.slice(1,3),16),g9=parseInt(p.color.slice(3,5),16),b9=parseInt(p.color.slice(5,7),16);
            var lg2=c2.createLinearGradient(p.x,p.y,p.x-p.len,p.y);
            lg2.addColorStop(0,'rgba('+r9+','+g9+','+b9+',0.5)');lg2.addColorStop(1,'rgba('+r9+','+g9+','+b9+',0)');
            c2.beginPath();c2.moveTo(p.x,p.y);c2.lineTo(p.x-p.len,p.y);
            c2.strokeStyle=lg2;c2.lineWidth=2;c2.lineCap='round';c2.stroke();
          }
        });
      },
      galaxy:function(c2,cw,ch,frame,particles){
        var grad=c2.createLinearGradient(0,0,cw,0);
        grad.addColorStop(0,'rgba(15,11,30,0.12)');grad.addColorStop(1,'rgba(139,92,246,0.04)');
        c2.fillStyle=grad;c2.fillRect(0,0,cw,ch);
        particles.forEach(function(p){
          if(p.type==='nebula'){
            p.x+=p.vx;p.phase+=0.005;
            if(p.x>cw+p.sz)p.x=-p.sz;
            var na=0.06+0.03*Math.sin(p.phase);
            var r10=parseInt(p.color.slice(1,3),16),g10=parseInt(p.color.slice(3,5),16),b10=parseInt(p.color.slice(5,7),16);
            c2.fillStyle='rgba('+r10+','+g10+','+b10+','+na+')';
            c2.beginPath();c2.ellipse(p.x,p.y,p.sz,p.sz*0.6,p.phase,0,Math.PI*2);c2.fill();
          } else if(p.type==='planet'){
            p.orbitPhase+=0.003;
            var px=p.x+Math.cos(p.orbitPhase)*5;
            var py=p.y+Math.sin(p.orbitPhase)*3;
            var r11=parseInt(p.color.slice(1,3),16),g11=parseInt(p.color.slice(3,5),16),b11=parseInt(p.color.slice(5,7),16);
            c2.fillStyle='rgba('+r11+','+g11+','+b11+',0.4)';
            c2.beginPath();c2.arc(px,py,p.r,0,Math.PI*2);c2.fill();
            // Ring for one
            if(p.r>5){
              c2.strokeStyle='rgba('+r11+','+g11+','+b11+',0.2)';c2.lineWidth=0.5;
              c2.beginPath();c2.ellipse(px,py,p.r+3,1.5,.3,0,Math.PI*2);c2.stroke();
            }
          } else if(p.type==='asteroid'){
            p.x+=p.vx;p.y+=p.vy;p.rot+=0.01;
            if(p.x>cw+5)p.x=-5;if(p.y>ch+5)p.y=-5;
            c2.fillStyle='rgba(167,139,250,0.3)';
            c2.save();c2.translate(p.x,p.y);c2.rotate(p.rot);
            c2.beginPath();c2.moveTo(0,-p.r);c2.lineTo(p.r*0.7,p.r*0.5);c2.lineTo(-p.r*0.7,p.r*0.5);c2.fill();
            c2.restore();
          } else if(p.type==='spacecraft'){
            p.x+=p.vx;
            p.trail.push({x:p.x-8,y:p.y,life:15});
            if(p.trail.length>18)p.trail.shift();
            if(p.x>cw+30){p.x=-30;p.trail=[];}
            p.trail.forEach(function(t){t.life--;var ta=t.life/15;
              c2.fillStyle='rgba(139,92,246,'+ta*0.3+')';
              c2.beginPath();c2.arc(t.x,t.y,1.5*ta,0,Math.PI*2);c2.fill();});
            p.trail=p.trail.filter(function(t){return t.life>0;});
            // Ship body
            c2.fillStyle='rgba(196,181,253,0.6)';
            c2.beginPath();c2.moveTo(p.x+10,p.y);c2.lineTo(p.x-5,p.y-4);c2.lineTo(p.x-5,p.y+4);c2.closePath();c2.fill();
            // Cockpit
            c2.fillStyle='rgba(96,165,250,0.5)';
            c2.beginPath();c2.arc(p.x+5,p.y,1.5,0,Math.PI*2);c2.fill();
            // Wings
            c2.fillStyle='rgba(167,139,250,0.4)';
            c2.beginPath();c2.moveTo(p.x-3,p.y-4);c2.lineTo(p.x-6,p.y-7);c2.lineTo(p.x-5,p.y-3);c2.fill();
            c2.beginPath();c2.moveTo(p.x-3,p.y+4);c2.lineTo(p.x-6,p.y+7);c2.lineTo(p.x-5,p.y+3);c2.fill();
            // Engine glow
            c2.fillStyle='rgba(139,92,246,0.5)';
            c2.beginPath();c2.arc(p.x-6,p.y,2,0,Math.PI*2);c2.fill();
          } else if(p.type==='comet'){
            p.x+=p.vx;p.y+=p.vy;
            if(p.x>cw+20){p.x=-20;p.y=Math.random()*ch;}
            var lg=c2.createLinearGradient(p.x,p.y,p.x-p.len,p.y-p.vy*5);
            lg.addColorStop(0,'rgba(196,181,253,0.5)');lg.addColorStop(1,'rgba(139,92,246,0)');
            c2.beginPath();c2.moveTo(p.x,p.y);c2.lineTo(p.x-p.len,p.y-p.vy*5);
            c2.strokeStyle=lg;c2.lineWidth=1.5;c2.lineCap='round';c2.stroke();
            c2.fillStyle='rgba(224,222,244,0.6)';
            c2.beginPath();c2.arc(p.x,p.y,1.5,0,Math.PI*2);c2.fill();
          } else if(p.type==='gstar'){
            var tw=0.3+0.3*Math.abs(Math.sin(frame*0.02+p.twinkle));
            c2.fillStyle='rgba(196,181,253,'+tw+')';
            c2.beginPath();c2.arc(p.x,p.y,p.r,0,Math.PI*2);c2.fill();
          } else if(p.type==='hyperstar'){
            p.dist+=p.speed;p.len=Math.min(p.len+0.5,30);
            var hx=p.cx+Math.cos(p.angle)*p.dist;
            var hy=p.cy+Math.sin(p.angle)*p.dist;
            var hx2=p.cx+Math.cos(p.angle)*(p.dist-p.len);
            var hy2=p.cy+Math.sin(p.angle)*(p.dist-p.len);
            if(p.dist>Math.max(cw,ch)){p.dist=5+Math.random()*10;p.len=0;}
            var ha=Math.min(p.dist/50,0.6);
            var lg2=c2.createLinearGradient(hx,hy,hx2,hy2);
            lg2.addColorStop(0,'rgba(196,181,253,'+ha+')');lg2.addColorStop(1,'rgba(139,92,246,0)');
            c2.beginPath();c2.moveTo(hx,hy);c2.lineTo(hx2,hy2);
            c2.strokeStyle=lg2;c2.lineWidth=1.5;c2.lineCap='round';c2.stroke();
          } else if(p.type==='wormhole'){
            p.phase+=0.03;p.r=Math.min(p.r+0.05,p.maxR);
            // Rings
            for(var ri=0;ri<4;ri++){
              var rr=p.r*(0.4+ri*0.2);
              var ra=0.15-ri*0.03;
              c2.strokeStyle='rgba(139,92,246,'+ra+')';c2.lineWidth=1.5;
              c2.beginPath();c2.ellipse(p.x,p.y,rr,rr*0.4,p.phase+ri*0.3,0,Math.PI*2);c2.stroke();
            }
            // Center glow
            c2.fillStyle='rgba(96,165,250,0.1)';
            c2.beginPath();c2.arc(p.x,p.y,p.r*0.3,0,Math.PI*2);c2.fill();
          } else if(p.type==='energystreak'){
            p.x+=p.vx;if(p.x>cw+30){p.x=-30;p.y=Math.random()*ch;}
            var r12=parseInt(p.color.slice(1,3),16),g12=parseInt(p.color.slice(3,5),16),b12=parseInt(p.color.slice(5,7),16);
            var lg3=c2.createLinearGradient(p.x,p.y,p.x-p.len,p.y);
            lg3.addColorStop(0,'rgba('+r12+','+g12+','+b12+','+p.bright+')');lg3.addColorStop(1,'rgba('+r12+','+g12+','+b12+',0)');
            c2.beginPath();c2.moveTo(p.x,p.y);c2.lineTo(p.x-p.len,p.y);
            c2.strokeStyle=lg3;c2.lineWidth=1.5;c2.lineCap='round';c2.stroke();
          }
        });
      }
    };

    function startTierAnimation(){
      if(tierAnimId){cancelAnimationFrame(tierAnimId);tierAnimId=null;}
      var canvas=document.getElementById('tier-canvas');
      if(!canvas)return;
      var parent=canvas.parentElement;
      if(!parent)return;
      canvas.width=parent.offsetWidth;
      canvas.height=80;
      var w=canvas.width,h=canvas.height;
      var ctx=canvas.getContext('2d');
      tierParticles=[];

      // Check for themed animation
      var useThemed=tierThemeInit[curTheme]&&tierThemeDraw[curTheme];
      if(useThemed){
        tierThemeInit[curTheme](w,h,activeTier,tierParticles);
      } else if(activeTier==='economy'){
        for(var i=0;i<10;i++) tierParticles.push({type:'orb',x:Math.random()*w,y:Math.random()*h,r:2+Math.random()*3,vx:0.1+Math.random()*0.2,phase:Math.random()*Math.PI*2});
        // Plants that grow
        for(var ip=0;ip<6;ip++) tierParticles.push({type:'plant',x:30+ip*(w/6),y:h-5,size:0,maxSize:8+Math.random()*6,grown:false,phase:Math.random()*100});
        // Bunnies
        for(var ib=0;ib<3;ib++) tierParticles.push({type:'bunny',x:Math.random()*w,y:h-12,vx:0.2+Math.random()*0.3,dir:1,hop:0});
        // Troll
        tierParticles.push({type:'troll',x:-20,y:h-18,vx:0.4,planting:0,plantTimer:0,dir:1});
      } else if(activeTier==='standard'){
        for(var i2=0;i2<15;i2++) tierParticles.push({type:'stream',x:Math.random()*w,y:Math.random()*h,len:8+Math.random()*12,vx:1+Math.random()*1.5,phase:Math.random()*Math.PI*2});
        // Stars background
        for(var is=0;is<20;is++) tierParticles.push({type:'star',x:Math.random()*w,y:Math.random()*h,r:0.5+Math.random(),twinkle:Math.random()*Math.PI*2});
        // UFOs
        for(var iu=0;iu<3;iu++) tierParticles.push({type:'ufo',x:-30-iu*80,y:15+Math.random()*30,vx:0.8+Math.random()*0.8,wobble:Math.random()*Math.PI*2,beam:0});
      } else {
        for(var i3=0;i3<30;i3++) tierParticles.push({type:'streak',x:Math.random()*w,y:Math.random()*h,len:12+Math.random()*25,vx:3+Math.random()*5,vy:-0.3+Math.random()*0.6,bright:0.4+Math.random()*0.4});
        // Rockets
        for(var ir=0;ir<4;ir++) tierParticles.push({type:'rocket',x:-40-ir*60,y:10+Math.random()*40,vx:2.5+Math.random()*3,vy:-0.2+Math.random()*0.4,exhaust:[]});
      }

      var frame=0;
      function drawTier(){
        frame++;
        var cv=document.getElementById('tier-canvas');
        if(!cv){tierAnimId=null;return;}
        var cw=cv.width,ch=cv.height;
        var c2=cv.getContext('2d');
        c2.clearRect(0,0,cw,ch);

        // Themed draw path
        if(useThemed){
          tierThemeDraw[curTheme](c2,cw,ch,frame,tierParticles);
          tierAnimId=requestAnimationFrame(drawTier);
          return;
        }

        // Background
        var grad=c2.createLinearGradient(0,0,cw,0);
        if(activeTier==='economy'){
          grad.addColorStop(0,'rgba(34,130,60,0.12)');grad.addColorStop(1,'rgba(34,197,94,0.04)');
          c2.fillStyle=grad;c2.fillRect(0,0,cw,ch);
          // Ground
          c2.fillStyle='rgba(34,120,50,0.2)';c2.fillRect(0,ch-6,cw,6);
        } else if(activeTier==='standard'){
          grad.addColorStop(0,'rgba(10,10,40,0.15)');grad.addColorStop(1,'rgba(30,20,60,0.1)');
          c2.fillStyle=grad;c2.fillRect(0,0,cw,ch);
        } else {
          grad.addColorStop(0,'rgba(40,10,0,0.15)');grad.addColorStop(1,'rgba(60,20,0,0.08)');
          c2.fillStyle=grad;c2.fillRect(0,0,cw,ch);
        }

        tierParticles.forEach(function(p2){
          if(p2.type==='orb'){
            p2.x+=p2.vx;p2.y+=Math.sin(frame*0.02+p2.phase)*0.2;
            if(p2.x>cw+10)p2.x=-10;
            var gl=0.2+0.15*Math.sin(frame*0.03+p2.phase);
            c2.beginPath();c2.arc(p2.x,p2.y,p2.r,0,Math.PI*2);
            c2.fillStyle='rgba(34,197,94,'+gl+')';c2.fill();
          } else if(p2.type==='plant'){
            // Plants grow slowly
            if(p2.size<p2.maxSize)p2.size+=0.02;
            var px=p2.x,py=p2.y;
            // Stem
            c2.strokeStyle='rgba(34,160,60,0.6)';c2.lineWidth=1.5;
            c2.beginPath();c2.moveTo(px,py);c2.lineTo(px,py-p2.size);c2.stroke();
            // Leaves
            if(p2.size>3){
              c2.fillStyle='rgba(34,197,94,0.5)';
              c2.beginPath();c2.ellipse(px-2,py-p2.size*0.6,2,1.5,-.5,0,Math.PI*2);c2.fill();
              c2.beginPath();c2.ellipse(px+2,py-p2.size*0.7,2,1.5,.5,0,Math.PI*2);c2.fill();
            }
            // Flower when fully grown
            if(p2.size>=p2.maxSize-0.1){
              c2.fillStyle='rgba(255,200,50,0.6)';
              c2.beginPath();c2.arc(px,py-p2.size,2,0,Math.PI*2);c2.fill();
            }
          } else if(p2.type==='bunny'){
            p2.x+=p2.vx*p2.dir;
            p2.hop=Math.abs(Math.sin(frame*0.08))*4;
            if(p2.x>cw+10){p2.x=cw+10;p2.dir=-1;}
            if(p2.x<-10){p2.x=-10;p2.dir=1;}
            var bx=p2.x,by=p2.y-p2.hop;
            // Body
            c2.fillStyle='rgba(220,200,180,0.7)';
            c2.beginPath();c2.ellipse(bx,by,4,3,0,0,Math.PI*2);c2.fill();
            // Head
            c2.beginPath();c2.arc(bx+(p2.dir*4),by-2,2.5,0,Math.PI*2);c2.fill();
            // Ears
            c2.fillStyle='rgba(240,210,200,0.6)';
            c2.beginPath();c2.ellipse(bx+(p2.dir*4)-1,by-6,1,3,-.2,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.ellipse(bx+(p2.dir*4)+1,by-6,1,3,.2,0,Math.PI*2);c2.fill();
            // Tail
            c2.fillStyle='rgba(255,255,255,0.5)';
            c2.beginPath();c2.arc(bx-(p2.dir*4),by,1.5,0,Math.PI*2);c2.fill();
          } else if(p2.type==='troll'){
            p2.x+=p2.vx*p2.dir;
            if(p2.x>cw+20){p2.x=cw+20;p2.dir=-1;}
            if(p2.x<-20){p2.x=-20;p2.dir=1;}
            var tx=p2.x,ty=p2.y;
            var walk=Math.sin(frame*0.06)*2;
            // Body (brown/green)
            c2.fillStyle='rgba(100,140,80,0.7)';
            c2.beginPath();c2.ellipse(tx,ty+walk*0.3,5,7,0,0,Math.PI*2);c2.fill();
            // Head
            c2.fillStyle='rgba(120,160,90,0.7)';
            c2.beginPath();c2.arc(tx,ty-8+walk*0.2,4,0,Math.PI*2);c2.fill();
            // Eyes
            c2.fillStyle='rgba(255,255,200,0.8)';
            c2.beginPath();c2.arc(tx+(p2.dir*2),ty-9+walk*0.2,1,0,Math.PI*2);c2.fill();
            // Hat (pointy leaf hat)
            c2.fillStyle='rgba(34,160,60,0.6)';
            c2.beginPath();c2.moveTo(tx,ty-18+walk*0.2);c2.lineTo(tx-4,ty-11+walk*0.2);c2.lineTo(tx+4,ty-11+walk*0.2);c2.fill();
            // Legs walking
            c2.strokeStyle='rgba(100,140,80,0.6)';c2.lineWidth=1.5;
            c2.beginPath();c2.moveTo(tx-2,ty+7);c2.lineTo(tx-2+Math.sin(frame*0.06)*3,ty+12);c2.stroke();
            c2.beginPath();c2.moveTo(tx+2,ty+7);c2.lineTo(tx+2-Math.sin(frame*0.06)*3,ty+12);c2.stroke();
            // Planting action — drop a seed every 100 frames
            p2.plantTimer++;
            if(p2.plantTimer>100){
              p2.plantTimer=0;
              // Find nearest unfinished plant and grow it
              tierParticles.forEach(function(pp){if(pp.type==='plant'&&Math.abs(pp.x-tx)<20&&pp.size<pp.maxSize)pp.size=Math.min(pp.size+2,pp.maxSize);});
            }
          } else if(p2.type==='star'){
            var tw=0.3+0.3*Math.abs(Math.sin(frame*0.02+p2.twinkle));
            c2.fillStyle='rgba(200,200,255,'+tw+')';
            c2.beginPath();c2.arc(p2.x,p2.y,p2.r,0,Math.PI*2);c2.fill();
          } else if(p2.type==='stream'){
            p2.x+=p2.vx;p2.y+=Math.sin(frame*0.015+p2.phase)*0.4;
            if(p2.x>cw+20)p2.x=-20;
            c2.beginPath();c2.moveTo(p2.x,p2.y);c2.lineTo(p2.x-p2.len,p2.y);
            c2.strokeStyle='rgba(59,130,246,0.3)';c2.lineWidth=1;c2.lineCap='round';c2.stroke();
          } else if(p2.type==='ufo'){
            p2.x+=p2.vx;
            p2.y+=Math.sin(frame*0.03+p2.wobble)*0.5;
            if(p2.x>cw+40)p2.x=-40;
            var ux=p2.x,uy=p2.y;
            // Saucer body
            c2.fillStyle='rgba(150,150,180,0.6)';
            c2.beginPath();c2.ellipse(ux,uy,12,4,0,0,Math.PI*2);c2.fill();
            // Dome
            c2.fillStyle='rgba(100,200,255,0.4)';
            c2.beginPath();c2.ellipse(ux,uy-3,6,5,0,Math.PI,Math.PI*2);c2.fill();
            // Lights
            var lc=['rgba(255,50,50,0.7)','rgba(50,255,50,0.7)','rgba(50,50,255,0.7)'];
            for(var li=0;li<3;li++){
              var la=(frame*0.05+li*2.1)%(Math.PI*2);
              c2.fillStyle=lc[li];
              c2.beginPath();c2.arc(ux+Math.cos(la)*8,uy+Math.sin(la)*2,1.5,0,Math.PI*2);c2.fill();
            }
            // Beam (occasional)
            if(Math.sin(frame*0.02+p2.wobble)>0.7){
              c2.fillStyle='rgba(100,255,200,0.08)';
              c2.beginPath();c2.moveTo(ux-4,uy+4);c2.lineTo(ux+4,uy+4);c2.lineTo(ux+10,ch);c2.lineTo(ux-10,ch);c2.fill();
            }
            // Alien eyes in dome
            c2.fillStyle='rgba(0,255,100,0.7)';
            c2.beginPath();c2.arc(ux-2,uy-4,1,0,Math.PI*2);c2.fill();
            c2.beginPath();c2.arc(ux+2,uy-4,1,0,Math.PI*2);c2.fill();
          } else if(p2.type==='streak'){
            p2.x+=p2.vx;p2.y+=p2.vy;
            if(p2.x>cw+30){p2.x=-30;p2.y=Math.random()*ch;}
            var lg2=c2.createLinearGradient(p2.x,p2.y,p2.x-p2.len,p2.y);
            lg2.addColorStop(0,'rgba(249,115,22,'+p2.bright+')');lg2.addColorStop(1,'rgba(239,68,68,0)');
            c2.beginPath();c2.moveTo(p2.x,p2.y);c2.lineTo(p2.x-p2.len,p2.y);
            c2.strokeStyle=lg2;c2.lineWidth=1.5;c2.lineCap='round';c2.stroke();
          } else if(p2.type==='rocket'){
            p2.x+=p2.vx;p2.y+=p2.vy+Math.sin(frame*0.04)*0.3;
            if(p2.x>cw+50){p2.x=-50;p2.y=10+Math.random()*40;}
            var rx=p2.x,ry=p2.y;
            // Exhaust trail
            p2.exhaust.push({x:rx-8,y:ry,life:20,sz:2+Math.random()*2});
            if(p2.exhaust.length>25)p2.exhaust.shift();
            p2.exhaust.forEach(function(ex){
              ex.x-=0.5;ex.life--;
              var ea=ex.life/20;
              c2.fillStyle='rgba(255,'+Math.round(150*ea)+',50,'+ea*0.5+')';
              c2.beginPath();c2.arc(ex.x,ex.y+(Math.random()-0.5)*2,ex.sz*ea,0,Math.PI*2);c2.fill();
            });
            p2.exhaust=p2.exhaust.filter(function(ex){return ex.life>0;});
            // Rocket body
            c2.fillStyle='rgba(200,200,210,0.8)';
            c2.beginPath();c2.moveTo(rx+10,ry);c2.lineTo(rx-4,ry-4);c2.lineTo(rx-4,ry+4);c2.closePath();c2.fill();
            // Nose cone
            c2.fillStyle='rgba(239,68,68,0.8)';
            c2.beginPath();c2.moveTo(rx+10,ry);c2.lineTo(rx+16,ry);c2.lineTo(rx+10,ry-2);c2.closePath();c2.fill();
            c2.beginPath();c2.moveTo(rx+10,ry);c2.lineTo(rx+16,ry);c2.lineTo(rx+10,ry+2);c2.closePath();c2.fill();
            // Fins
            c2.fillStyle='rgba(249,115,22,0.7)';
            c2.beginPath();c2.moveTo(rx-4,ry-4);c2.lineTo(rx-8,ry-7);c2.lineTo(rx-4,ry-2);c2.fill();
            c2.beginPath();c2.moveTo(rx-4,ry+4);c2.lineTo(rx-8,ry+7);c2.lineTo(rx-4,ry+2);c2.fill();
            // Window
            c2.fillStyle='rgba(100,200,255,0.6)';
            c2.beginPath();c2.arc(rx+4,ry,1.5,0,Math.PI*2);c2.fill();
            // Engine glow
            c2.fillStyle='rgba(255,200,50,0.6)';
            c2.beginPath();c2.arc(rx-6,ry,3,0,Math.PI*2);c2.fill();
          }
        });
        tierAnimId=requestAnimationFrame(drawTier);
      }
      drawTier();
    }

    function completeTierSwitch(){
      if(!pendingTier)return;
      activeTier=pendingTier;
      pendingTier=null;
      tierTransitioning=false;
      render();
      startTierAnimation();
      if(typeof dock!=='undefined'&&dock.setConfig)dock.setConfig('speedTier',activeTier);
    }

    // Track active tasks for graceful tier switching
    function taskStarted(){activeTasks++;}
    function taskCompleted(){
      activeTasks=Math.max(0,activeTasks-1);
      if(activeTasks===0&&pendingTier){completeTierSwitch();}
    }

    function stopTierAnimation(){
      if(tierAnimId){cancelAnimationFrame(tierAnimId);tierAnimId=null;}
    }

    function budgetMetersHTML(){
      if(meterStyle==='radial'&&premiumUnlocked){
        return`<div class="tile-grid cols-${tileCols}">${tileOrder.map(t=>{const d=TB[t];if(!d)return'';const p=pct(d.used,d.cap);return radialGauge(t,p,d.used,d.cap,d.req);}).join('')}</div>`;
      }
      return tileOrder.map(t=>{const d=TB[t];if(!d)return'';const p=pct(d.used,d.cap);const alive=d.used>0?'active':'idle';const hasIO=d.inputTokens>0||d.outputTokens>0;const inPct=d.used>0?Math.round(d.inputTokens/d.used*100):50;const outPct=100-inPct;const ioLabel=hasIO?'<span class="mr-io">'+fmt(d.inputTokens)+' in / '+fmt(d.outputTokens)+' out</span>':'';const barInner=hasIO?'<div class="mr-bar-stack" style="width:'+Math.max(p,2)+'%"><div class="mr-bar-in" style="width:'+inPct+'%"></div><div class="mr-bar-out" style="width:'+outPct+'%"></div></div>':'<div class="mr-fill '+bc(p)+' '+alive+'" style="width:'+Math.max(p,2)+'%"></div>';return`
        <div class="mr"><span class="mr-name">${t}</span><div class="mr-bar">${barInner}</div><div class="mr-stats">${d.req?'<span class="mr-req">'+d.req+' req</span>':''}${ioLabel}<span class="mr-val">${fmt(d.used)}/${fmt(d.cap)}</span><span class="mr-pct ${pc(p)}">${p}%</span></div></div>`;}).join('');
    }

    function sectionHTML(id,tu,tc,tr,on,mc){
      const meterToggle=premiumUnlocked?`<div class="meter-toggle"><button class="meter-toggle-btn ${meterStyle==='bar'?'active':''}" data-action="setMeterBar">Bars</button><button class="meter-toggle-btn ${meterStyle==='radial'?'active':''}" data-action="setMeterRadial">Radial</button></div>`:'';
      const colToggle=premiumUnlocked&&meterStyle==='radial'?`<div class="meter-toggle" style="margin-left:0.3em"><button class="meter-toggle-btn ${tileCols===1?'active':''}" data-action="setCols1">1</button><button class="meter-toggle-btn ${tileCols===2?'active':''}" data-action="setCols2">2</button><button class="meter-toggle-btn ${tileCols===4?'active':''}" data-action="setCols4">4</button></div>`:'';

      const sections={
        speed:{weight:2,label:'Speed Tier',html:speedTierHTML()},
        budgets:{weight:3,label:'Task Budgets <span class="live-indicator"><span class="li-dot '+(budgetConnOk?'connected':'disconnected')+'"></span><span class="li-text'+(budgetConnOk?'':' disconnected')+'" id="budget-ts">'+(budgetConnOk?'Connected \u00b7 '+budgetAgo():'Disconnected')+'</span></span>',extra:meterToggle+colToggle,html:budgetMetersHTML()},
        providers:{weight:2,label:'Free Providers',html:`
          ${Object.entries(P).map(([pid,p])=>{
            var provStatus=ps[pid]||'unknown';
            return`<div class="pr" style="flex-direction:column;align-items:stretch">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div class="pr-left">
                  <span class="pr-dot ${provStatus}"></span>
                  <span class="pr-name">${p.n}</span>
                  <span class="pr-meta">${p.m.length} models · ${p.lim?fmt(p.lim)+' '+p.u:p.u}</span>
                </div>
                <span class="pr-tier t-${p.t==='unlimited'?'unlim':'free'}">${p.t==='unlimited'?'local':'free'}</span>
              </div>
              <div class="pr-models-list">
                ${p.m.map(function(mName){
                  var mKey=pid+'/'+mName;
                  var mTokens=modelUsage[mKey]||0;
                  var rate=MODEL_TOKEN_RATES[mKey]||0;
                  var saved=mTokens>0&&rate>0?'$'+(mTokens/1000*rate).toFixed(2)+' saved':'';
                  var tokenLabel=mTokens>0?fmt(mTokens)+' est.':'0';
                  return'<div class="pr-model-row"><div class="pr-model-left"><span class="pr-model-dot '+provStatus+'"></span><span class="pr-model-name">'+mName+'</span></div><span class="pr-model-tokens">'+(saved?'<span style="color:var(--green)">'+saved+'</span> \u00b7 ':'')+tokenLabel+'</span></div>';
                }).join('')}
              </div>
              <div class="pr-reset">
                <span><span class="pr-reset-label">Resets: </span><span class="reset-time">${timeUntilReset(pid)}</span></span>
                <span><span class="pr-reset-label">Checked: </span><span class="check-time">${lastCheckedAgo()}</span></span>
              </div>
            </div>`;
          }).join('')}`},
        paid:{weight:2,label:`Paid · $${mc}/mo`,html:`
          ${SUBS.map(function(s){
            // Paid tokens are PRESERVED — free stack handles the work
            // "used" tracks what WOULD have been used without free routing
            var preservedPct=s.tokensPerMonth>0?Math.min(100,Math.round((s.tokensPerMonth-s.used)/s.tokensPerMonth*100)):100;
            var preserved=Math.max(0,s.tokensPerMonth-s.used);
            // Green = lots preserved, yellow = some used, red = heavy usage
            var barClass=preservedPct>60?'fill-green':preservedPct>30?'fill-yellow':'fill-red';
            // Only use paid tokens in Turbo mode — Economy and Standard use free only
            var tierNote=activeTier==='turbo'?'<span style="color:var(--orange);font-size:0.5em"> \u26a0 Turbo may use paid</span>':'<span style="color:var(--green);font-size:0.5em"> \u2713 Free routing active</span>';
            return'<div class="sr" style="flex-direction:column;align-items:stretch">'+
              '<div style="display:flex;align-items:center;justify-content:space-between">'+
                '<div class="sr-left">'+
                  '<div class="sr-icon" style="background:'+s.col+'">'+s.i+'</div>'+
                  '<div><div class="sr-name">'+s.n+'</div><div class="sr-plan">'+s.p+tierNote+'</div></div>'+
                '</div>'+
                '<div class="sr-cost">$'+s.c+'/mo</div>'+
              '</div>'+
              '<div class="sr-details">'+
                '<div class="sr-usage-bar"><div class="sr-usage-fill '+barClass+'" style="width:'+preservedPct+'%"></div></div>'+
                '<div class="sr-usage-row">'+
                  '<span><span class="left-val">'+fmt(preserved)+'</span> preserved</span>'+
                  '<span><span class="used-val">'+fmt(s.used)+'</span> used</span>'+
                  '<span>Resets: <span class="reset-val">'+daysUntilSubReset(s.resetDay)+'</span></span>'+
                '</div>'+
                '<div class="sr-usage-row" style="margin-top:0.1em">'+
                  (function(){var pace=tokenPace(s);return'<span>Daily pace: <span style="color:var(--accent)">'+fmt(pace.dailyBudget)+'/day</span></span>'+
                  '<span style="color:'+(pace.onPace?'var(--green)':'var(--yellow)')+'">'+
                  (pace.onPace?'\u2713 On pace':'\u26a0 Ahead of pace')+'</span>';})()+'</div>'+
                '<div class="sr-model-list">'+s.models.map(function(m){return'<span class="sr-model-tag">'+m+'</span>';}).join('')+'</div>'+
              '</div>'+
            '</div>';
          }).join('')}`},
      };
      const s=sections[id];
      return`<div class="flex-section" data-weight="${s.weight}" data-id="${id}">
        <div class="sh" data-action="togSection"><span class="drag-handle" title="Drag to reorder">&#8942;&#8942;</span><span class="ci">&#9660;</span> ${s.label}${s.extra||''}</div>
        <div class="cb" style="max-height:2000px">${s.html}</div>
      </div>`;
    }

    function render(){
      const c=document.getElementById('content');
      if(!c){console.error('NO CONTENT DIV');return;}
      try{
        // Estimate per-model token distribution from tier budgets
        modelUsage={};
        estimateModelTokens();
        const tu=Object.values(TB).reduce((a,b)=>a+b.used,0);
        const tc=Object.values(TB).reduce((a,b)=>a+b.cap,0);
        const tr=Object.values(TB).reduce((a,b)=>a+b.req,0);
        const mc=SUBS.reduce((a,b)=>a+b.c,0);
        const on=Object.values(ps).filter(s=>s==='online').length;

        var noData=!budgetLastUpdated;
        var connErr=budgetConnOk===false&&budgetLastUpdated>0;
        var loadCls=noData?' loading':'';
        var tokErrCls=connErr?' error':'';
        var tokVal=noData?'---':fmt(tu);
        var reqVal=noData?'---':tr;
        var savVal=noData?'---':'$'+(tu*.0003).toFixed(2);
        var remVal=noData?'---':fmt(tc-tu)+' remaining';

        let html='<div class="sg">';
        var totalIn=Object.values(TB).reduce(function(a,b){return a+b.inputTokens;},0);
        var totalOut=Object.values(TB).reduce(function(a,b){return a+b.outputTokens;},0);
        var ioLine=(totalIn>0||totalOut>0)?'<div class="ss io-split">'+fmt(totalIn)+' in / '+fmt(totalOut)+' out</div>':'';
        html+='<div class="sc'+loadCls+tokErrCls+'"><div class="sl">Tokens Today</div><div class="sv text-accent">'+tokVal+'</div>'+ioLine+'<div class="ss">'+remVal+'</div><canvas class="sparkline" id="sparkline-canvas" width="100" height="20"></canvas></div>';
        html+='<div class="sc'+loadCls+'"><div class="sl">Requests Today</div><div class="sv">'+reqVal+'</div><div class="ss">'+tr+' across all tiers</div></div>';
        html+='<div class="sc"><div class="sl">Monthly Paid</div><div class="cost-total">$'+mc+'</div><div class="ss">'+SUBS.length+' subs</div></div>';
        html+='<div class="sc'+loadCls+'"><div class="sl">Free Savings</div><div class="cost-saved">'+savVal+'</div><div class="ss savings-note">~$0.30/1K avg</div></div>';
        html+='</div>';

        sectionOrder.forEach(function(id){
          try{
            html+=sectionHTML(id,tu,tc,tr,on,mc);
          }catch(e2){
            html+='<div style="color:red;padding:0.5em;font-size:11px">Section "'+id+'" error: '+e2.message+'</div>';
          }
        });

        c.innerHTML=html;
        drawSparkline();
      }catch(e){
        c.innerHTML='<div style="color:red;padding:1em;font-size:11px;word-break:break-all">Render: '+e.message+'<br>'+e.stack+'</div>';
      }
    }

    function drawSparkline(){
      var cvs=document.getElementById('sparkline-canvas');
      if(!cvs)return;
      var ctx=cvs.getContext('2d');
      var w=cvs.width,h=cvs.height;
      ctx.clearRect(0,0,w,h);
      var data=usageHistory.map(function(e){return e.val;});
      if(data.length<2){var totalNow=Object.values(TB).reduce(function(a,b){return a+b.used;},0);data=[45000,62000,38000,85000,71000,92000,totalNow];}
      var max=Math.max.apply(null,data)||1;
      var step=w/(data.length-1);
      ctx.beginPath();
      ctx.strokeStyle='#22c55e';
      ctx.lineWidth=1.5;
      ctx.lineJoin='round';
      ctx.lineCap='round';
      for(var idx=0;idx<data.length;idx++){var x=idx*step;var y=h-((data[idx]/max)*(h-4))-2;if(idx===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
      ctx.stroke();
    }

    let appControlsOpen=false;
    function toggleAppControls(){
      appControlsOpen=!appControlsOpen;
      const el=document.getElementById('app-controls');
      if(el)el.style.display=appControlsOpen?'flex':'none';
    }

    function renderScale(id,filled,total){
      const el=document.getElementById(id);
      if(!el)return;
      const on='█'.repeat(filled);
      const off='▒'.repeat(total-filled);
      el.innerHTML=`<span style="color:var(--accent)">${on}</span><span style="color:var(--border)">${off}</span>`;
    }

    function adjustOpacity(delta){
      const raw=Math.round(appOpacity*100)+delta;
      const val=Math.max(20,Math.min(100,raw));
      appOpacity=val/100;
      document.getElementById('opacity-val').textContent=val+'%';
      renderScale('opacity-scale',Math.round((val-20)/8),10);
      if(typeof dock!=='undefined')dock.setOpacity(appOpacity);
    }

    function toggleShimmerBtn(){
      shimmerOn=!shimmerOn;
      const btn=document.getElementById('shimmer-btn');
      if(btn){btn.textContent=shimmerOn?'ON':'OFF';btn.classList.toggle('on',shimmerOn);}
      document.querySelectorAll('.shimmer-overlay').forEach(el=>el.classList.toggle('active',shimmerOn));
      document.getElementById('shimmer-controls').style.display=shimmerOn?'flex':'none';
      document.getElementById('shimmer-speed-ctrl').style.display=shimmerOn?'flex':'none';
    }

    function adjustShimmerInt(delta){
      const raw=Math.round(shimmerIntensity*100)+delta;
      const val=Math.max(1,Math.min(15,raw));
      shimmerIntensity=val/100;
      document.getElementById('shimmer-int-val').textContent=val;
      renderScale('shimmer-int-scale',Math.round(val/15*10),10);
      document.documentElement.style.setProperty('--shimmer-intensity',(val/100).toFixed(3));
    }

    function adjustShimmerSpd(delta){
      shimmerSpeed=Math.max(0.5,Math.min(5,shimmerSpeed+delta));
      const s=shimmerSpeed;
      document.getElementById('shimmer-spd-val').textContent=s.toFixed(1)+'s';
      renderScale('shimmer-spd-scale',Math.round((s-0.5)/4.5*10),10);
      document.documentElement.style.setProperty('--shimmer-speed',s+'s');
    }

    function updatePremiumLocks(){
      var sLock=document.getElementById('shimmer-lock');
      var rLock=document.getElementById('rain-lock');
      var aLock=document.getElementById('animbg-lock');
      var sBtn=document.getElementById('shimmer-btn');
      var rBtn=document.getElementById('rain-btn');
      var aBtn=document.getElementById('animbg-btn');
      if(sLock)sLock.style.display=premiumUnlocked?'none':'';
      if(rLock)rLock.style.display=premiumUnlocked?'none':'';
      if(aLock)aLock.style.display=premiumUnlocked?'none':'';
      if(sBtn)sBtn.classList.toggle('dimmed',!premiumUnlocked);
      if(rBtn)rBtn.classList.toggle('dimmed',!premiumUnlocked);
      if(aBtn)aBtn.classList.toggle('dimmed',!premiumUnlocked);
      // Hide anim bg sub-controls when locked
      var aspd=document.getElementById('animbg-speed-ctrl');
      var aint=document.getElementById('animbg-int-ctrl');
      if(!premiumUnlocked){if(aspd)aspd.style.display='none';if(aint)aint.style.display='none';}
    }

    // ── GLOBAL EVENT DELEGATION ──
    // One listener handles ALL interactions. No inline handlers needed.
    // Works reliably in transparent Electron windows.
    function wireAll(){
      // Electron transparent window on Windows: mouseup sometimes doesn't fire on
      // buttons (especially inside panels that were initially display:none).
      // Fix: listen on mousedown + mouseup + click and debounce per-element so only
      // the first event that fires within 200ms actually runs the action.
      var _actionCooldown=new WeakMap();

      function handleAction(e){
        var el=e.target.closest('[data-action]');
        if(!el)return;
        // Per-element debounce: skip if this element fired within last 200ms
        var now=Date.now();
        var last=_actionCooldown.get(el)||0;
        if(now-last<200)return;
        _actionCooldown.set(el,now);

        var a=el.dataset.action;
        e.stopPropagation();

        var actions={
          // Titlebar
          'setTier':function(){
            var tier=el.dataset.tier;
            if(!tier||!SPEED_TIERS[tier]||tier===activeTier)return;
            if(activeTasks>0){
              // Tasks still running — queue the switch
              pendingTier=tier;
              tierTransitioning=true;
              render();
              // Check every 500ms if tasks finished
              var checkDone=setInterval(function(){
                if(activeTasks<=0){
                  clearInterval(checkDone);
                  completeTierSwitch();
                }
              },500);
              // Safety timeout — force switch after 10s even if tasks hang
              setTimeout(function(){
                if(pendingTier===tier){clearInterval(checkDone);completeTierSwitch();}
              },10000);
            } else {
              // No tasks running — switch immediately
              activeTier=tier;pendingTier=null;tierTransitioning=false;
              render();startTierAnimation();
              if(typeof dock!=='undefined'&&dock.setSpeedTier)dock.setSpeedTier(tier);
            }
          },
          'dockToClaude':function(){
            if(typeof dock!=='undefined'){
              dock.dockToClaude();
              // Auto-switch to Claude theme
              selectTheme('claude');
              var sel=document.getElementById('theme-select');
              if(sel)sel.value='claude';
            }
          },
          'toggleDonate':function(){toggleDonate();},
          'toggleSettings':function(){toggleSettings();},
          'togglePin':function(){if(typeof dock!=='undefined')dock.toggleAlwaysOnTop().then(function(v){el.style.color=v?'var(--accent)':'';});},
          'minimizeBubble':function(){if(typeof dock!=='undefined')dock.minimizeToBubble();},
          'hideToTray':function(){if(typeof dock!=='undefined')dock.hideWindow();},
          // Appearance controls
          'appearance':function(){toggleAppControls();},
          // Section collapse
          'togSection':function(){var cb=el.nextElementSibling;if(!cb)return;if(cb.style.maxHeight==='0px'){cb.style.maxHeight='2000px';el.querySelector('.ci').innerHTML='&#9660;';}else{cb.style.maxHeight='0px';el.querySelector('.ci').innerHTML='&#9654;';}},
          // Meter style
          'setMeterBar':function(){setMeterStyle('bar');},
          'setMeterRadial':function(){setMeterStyle('radial');},
          'setCols1':function(){setTileCols(1);},
          'setCols2':function(){setTileCols(2);},
          'setCols4':function(){setTileCols(4);},
          // Settings
          'toggleKeyVis':function(){var inp=el.parentElement.querySelector('input');if(inp){if(inp.type==='password'){inp.type='text';el.innerHTML='&#128064;';}else{inp.type='password';el.innerHTML='&#128065;';}}},
          'removeKeyRow':function(){var row=el.closest('.custom-key-row');if(row)row.remove();},
          'addCustomKey':function(){addCustomKey();},
          'saveSettings':function(){saveSettings();},
          // Donate
          'donate-paypal':function(){openDonate();},
          'donate-btc':function(){donateBTC();},
          'premium-unlock':function(){togglePremium();},
          // Appearance controls
          'opDown':function(){adjustOpacity(-10);},
          'opUp':function(){adjustOpacity(10);},
          'animBgToggle':function(){
            if(!premiumUnlocked){toggleDonate();return;}
            animBgOn=!animBgOn;
            document.documentElement.style.setProperty('--anim-state',animBgOn?'running':'paused');
            var btn=document.getElementById('animbg-btn');
            if(btn){btn.textContent=animBgOn?'ON':'OFF';btn.classList.toggle('on',animBgOn);}
            document.getElementById('animbg-speed-ctrl').style.display=animBgOn?'flex':'none';
            document.getElementById('animbg-int-ctrl').style.display=animBgOn?'flex':'none';
          },
          'animBgSpdDown':function(){
            animBgSpeed=Math.max(0.2,animBgSpeed-0.2);
            document.documentElement.style.setProperty('--anim-speed',animBgSpeed.toFixed(1));
            document.getElementById('animbg-spd-val').textContent=animBgSpeed.toFixed(1)+'x';
            renderScale('animbg-spd-scale',Math.round((animBgSpeed-0.2)/2.8*10),10);
          },
          'animBgSpdUp':function(){
            animBgSpeed=Math.min(3,animBgSpeed+0.2);
            document.documentElement.style.setProperty('--anim-speed',animBgSpeed.toFixed(1));
            document.getElementById('animbg-spd-val').textContent=animBgSpeed.toFixed(1)+'x';
            renderScale('animbg-spd-scale',Math.round((animBgSpeed-0.2)/2.8*10),10);
          },
          'animBgIntDown':function(){
            animBgIntensity=Math.max(0.2,animBgIntensity-0.2);
            document.documentElement.style.setProperty('--anim-intensity',animBgIntensity.toFixed(1));
            document.getElementById('animbg-int-val').textContent=animBgIntensity.toFixed(1)+'x';
            renderScale('animbg-int-scale',Math.round((animBgIntensity-0.2)/2.8*10),10);
          },
          'animBgIntUp':function(){
            animBgIntensity=Math.min(3,animBgIntensity+0.2);
            document.documentElement.style.setProperty('--anim-intensity',animBgIntensity.toFixed(1));
            document.getElementById('animbg-int-val').textContent=animBgIntensity.toFixed(1)+'x';
            renderScale('animbg-int-scale',Math.round((animBgIntensity-0.2)/2.8*10),10);
          },
          'shimmerToggle':function(){if(!premiumUnlocked){toggleDonate();return;}toggleShimmerBtn();},
          'rainToggle':function(){if(!premiumUnlocked){toggleDonate();return;}
            var btn=document.getElementById('rain-btn');
            if(themeRainOn){stopThemeRain();if(btn){btn.textContent='OFF';btn.classList.remove('on');}document.getElementById('rain-speed-ctrl').style.display='none';}
            else{if(!THEME_RAIN_CONFIG[curTheme])return;startThemeRain();if(btn){btn.textContent='ON';btn.classList.add('on');}document.getElementById('rain-speed-ctrl').style.display='flex';}
          },
          'rsDown':function(){adjustThemeRainSpeed(-0.3);},
          'rsUp':function(){adjustThemeRainSpeed(0.3);},
          'siDown':function(){adjustShimmerInt(-2);},
          'siUp':function(){adjustShimmerInt(2);},
          'ssDown':function(){adjustShimmerSpd(-0.5);},
          'ssUp':function(){adjustShimmerSpd(0.5);},
        };

        if(actions[a])actions[a]();
      }

      // Register all three event types — on Windows transparent Electron,
      // mousedown is most reliable, but we add all three for full coverage.
      document.addEventListener('mousedown',handleAction);
      document.addEventListener('mouseup',handleAction);
      document.addEventListener('click',handleAction);

      // Select changes via change event
      document.addEventListener('change',function(e){
        if(e.target.id==='auto-hide-select'){
          if(typeof dock!=='undefined')dock.setAutoHide(+e.target.value);
          e.target.classList.toggle('active', e.target.value !== '0');
        }
        if(e.target.id==='effect-select'){
          selectEffect(e.target.value);
        }
        if(e.target.id==='theme-select'){
          selectTheme(e.target.value);
        }
      });

      // All buttons now use data-action delegation above — no wire() needed
    }

    function setMeterStyle(s){meterStyle=s;render();}
    function setTileCols(n){tileCols=n;render();}

    // Tile drag & drop reorder (radial gauges)
    let tileDragName=null;
    function tileStart(e){tileDragName=e.currentTarget.dataset.tile;e.currentTarget.classList.add('dragging');e.dataTransfer.effectAllowed='move';}
    function tileOver(e){e.preventDefault();e.dataTransfer.dropEffect='move';const t=e.currentTarget.closest('.radial-tile');if(t&&t.dataset.tile!==tileDragName)t.classList.add('drag-over');}
    function tileDrop(e){e.preventDefault();const t=e.currentTarget.closest('.radial-tile');if(!t)return;const target=t.dataset.tile;if(target===tileDragName)return;const from=tileOrder.indexOf(tileDragName);const to=tileOrder.indexOf(target);tileOrder.splice(from,1);tileOrder.splice(to,0,tileDragName);render();}
    function tileEnd(e){document.querySelectorAll('.radial-tile').forEach(el=>{el.classList.remove('dragging','drag-over');});tileDragName=null;}

    // Section drag & drop reorder
    let dragId=null;
    function dragStart(e){
      dragId=e.currentTarget.dataset.id;
      e.currentTarget.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
    }
    function dragOver(e){
      e.preventDefault();
      e.dataTransfer.dropEffect='move';
      const target=e.currentTarget.closest('.flex-section');
      if(target&&target.dataset.id!==dragId)target.classList.add('drag-over');
    }
    function dropSection(e){
      e.preventDefault();
      const target=e.currentTarget.closest('.flex-section');
      if(!target)return;
      const targetId=target.dataset.id;
      if(targetId===dragId)return;
      const fromIdx=sectionOrder.indexOf(dragId);
      const toIdx=sectionOrder.indexOf(targetId);
      sectionOrder.splice(fromIdx,1);
      sectionOrder.splice(toIdx,0,dragId);
      render();
    }
    function dragEnd(e){
      document.querySelectorAll('.flex-section').forEach(el=>{el.classList.remove('dragging','drag-over');});
      dragId=null;
    }

    // Donate
    let donateClicked = false;
    let donateOpenTime = 0;
    let donateTimer = null;
    let donateSecondsLeft = 25;

    function selectEffect(val){
      if(PREMIUM_EFFECTS.includes(val)&&!premiumUnlocked){
        toggleDonate();
        document.getElementById('effect-select').value=currentEffect;
        return;
      }
      currentEffect=val;
    }

    function togglePremium(){
      const elapsed = (Date.now() - donateOpenTime) / 1000;
      const btn = document.getElementById('premium-toggle');
      const label = document.getElementById('premium-label');

      // Block unless they clicked donate AND spent 25s+
      if (!premiumUnlocked && (!donateClicked || elapsed < 25)) {
        if (!donateClicked) {
          const db = document.querySelector('.donate-btn.paypal');
          if (db) { db.style.animation = 'none'; db.offsetHeight; db.style.animation = 'pulseBtn 0.5s ease 3'; }
          if (label) label.textContent = 'Click donate first';
        } else {
          if (label) label.textContent = 'Please wait a moment...';
        }
        return;
      }

      premiumUnlocked = !premiumUnlocked;
      if (btn) { btn.textContent = premiumUnlocked ? 'UNLOCKED' : 'LOCKED'; btn.classList.toggle('on', premiumUnlocked); btn.classList.remove('dimmed'); }
      if(typeof dock!=='undefined'&&dock.setPremium) dock.setPremium(premiumUnlocked);
      document.body.classList.toggle('premium-unlocked',premiumUnlocked);
      renderTP();
      updatePremiumLocks();

      // Thank You flow when unlocking
      if(premiumUnlocked){
        if (label) label.textContent = 'Thank You! \u2764\ufe0f';
        // Switch to hearts theme with rain
        selectTheme('hearts');
        var ts=document.getElementById('theme-select');
        if(ts)ts.value='hearts';
        // Start the hearts rain
        startThemeRain();
        var rainBtn=document.getElementById('rain-btn');
        if(rainBtn){rainBtn.textContent='ON';rainBtn.classList.add('on');}
        var rsc2=document.getElementById('rain-speed-ctrl');
        if(rsc2)rsc2.style.display='flex';
        // After 5 seconds, update label to normal
        setTimeout(function(){
          var lbl=document.getElementById('premium-label');
          if(lbl&&premiumUnlocked)lbl.textContent='Premium content unlocked';
        },5000);
      } else {
        if (label) label.textContent = 'Click donate first';
      }

      if(!premiumUnlocked){
        // Reset premium effect to free one
        if(PREMIUM_EFFECTS.includes(currentEffect)){currentEffect='energy';}
        var sel=document.getElementById('effect-select');
        if(sel&&PREMIUM_EFFECTS.includes(sel.value)){sel.value='energy';}
        // Reset premium theme to free one
        if(PREMIUM_THEMES.includes(curTheme)){
          selectTheme('midnight');
        }
        // Stop rain if running
        if(themeRainOn){
          stopThemeRain();
          var rb=document.getElementById('rain-btn');
          if(rb){rb.textContent='OFF';rb.classList.remove('on');}
          var rsc=document.getElementById('rain-speed-ctrl');
          if(rsc)rsc.style.display='none';
        }
        // Dim the button again — use CSS class, NEVER inline opacity
        if(btn)btn.classList.add('dimmed');
      }
    }

    function startDonateCountdown(){
      donateOpenTime = Date.now();
      donateSecondsLeft = 25;
      updateDonateCountdown();
      if (donateTimer) clearInterval(donateTimer);
      donateTimer = setInterval(updateDonateCountdown, 1000);
    }

    function updateDonateCountdown(){
      const elapsed = Math.floor((Date.now() - donateOpenTime) / 1000);
      donateSecondsLeft = Math.max(0, 25 - elapsed);
      const btn = document.getElementById('premium-toggle');
      const label = document.getElementById('premium-label');
      if (donateSecondsLeft > 0 || !donateClicked) {
        // Use filter:brightness instead of opacity — opacity breaks hit-testing in transparent Electron
        if (btn && !premiumUnlocked) btn.style.filter = donateClicked ? 'brightness('+(0.4 + (0.6 * (1 - donateSecondsLeft / 25))).toFixed(2)+')' : 'brightness(0.4)';
        if (label && !donateClicked) label.textContent = 'Click donate first';
        else if (label && !premiumUnlocked) label.textContent = 'Unlocking in ' + donateSecondsLeft + 's...';
      } else {
        if (btn) { btn.style.filter = ''; btn.classList.remove('dimmed'); btn.style.animation = 'pulseBtn 0.6s ease 2'; }
        if (label && !premiumUnlocked) label.textContent = 'Click to unlock premium!';
        if (donateTimer) { clearInterval(donateTimer); donateTimer = null; }
      }
    }

    // ── Theme Rain System ──
    let themeRainInterval=null;
    let themeRainOn=false;
    let themeRainSpeed=1; // 1=normal, lower=faster

    const HEART_CHARS=['❤','♥','💕','💖','💗','💓','💘','💝','♡','❤️'];
    const HEART_COLORS=[
      '#ff1a1a','#ff3333','#ff4d4d','#ff6666','#ff8080',
      '#ff9999','#ffb3b3','#ffcccc','#e60000','#cc0000',
      '#ff0040','#ff3366','#ff6685','#ff99a8','#ffccd5',
      '#d4003a','#e6194B','#ff4466','#ff7788','#ffaabc',
    ];

    const THEME_RAIN_CONFIG={
      // Free themes — simple themed particles
      midnight:{chars:['✨','💫','⭐','·','•','∘'],colors:['#3b82f6','#60a5fa','#93c5fd','#2563eb','#1d4ed8','#dbeafe']},
      cobalt:{chars:['💧','·','•','∘','✦','◈'],colors:['#00a2ff','#38bdf8','#0284c7','#7dd3fc','#0369a1','#bae6fd']},
      slate:{chars:['·','•','◦','∘','◇','▫'],colors:['#78909c','#90a4ae','#b0bec5','#607d8b','#546e7a','#cfd8dc']},
      amethyst:{chars:['💜','✨','◆','·','•','✦'],colors:['#b07cd8','#9333ea','#a855f7','#c084fc','#7c3aed','#e9d5ff']},
      carbon:{chars:['🔥','·','•','◆','✦','▪'],colors:['#ff5722','#ef4444','#f97316','#fb923c','#dc2626','#fca5a1']},
      claude:{chars:['◈','·','•','◆','✦','▫'],colors:['#d4794a','#c2702f','#e8a06a','#b5693a','#f0b88a','#a85d2e']},
      // Premium themes — rich themed particles
      hearts:{
        chars:HEART_CHARS,
        colors:HEART_COLORS,
      },
      galaxy:{
        chars:['🌌','⭐','🪐','☄️','🌠','🛸','💫','✨','🌙','🔭'],
        colors:['#8b5cf6','#c084fc','#38bdf8','#ec4899','#a78bfa','#7dd3fc','#f0abfc','#818cf8','#6366f1','#e879f9'],
      },
      catppuccin:{
        chars:['🐱','🐾','✨','💜','🌸','🫧','🧶','💤','☁️','🌙'],
        colors:['#cba6f7','#f5c2e7','#94e2d5','#fab387','#a6e3a1','#89b4fa','#f38ba8','#f9e2af','#b4befe','#cdd6f4'],
      },
      dracula:{
        chars:['🦇','🧛','🕯️','⚰️','🌙','💀','🖤','🕸️','👻','🔮'],
        colors:['#bd93f9','#ff79c6','#8be9fd','#50fa7b','#ffb86c','#ff5555','#f1fa8c','#6272a4','#bd93f9','#ff79c6'],
      },
      tokyonight:{
        chars:['🏯','🌸','⛩️','🎌','🌃','🎐','🏮','💫','🌙','✨'],
        colors:['#7aa2f7','#bb9af7','#7dcfff','#ff9e64','#9ece6a','#f7768e','#e0af68','#c0caf5','#2ac3de','#73daca'],
      },
      rosepine:{
        chars:['🌹','🌿','🌸','🍃','🥀','🌺','💐','🪻','🌷','🌾'],
        colors:['#ebbcba','#c4a7e7','#9ccfd8','#f6c177','#eb6f92','#31748f','#e0def4','#c4a7e7','#ebbcba','#9ccfd8'],
      },
      synthwave:{
        chars:['🎹','🎸','📼','🕹️','💾','🌴','🌆','⚡','🎧','💎'],
        colors:['#ff7edb','#72f1b8','#fede5d','#f97e72','#ff7edb','#36f9f6','#ff7edb','#fede5d','#72f1b8','#f97e72'],
      },
    };

    // Donate hearts (separate from theme rain)
    let donateHeartsInterval=null;

    function spawnRainDrop(chars,colors){
      const rain=document.getElementById('theme-rain');
      if(!rain)return;
      const h=document.createElement('div');
      h.className='rain-drop';
      h.textContent=chars[Math.floor(Math.random()*chars.length)];
      const size=0.4+Math.random()*1.8;
      const color=colors[Math.floor(Math.random()*colors.length)];
      const duration=(2+Math.random()*5)*themeRainSpeed;
      const sway=Math.random()>0.5?'rainLeft':'rainRight';
      h.style.cssText=`left:${Math.random()*98}%;font-size:${size}em;color:${color};animation:${sway} ${duration}s linear;opacity:${0.3+Math.random()*0.5};text-shadow:0 0 ${Math.random()*4}px ${color};`;
      rain.appendChild(h);
      setTimeout(()=>h.remove(),(duration+1)*1000);
    }

    function startThemeRain(){
      const cfg=THEME_RAIN_CONFIG[curTheme];
      if(!cfg||!premiumUnlocked)return;
      const rain=document.getElementById('theme-rain');
      if(rain)rain.classList.add('active');
      stopThemeRain(true);
      for(let i=0;i<80;i++)setTimeout(()=>spawnRainDrop(cfg.chars,cfg.colors),i*25);
      themeRainInterval=setInterval(()=>{
        const batch=8+Math.floor(Math.random()*12);
        for(let i=0;i<batch;i++)setTimeout(()=>spawnRainDrop(cfg.chars,cfg.colors),i*15);
      },Math.max(30,60*themeRainSpeed));
      themeRainOn=true;
    }

    function stopThemeRain(keepActive){
      if(themeRainInterval){clearInterval(themeRainInterval);themeRainInterval=null;}
      themeRainOn=false;
      if(!keepActive){
        const rain=document.getElementById('theme-rain');
        if(rain)setTimeout(()=>{if(!themeRainOn)rain.classList.remove('active');},6000);
      }
    }

    function startDonateHearts(){
      const rain=document.getElementById('theme-rain');
      if(rain)rain.classList.add('active');
      if(donateHeartsInterval)clearInterval(donateHeartsInterval);
      for(let i=0;i<80;i++)setTimeout(()=>spawnRainDrop(HEART_CHARS,HEART_COLORS),i*25);
      donateHeartsInterval=setInterval(()=>{
        const batch=8+Math.floor(Math.random()*12);
        for(let i=0;i<batch;i++)setTimeout(()=>spawnRainDrop(HEART_CHARS,HEART_COLORS),i*15);
      },60);
    }

    function stopDonateHearts(){
      if(donateHeartsInterval){clearInterval(donateHeartsInterval);donateHeartsInterval=null;}
      if(!themeRainOn){
        const rain=document.getElementById('theme-rain');
        if(rain)setTimeout(()=>{if(!donateHeartsInterval&&!themeRainOn)rain.classList.remove('active');},6000);
      }
    }

    function adjustThemeRainSpeed(delta){
      themeRainSpeed=Math.max(0.3,Math.min(3,themeRainSpeed+delta));
      document.getElementById('rain-spd-val').textContent=themeRainSpeed<0.7?'Fast':themeRainSpeed<1.3?'Med':'Slow';
      renderScale('rain-spd-scale',Math.round((themeRainSpeed-0.3)/2.7*10),10);
      // Restart rain with new speed if running
      if(themeRainOn)startThemeRain();
    }

    function toggleDonate(){
      donateOpen=!donateOpen;
      const p=document.getElementById('donate-panel');
      if(p)p.classList.toggle('open',donateOpen);
      document.body.classList.toggle('hearts-mode',donateOpen);
      if(donateOpen)startDonateHearts();
      else stopDonateHearts();
      if (donateOpen) startDonateCountdown();
      else { if(donateTimer){clearInterval(donateTimer);donateTimer=null;} }
    }

    function openDonate(){
      donateClicked = true;
      updateDonateCountdown();
      var url=_DONATION_PAYPAL;
      if(typeof dock!=='undefined'){
        dock.openExternal(url);
      } else {
        window.open(url,'_blank');
      }
    }

    function donateBTC(){
      donateClicked = true;
      updateDonateCountdown();
      var addr=_DONATION_BTC;
      // Copy BTC address to clipboard and show confirmation
      if(navigator.clipboard){
        navigator.clipboard.writeText(addr).then(function(){
          var btn=document.querySelector('[data-action="donate-btc"]');
          if(btn){var orig=btn.textContent;btn.textContent='\u2713 Address copied!';setTimeout(function(){btn.textContent=orig;},2000);}
        });
      }
    }

    function tog(el){const b=el.nextElementSibling;if(!b)return;if(b.style.maxHeight==='0px'){b.style.maxHeight='2000px';el.querySelector('.ci').innerHTML='&#9660;';}else{b.style.maxHeight='0px';el.querySelector('.ci').innerHTML='&#9654;';}}

    if(typeof dock!=='undefined'&&dock.onDockState){
      dock.onDockState(s=>{
        if(s.minimized){document.body.classList.add('minimized');}
        else{document.body.classList.remove('minimized');}
      });
    }
    if(typeof dock!=='undefined'&&dock.onAutoHideChanged){
      dock.onAutoHideChanged(s=>{
        const sel=document.getElementById('auto-hide-select');
        if(sel){sel.value=s;sel.classList.toggle('active',String(s)!=='0');}
      });
    }
    if(typeof dock!=='undefined'&&dock.onSetTheme)dock.onSetTheme(t=>applyTheme(t));

    // Auto-hide warning bar: show 3s countdown before dock vanishes
    if(typeof dock!=='undefined'&&dock.onAutoHideWarning){
      dock.onAutoHideWarning(function(){
        var bar=document.getElementById('auto-hide-bar');
        if(bar){bar.style.display='block';bar.style.width='0%';void bar.offsetWidth;bar.style.width='100%';}
      });
    }
    // Reset auto-hide on any mousedown interaction in the dock
    document.addEventListener('mousedown',function(){
      var bar=document.getElementById('auto-hide-bar');
      if(bar&&bar.style.display==='block'){bar.style.display='none';bar.style.width='0%';}
      if(typeof dock!=='undefined'&&dock.resetAutoHideTimer)dock.resetAutoHideTimer();
    });

    async function init(){
      try{
        // Render immediately — don't wait for IPC
        renderTP();render();wireAll();wireBubble();updatePremiumLocks();startTierAnimation();

        // Then load data async
        if(typeof dock!=='undefined'){
          try{const t=await dock.getTheme();if(t)applyTheme(t);}catch(e){console.warn('theme:',e);}
          try{const ah=await dock.getAutoHide();const sel=document.getElementById('auto-hide-select');if(sel&&ah!=null){sel.value=ah;sel.classList.toggle('active',String(ah)!=='0');}}catch(e){console.warn('autohide:',e);}
          try{const prem=await dock.getPremium();if(prem){premiumUnlocked=true;document.body.classList.add('premium-unlocked');renderTP();}updatePremiumLocks();}catch(e){console.warn('premium:',e);}
          try{const savedTier=await dock.getSpeedTier();if(savedTier&&SPEED_TIERS[savedTier])activeTier=savedTier;}catch(e){console.warn('tier:',e);}
          try{await checkProviders();}catch(e){console.warn('providers:',e);}
          try{await loadBudget();}catch(e){console.warn('budget:',e);}
          try{await loadPaidUsage();}catch(e){console.warn('paid:',e);}
          render();
          checkFirstRun();
        }
        // Budget refresh every 30s
        setInterval(async()=>{try{if(typeof dock!=='undefined'){await loadBudget();await loadPaidUsage();SUBS.forEach(function(s){var pace=tokenPace(s);if(!pace.onPace&&s.used>0&&dock.sendNotification&&!notifiedSubs.has(s.n)){notifiedSubs.add(s.n);dock.sendNotification('Token Dock',s.n+': burning tokens faster than daily pace');}if(pace.onPace)notifiedSubs.delete(s.n);});}render();var luEl=document.getElementById('lu');if(luEl)luEl.textContent='now';requestAnimationFrame(function(){var cards=document.querySelectorAll('.sc');cards.forEach(function(card){card.classList.add('just-updated');});setTimeout(function(){cards.forEach(function(card){card.classList.remove('just-updated');});},500);});}catch(e){console.error(e);}},30000);
        // Provider health check every 60s (pings real APIs, don't spam)
        setInterval(async()=>{try{if(typeof dock!=='undefined'){await checkProviders();}render();}catch(e){console.error(e);}},60000);
        // Live indicator text update every 5s
        setInterval(function(){var el=document.getElementById('budget-ts');if(el)el.textContent=budgetConnOk?'Connected \u00b7 '+budgetAgo():'Disconnected';},5000);
      }catch(e){console.error(e);Object.keys(P).forEach(id=>{ps[id]='unknown';});renderTP();render();}
    }
    // ── Settings / Wizard ──
    const KEY_FIELDS = [
      { key:'GROQ_API_KEY', label:'Groq', hint:'console.groq.com/keys', prefix:'gsk_' },
      { key:'GEMINI_API_KEY', label:'Google Gemini', hint:'aistudio.google.com/apikey', prefix:'AIza' },
      { key:'OPENROUTER_API_KEY', label:'OpenRouter', hint:'openrouter.ai/keys', prefix:'sk-or-v1-' },
      { key:'HUGGINGFACE_API_KEY', label:'Hugging Face', hint:'huggingface.co/settings/tokens', prefix:'hf_' },
      { key:'MISTRAL_API_KEY', label:'Mistral', hint:'console.mistral.ai/api-keys', prefix:'' },
      { key:'OLLAMA_API_BASE', label:'Ollama URL', hint:'Default: http://localhost:11434', prefix:'http' },
    ];
    let settingsOpen = false;
    let flipping = false;
    let savedKeys = {};

    const FREE_EFFECTS=['energy','hearts','shamrocks','stars','fire','snow','sparkle'];
    const PREMIUM_EFFECTS=['confetti','lightning','sakura','matrix','diamonds'];

    const EFFECT_EMOJIS = {
      energy: null,
      hearts: ['❤️','💕','💖','💗','💓','💘','💝'],
      shamrocks: ['☘️','🍀','🌿','🌱','💚'],
      stars: ['⭐','🌟','✨','💫','⚡'],
      fire: ['🔥','🔥','💥','🧡','❤️‍🔥'],
      snow: ['❄️','🌨️','⛄','💎','🤍'],
      sparkle: ['✨','💎','🔮','⭐','💜','🪩'],
      // Premium
      confetti: ['🎉','🎊','🥳','🎈','🎀','🎁','🎊'],
      lightning: ['⚡','🌩️','💥','⚡','🔥','💫'],
      sakura: ['🌸','🌷','💮','🌺','🏵️','💐'],
      matrix: ['0','1','0','1','1','0','1','0'],
      diamonds: ['💎','💠','🔷','🔹','💍','👑'],
    };

    const MIST_COLORS = {
      energy: ['rgba(59,130,246,0.4)','rgba(99,170,255,0.3)','rgba(37,99,235,0.35)','rgba(147,197,253,0.25)'],
      hearts: ['rgba(239,68,108,0.4)','rgba(244,114,152,0.35)','rgba(251,73,131,0.3)','rgba(255,154,182,0.25)'],
      shamrocks: ['rgba(34,197,94,0.4)','rgba(74,222,128,0.35)','rgba(22,163,74,0.3)','rgba(134,239,172,0.25)'],
      stars: ['rgba(250,204,21,0.4)','rgba(253,224,71,0.35)','rgba(234,179,8,0.3)','rgba(254,240,138,0.25)'],
      fire: ['rgba(249,115,22,0.4)','rgba(239,68,68,0.35)','rgba(251,146,60,0.3)','rgba(254,202,102,0.25)'],
      snow: ['rgba(186,230,253,0.4)','rgba(224,242,254,0.35)','rgba(125,211,252,0.3)','rgba(255,255,255,0.25)'],
      sparkle: ['rgba(168,85,247,0.4)','rgba(192,132,252,0.35)','rgba(139,92,246,0.3)','rgba(216,180,254,0.25)'],
      galaxy: ['rgba(139,92,246,0.4)','rgba(56,189,248,0.35)','rgba(236,72,153,0.3)','rgba(192,132,252,0.25)'],
      confetti: ['rgba(255,100,100,0.35)','rgba(100,255,100,0.35)','rgba(100,100,255,0.35)','rgba(255,255,100,0.25)'],
      lightning: ['rgba(100,180,255,0.4)','rgba(255,255,255,0.3)','rgba(200,220,255,0.35)','rgba(100,150,255,0.25)'],
      sakura: ['rgba(255,183,197,0.4)','rgba(255,143,171,0.35)','rgba(255,200,210,0.3)','rgba(255,220,225,0.25)'],
      matrix: ['rgba(0,255,65,0.35)','rgba(0,200,50,0.3)','rgba(0,150,40,0.25)','rgba(0,255,65,0.2)'],
      diamonds: ['rgba(100,200,255,0.4)','rgba(180,220,255,0.35)','rgba(220,240,255,0.3)','rgba(140,200,255,0.25)'],
      catppuccin: ['rgba(203,166,247,0.35)','rgba(148,226,213,0.3)','rgba(250,179,135,0.3)','rgba(166,227,161,0.25)'],
      dracula: ['rgba(189,147,249,0.4)','rgba(255,121,198,0.35)','rgba(139,233,253,0.3)','rgba(80,250,123,0.25)'],
      tokyonight: ['rgba(122,162,247,0.4)','rgba(187,154,247,0.35)','rgba(125,207,255,0.3)','rgba(255,158,100,0.25)'],
      rosepine: ['rgba(235,188,186,0.35)','rgba(196,167,231,0.3)','rgba(156,207,216,0.3)','rgba(246,193,119,0.25)'],
      synthwave: ['rgba(255,126,219,0.4)','rgba(114,241,184,0.35)','rgba(254,222,93,0.3)','rgba(249,126,114,0.25)'],
    };

    function spawnMist() {
      const mist = document.getElementById('flip-mist');
      mist.innerHTML = '';
      const colors = MIST_COLORS[currentEffect] || MIST_COLORS.energy;
      for (let i = 0; i < 4; i++) {
        const layer = document.createElement('div');
        layer.className = 'mist-layer';
        const mx = -20 + Math.random() * 40;
        const my = -15 + Math.random() * 30;
        layer.style.cssText = `background:${colors[i]};--mx:${mx}px;--my:${my}px;`;
        mist.appendChild(layer);
      }
    }

    function spawnShards() {
      const edge = document.getElementById('flip-edge');
      // Remove old particles
      edge.querySelectorAll('.shard,.flutter').forEach(s => s.remove());
      spawnMist();

      if (currentEffect === 'energy') {
        // Energy shards
        for (let i = 0; i < 12; i++) {
          const shard = document.createElement('div');
          shard.className = 'shard';
          const top = Math.random() * 95;
          const height = 2 + Math.random() * 6;
          const delay = Math.random() * 0.15;
          shard.style.cssText = `top:${top}%;height:${height}%;animation-delay:${delay}s;`;
          edge.appendChild(shard);
        }
      } else {
        // Emoji flutter
        const emojis = EFFECT_EMOJIS[currentEffect] || ['✨'];
        const count = 15 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
          const el = document.createElement('div');
          el.className = 'flutter';
          el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
          const top = Math.random() * 90;
          const left = 35 + Math.random() * 30;
          const delay = Math.random() * 0.3;
          const dx1 = -30 + Math.random() * 60;
          const dy1 = -20 + Math.random() * 40;
          const dx2 = -50 + Math.random() * 100;
          const dy2 = -30 + Math.random() * 60;
          const dx3 = -80 + Math.random() * 160;
          const dy3 = -40 + Math.random() * 80;
          const r1 = -30 + Math.random() * 60;
          const r2 = -60 + Math.random() * 120;
          const r3 = -90 + Math.random() * 180;
          el.style.cssText = `top:${top}%;left:${left}%;animation-delay:${delay}s;font-size:${10+Math.random()*12}px;--dx1:${dx1}px;--dy1:${dy1}px;--dx2:${dx2}px;--dy2:${dy2}px;--dx3:${dx3}px;--dy3:${dy3}px;--r1:${r1}deg;--r2:${r2}deg;--r3:${r3}deg;`;
          edge.appendChild(el);
        }
      }
    }

    function toggleSettings() {
      if (flipping) return;
      flipping = true;
      // Safety fallback — always unlock after max animation duration
      setTimeout(function(){ flipping = false; }, 700);

      const fc = document.getElementById('flip-container');
      settingsOpen = !settingsOpen;
      spawnShards();

      if (settingsOpen) {
        renderSettings();
        fc.classList.add('flipping-out');
        setTimeout(() => {
          fc.classList.remove('flipping-out');
          fc.classList.add('show-back', 'flipping-in');
          setTimeout(() => { fc.classList.remove('flipping-in'); flipping = false; }, 300);
        }, 300);
      } else {
        fc.classList.add('flipping-out-back');
        setTimeout(() => {
          fc.classList.remove('flipping-out-back', 'show-back');
          fc.classList.add('flipping-in-back');
          setTimeout(() => { fc.classList.remove('flipping-in-back'); flipping = false; }, 300);
        }, 300);
      }
    }

    async function renderSettings() {
      savedKeys = typeof dock !== 'undefined' ? await dock.getKeys() : {};
      const isWizard = typeof dock !== 'undefined' ? await dock.isFirstRun() : true;
      const title = document.getElementById('settings-title');
      title.textContent = isWizard ? 'Setup Wizard' : 'Settings';

      const body = document.getElementById('settings-body');
      const filledCount = KEY_FIELDS.filter(f => savedKeys[f.key] && savedKeys[f.key].length > 3).length;

      body.innerHTML = `
        ${isWizard ? `
          <div class="wizard-step">Step 1 of 1 — Enter your free tier API keys</div>
          <div style="font-size:0.75em;color:var(--tm);margin-bottom:0.3em">
            Sign up for free at each provider (~10 min total), paste keys below.
          </div>
        ` : `
          <div style="font-size:0.75em;color:var(--tm)">${filledCount}/${KEY_FIELDS.length} providers configured</div>
        `}

        ${KEY_FIELDS.map(f => {
          const val = savedKeys[f.key] || '';
          const hasKey = val.length > 3;
          return `
            <div class="key-group">
              <label class="key-label">
                <span class="dot ${hasKey ? 'has-key' : 'no-key'}"></span>
                ${f.label}
              </label>
              <div style="display:flex;gap:0.3em;align-items:center">
                <input class="key-input" id="key-${f.key}" type="password"
                  placeholder="${f.prefix}..." value="${val}"
                  data-key="${f.key}" style="flex:1">
                <button class="settings-close" data-action="toggleKeyVis" title="Show/hide">&#128065;</button>
              </div>
              <div class="wizard-hint">${f.hint}</div>
            </div>
          `;
        }).join('')}

        <div class="settings-divider"></div>

        <div id="custom-keys-container">
          ${Object.entries(savedKeys).filter(([k]) => !KEY_FIELDS.some(f => f.key === k) && k !== 'LITELLM_MASTER_KEY' && k !== 'LITELLM_PORT').map(([k, v]) => `
            <div class="key-group custom-key-row">
              <div style="display:flex;gap:0.3em;align-items:center">
                <input class="key-input" style="flex:1" placeholder="KEY_NAME" value="${k}" data-custom-name>
                <button class="settings-close" data-action="removeKeyRow" title="Remove">&times;</button>
              </div>
              <div style="display:flex;gap:0.3em;align-items:center">
                <input class="key-input" type="password" placeholder="api-key-value..." value="${v}" data-custom-value style="flex:1">
                <button class="settings-close" data-action="toggleKeyVis" title="Show/hide">&#128065;</button>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="settings-btn secondary" data-action="addCustomKey" style="width:100%">+ Add LLM Provider Key</button>

        <div class="settings-divider"></div>

        <div style="display:flex;gap:0.4em">
          <button class="settings-btn" data-action="saveSettings" style="flex:1">
            ${isWizard ? 'Complete Setup' : 'Save Keys'}
          </button>
          <button class="settings-btn secondary" data-action="toggleSettings" style="flex:0.6">Cancel</button>
        </div>
        <span class="key-saved" id="key-saved">Saved!</span>
      `;

      // Update dots on input
      body.querySelectorAll('.key-input').forEach(input => {
        input.addEventListener('input', () => {
          const dot = input.closest('.key-group').querySelector('.dot');
          dot.className = 'dot ' + (input.value.length > 3 ? 'has-key' : 'no-key');
        });
      });
    }

    function toggleKeyVis(btn) {
      const input = btn.parentElement.querySelector('input');
      if (input.type === 'password') { input.type = 'text'; btn.innerHTML = '&#128064;'; }
      else { input.type = 'password'; btn.innerHTML = '&#128065;'; }
    }

    function addCustomKey() {
      const container = document.getElementById('custom-keys-container');
      const row = document.createElement('div');
      row.className = 'key-group custom-key-row';
      row.innerHTML = `
        <div style="display:flex;gap:0.3em;align-items:center">
          <input class="key-input" style="flex:1" placeholder="KEY_NAME (e.g. TOGETHER_API_KEY)" data-custom-name>
          <button class="settings-close" data-action="removeKeyRow" title="Remove">&times;</button>
        </div>
        <div style="display:flex;gap:0.3em;align-items:center">
          <input class="key-input" type="password" placeholder="api-key-value..." data-custom-value style="flex:1">
          <button class="settings-close" data-action="toggleKeyVis" title="Show/hide">&#128065;</button>
        </div>
      `;
      container.appendChild(row);
      row.querySelector('[data-custom-name]').focus();
    }

    async function saveSettings() {
      const keys = {};
      // Standard keys
      KEY_FIELDS.forEach(f => {
        const el = document.getElementById('key-' + f.key);
        if (el) keys[f.key] = el.value.trim();
      });
      // Custom keys
      document.querySelectorAll('.custom-key-row').forEach(row => {
        const name = row.querySelector('[data-custom-name]')?.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        const val = row.querySelector('[data-custom-value]')?.value.trim();
        if (name && val) keys[name] = val;
      });
      // Preserve system keys
      keys.LITELLM_MASTER_KEY = savedKeys.LITELLM_MASTER_KEY || 'sk-local-dev-key-change-me';
      keys.LITELLM_PORT = savedKeys.LITELLM_PORT || '4000';

      if (typeof dock !== 'undefined') {
        const ok = await dock.saveKeys(keys);
        if (ok) {
          const badge = document.getElementById('key-saved');
          if (badge) { badge.classList.add('show'); setTimeout(() => badge.classList.remove('show'), 2000); }
          await checkProviders();
          render();
        }
      }
    }

    // Auto-open wizard on first run
    async function checkFirstRun() {
      if (typeof dock !== 'undefined') {
        const first = await dock.isFirstRun();
        if (first) { settingsOpen = true; document.getElementById('flip-container').classList.add('show-back'); renderSettings(); }
      }
    }

    // ── Bubble drag + click logic ──
    let bubbleDragging = false;
    let bubbleStartX = 0, bubbleStartY = 0;
    let bubbleMoved = false;

    function wireBubble() {
      const tab = document.getElementById('edge-tab');
      if (!tab) return;

      tab.addEventListener('mousedown', function(e) {
        bubbleDragging = true;
        bubbleMoved = false;
        bubbleStartX = e.screenX;
        bubbleStartY = e.screenY;
        e.preventDefault();
      });

      document.addEventListener('mousemove', function(e) {
        if (!bubbleDragging) return;
        const dx = e.screenX - bubbleStartX;
        const dy = e.screenY - bubbleStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) bubbleMoved = true;
        if (bubbleMoved && typeof dock !== 'undefined') {
          dock.moveWindowBy(dx, dy);
          bubbleStartX = e.screenX;
          bubbleStartY = e.screenY;
        }
      });

      document.addEventListener('mouseup', function(e) {
        if (!bubbleDragging) return;
        if (!bubbleMoved && typeof dock !== 'undefined') {
          dock.restoreFromBubble();
        }
        bubbleDragging = false;
        bubbleMoved = false;
      });
    }

    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  