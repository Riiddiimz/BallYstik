/* Powers Final — moteur d'effets repris depuis idees/powers_final.html.
 * Les méthodes cast/update/render et les dessins viennent du fichier original.
 * Adaptateur de compatibilité vers les boules, dégâts et coordonnées de l'arène native.
 */
(function(){
'use strict';
window.AbilityBehaviors=window.AbilityBehaviors||{};
const TAU=Math.PI*2;
const CFG={respawn:1.5};
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const easeOut=t=>1-Math.pow(1-t,3);
let realWorld=null;
const state={projectiles:[],particles:[],shockwaves:[],decoys:[],beams:[],zones:[],damageTexts:[],shrapnels:[],novas:[],pendingCasts:[],time:0,shake:0,dpr:1};
const proxyCache=new WeakMap(), reverseProxy=new WeakMap(), baseRadiusCache=new WeakMap();
function proxyBall(ball){
 if(!ball||typeof ball!=='object')return ball;
 if(proxyCache.has(ball))return proxyCache.get(ball);
 if(!baseRadiusCache.has(ball))baseRadiusCache.set(ball,ball.baseRadius??ball.radius??ball.r??16);
 const p=new Proxy(ball,{get(t,k){
  if(k==='r')return t.radius??t.r??16;
  if(k==='baseR')return baseRadiusCache.get(t)??t.baseRadius??t.radius??t.r??16;
  if(k==='hp')return t.health?.current??t.hp??0;
  if(k==='maxHp')return t.health?.max??t.maxHp??100;
  if(k==='invuln')return t.health?.invuln??t.invuln??0;
  if(k==='_frozen')return t._frozen??!!(t.status?.has&&t.status.has('stun'));
  if(k==='respawnAt')return t.respawnAt??0;
  return t[k];
 },set(t,k,v){
  if(k==='r'){if('radius'in t)t.radius=v;else t.r=v;return true;}
  if(k==='baseR'){baseRadiusCache.set(t,v);t.baseRadius=v;return true;}
  if(k==='hp'){if(t.health)t.health.current=Math.max(0,Math.min(t.health.max,v));else t.hp=v;return true;}
  if(k==='maxHp'){if(t.health)t.health.max=v;else t.maxHp=v;return true;}
  if(k==='invuln'){if(t.health)t.health.invuln=v;else t.invuln=v;return true;}
  t[k]=v;return true;
 }});
 proxyCache.set(ball,p);reverseProxy.set(p,ball);return p;
}
function realBall(b){return reverseProxy.get(b)||b;}
const world={
 get balls(){return (realWorld?.balls||[]).map(proxyBall);},
 get arena(){const a=realWorld?.arena;if(!a)return {x:0,y:0,w:1,h:1,cx:.5,cy:.5,resolve(){}};return new Proxy(a,{get(t,k){if(k==='cx')return t.cx??(t.x+t.w/2);if(k==='cy')return t.cy??(t.y+t.h/2);return t[k];}});},
 get time(){return realWorld?.time??realWorld?.arena?.time??state.time;},
 get W(){return realWorld?.canvas?.width??realWorld?.arena?.canvas?.width??1080;},
 get H(){return realWorld?.canvas?.height??realWorld?.arena?.canvas?.height??1920;},
 get dpr(){return 1;},
 get projectiles(){return state.projectiles;},get particles(){return state.particles;},
 get shockwaves(){return state.shockwaves;},get decoys(){return state.decoys;},
 get beams(){return state.beams;},get zones(){return state.zones;},set zones(v){state.zones=v;},
 get damageTexts(){return state.damageTexts;},get shrapnels(){return state.shrapnels;},get novas(){return state.novas;},
 set shake(v){state.shake=v;},get shake(){return state.shake;},
 damage(target,attacker,amount,source,opts){const t=realBall(target),a=realBall(attacker);return realWorld?.damage?realWorld.damage(t,a,amount,source,{...(opts||{}),ignoreInvuln:!!opts?.ignoreInvuln}):0;},
};
function spawnDamageText(x,y,val,source){state.damageTexts.push({x,y,val:String(val),color:'#ffffff',life:.9,maxLife:.9,vx:rand(-20,20),vy:-110,scale:.4});}
function damageBall(b,amount,source,ignoreInvuln){if(!b?.alive)return 0;return world.damage(b,null,amount,source,{ignoreInvuln:!!ignoreInvuln});}
function killBall(b){const rb=realBall(b);if(rb&&rb.health&&realWorld?.damage)realWorld.damage(rb,null,rb.health.current+1,'powers_final',{ignoreInvuln:true});}
function burstParticles(x,y,color,count,speed,life){for(let i=0;i<count;i++){const a=Math.random()*TAU,s=speed*rand(.35,1);state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:life*rand(.6,1),maxLife:life,color,size:rand(1.5,3.5),drag:.94});}}
function trailParticle(x,y,color,speed,life,angle,spread){const a=angle+rand(-spread,spread),s=speed*rand(.5,1);state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:life*rand(.7,1),maxLife:life,color,size:rand(1.5,3),drag:.93});}
function nearestEnemy(ball,maxDist){const limit=maxDist==null?Infinity:maxDist;let best=null,bestD=limit*limit;for(const b of world.balls){if(b===ball||!b.alive)continue;const d=(b.x-ball.x)**2+(b.y-ball.y)**2;if(d<bestD){bestD=d;best=b;}}return best;}
function angleTo(a,b){return Math.atan2(b.y-a.y,b.x-a.x);}

const POWERS = {};

// ═══ 1. JUDGMENT RAY — ENHANCED ═══
POWERS.judgment_ray = {
  name:'Rayon du Jugement', icon:'⚡', color:'#67e8f9',
  desc:'Ligne laser instantanée qui traverse une cible.',
  cast(ball){
    const target = nearestEnemy(ball);
    if(!target) return;
    const ang = angleTo(ball, target);
    world.beams.push({
      x1: ball.x, y1: ball.y,
      x2: ball.x + Math.cos(ang)*2500*world.dpr,
      y2: ball.y + Math.sin(ang)*2500*world.dpr,
      life: 0.6, maxLife: 0.6,
      state: 'charge', chargeT: 0.4, chargeMax: 0.4,
      ownerId: ball.id, targetId: target.id, ang, chargeRingAngle: 0,
    });
  },
  update(dt){
    for(let i = world.beams.length-1; i>=0; i--){
      const b = world.beams[i];
      b.life -= dt;
      if(b.state === 'charge'){
        b.chargeT -= dt;
        b.chargeRingAngle = (b.chargeRingAngle || 0) + dt * 8;
        if(Math.random() < 0.8){
          const dx = Math.cos(b.ang), dy = Math.sin(b.ang);
          const along = rand(60, 400)*world.dpr;
          const perp = rand(-40,40)*world.dpr;
          world.particles.push({
            x: b.x1 + dx*along - dy*perp,
            y: b.y1 + dy*along + dx*perp,
            vx: -dx * 220*world.dpr, vy: -dy * 220*world.dpr,
            life: 0.35, maxLife: 0.35,
            color: '#67e8f9', size: rand(1.2,2.2)*world.dpr, drag: 0.9
          });
        }
        if(b.chargeT <= 0){
          b.state = 'fire';
          b.life = 0.6;
          const dx = Math.cos(b.ang), dy = Math.sin(b.ang);
          const rayLength = 2500*world.dpr;
          let hit = null, hitAlong = Infinity;
          for(const candidate of world.balls){
            if(!candidate.alive || candidate.id === b.ownerId) continue;
            const rx = candidate.x - b.x1, ry = candidate.y - b.y1;
            const along = rx*dx + ry*dy;
            if(along < 0 || along > rayLength || along >= hitAlong) continue;
            const perpendicular = Math.abs(rx*dy - ry*dx);
            if(perpendicular <= (candidate.r || candidate.radius || 14) + 7*world.dpr){hit=candidate;hitAlong=along;}
          }
          if(hit){
            damageBall(hit, 26, 'judgment_ray');
            world.shockwaves.push({ x:hit.x, y:hit.y, r:0, maxR:48*world.dpr, color:'#67e8f9', life:0.32, maxLife:0.32, width:3 });
            burstParticles(hit.x, hit.y, '#67e8f9', 20, 330*world.dpr, 0.5);
            burstParticles(hit.x, hit.y, '#ffffff', 8, 220*world.dpr, 0.35);
          }
          const dx = Math.cos(b.ang), dy = Math.sin(b.ang);
          for(let k=0; k<50; k++){
            const t = rand(0.1, 1.4);
            world.particles.push({
              x: b.x1 + dx*500*world.dpr*t,
              y: b.y1 + dy*500*world.dpr*t,
              vx: rand(-120,120)*world.dpr, vy: rand(-120,120)*world.dpr,
              life: 0.6, maxLife: 0.6,
              color: Math.random()<0.5 ? '#67e8f9' : '#ffffff', size: rand(1,2.8)*world.dpr, drag: 0.9
            });
          }
          world.shake = Math.max(world.shake, 6*world.dpr);
        }
      }
      if(b.life <= 0) world.beams.splice(i,1);
    }
  },
  render(c){
    for(const b of world.beams){
      if(b.state === 'charge'){
        const p = 1 - b.chargeT / b.chargeMax;
        c.save();
        c.strokeStyle = `rgba(103,232,249,${0.3 + 0.6*p})`;
        c.lineWidth = (1.5 + p*2.5)*world.dpr;
        c.setLineDash([12*world.dpr, 8*world.dpr]);
        c.shadowColor = '#67e8f9';
        c.shadowBlur = 14*world.dpr*p;
        c.beginPath();
        c.moveTo(b.x1, b.y1);
        c.lineTo(b.x2, b.y2);
        c.stroke();
        c.setLineDash([]);
        // rotating rune circle at origin
        c.globalAlpha = p;
        c.strokeStyle = '#67e8f9';
        c.shadowBlur = 20*world.dpr;
        for(let k=0;k<2;k++){
          const rr = 8*world.dpr + k*5*world.dpr;
          c.beginPath();
          c.arc(b.x1, b.y1, rr, b.chargeRingAngle, b.chargeRingAngle + Math.PI*1.4);
          c.stroke();
        }
        c.restore();
        c.save();
        c.fillStyle = `rgba(255,255,255,${0.6+p*0.4})`;
        c.shadowColor = '#67e8f9';
        c.shadowBlur = 30*world.dpr*p;
        c.beginPath();
        c.arc(b.x1, b.y1, 4*world.dpr + p*8*world.dpr, 0, TAU);
        c.fill();
        c.restore();
      } else {
        const p = b.life / b.maxLife;
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = `rgba(103,232,249,${p*0.55})`;
        c.lineWidth = 26*world.dpr*p;
        c.shadowColor = '#67e8f9';
        c.shadowBlur = 32*world.dpr;
        c.beginPath(); c.moveTo(b.x1,b.y1); c.lineTo(b.x2,b.y2); c.stroke();
        c.strokeStyle = `rgba(140,245,255,${p*0.95})`;
        c.lineWidth = 10*world.dpr*p;
        c.shadowBlur = 16*world.dpr;
        c.stroke();
        c.strokeStyle = `rgba(255,255,255,${p})`;
        c.lineWidth = 3*world.dpr*p;
        c.shadowBlur = 0;
        c.stroke();
        // flowing energy particles along the beam
        const dx = Math.cos(b.ang), dy = Math.sin(b.ang);
        for(let k=0;k<8;k++){
          const t = ((world.time*3 + k/8) % 1);
          const px = b.x1 + dx*1200*world.dpr*t;
          const py = b.y1 + dy*1200*world.dpr*t;
          c.fillStyle = `rgba(255,255,255,${p*0.9})`;
          c.shadowColor = '#67e8f9';
          c.shadowBlur = 18*world.dpr;
          c.beginPath();
          c.arc(px, py, 4*world.dpr, 0, TAU);
          c.fill();
        }
        c.restore();
      }
    }
  }
};

// ═══ 2. STAR HUNTER — ENHANCED ═══
POWERS.star_hunter = {
  name:'Chasseur Stellaire', icon:'➤', color:'#fb923c',
  desc:'Missile guidé qui poursuit sa cible.',
  cast(ball){
    const target = nearestEnemy(ball);
    if(!target) return;
    const ang = angleTo(ball, target);
    world.projectiles.push({
      type:'missile',
      x: ball.x, y: ball.y,
      vx: Math.cos(ang)*180*world.dpr,
      vy: Math.sin(ang)*180*world.dpr,
      targetId: target.id,
      life: 2.5, maxLife: 2.5, trail: [],
      color: '#fb923c', damage: 18,
      angle: ang, speed: 170*world.dpr, turnRate: 1.15, ownerId: ball.id,
    });
  },
  update(){}, render(){},
};

// ═══ 3. BOMB SHRAPNEL — ENHANCED ═══
POWERS.bomb_shrapnel = {
  name:'Bombe à fragmentation', icon:'✦', color:'#22d3ee',
  desc:'Bombe qui explose en 8 fragments radiaux.',
  cast(ball){
    const target = nearestEnemy(ball);
    if(!target) return;
    const ang = angleTo(ball, target);
    world.projectiles.push({
      type:'bomb',
      x: ball.x, y: ball.y,
      vx: Math.cos(ang)*280*world.dpr,
      vy: Math.sin(ang)*280*world.dpr,
      life: 2, maxLife: 2, trail: [],
      color: '#22d3ee', ownerId: ball.id, fuse: 0,
    });
  },
  update(){}, render(){},
};

// ═══ 4. SEISMIC NOVA — ENHANCED ═══
POWERS.seismic_nova = {
  name:'Nova Sismique', icon:'◎', color:'#ef4444',
  desc:'Onde circulaire qui se déclenche deux secondes après acquisition.',
  cast(ball){
    state.pendingCasts.push({ powerId:'seismic_nova', ownerId:ball.id, ball:realBall(ball), x:ball.x, y:ball.y, timer:2 });
  },
  castNow(ball){
    world.shockwaves.push({
      x: ball.x, y: ball.y, r: 0, maxR: 220*world.dpr,
      color: '#ef4444', life: 0.9, maxLife: 0.9, width: 7,
      kind: 'nova', sourceX: ball.x, sourceY: ball.y, ownerId: ball.id,
      hitIds: new Set(), knockback: 340*world.dpr,
    });
    world.shockwaves.push({ x:ball.x, y:ball.y, r:0, maxR:180*world.dpr, color:'#ffaa66', life:0.75, maxLife:0.75, width:5 });
    world.shockwaves.push({ x:ball.x, y:ball.y, r:0, maxR:120*world.dpr, color:'#ffffff', life:0.5, maxLife:0.5, width:3 });
    burstParticles(ball.x, ball.y, '#ef4444', 32, 420*world.dpr, 0.75);
    burstParticles(ball.x, ball.y, '#ffaa66', 18, 320*world.dpr, 0.6);
    // radial streaks
    for(let k=0;k<16;k++){
      const ang = (k/16)*TAU;
      world.particles.push({
        x: ball.x + Math.cos(ang)*20*world.dpr,
        y: ball.y + Math.sin(ang)*20*world.dpr,
        vx: Math.cos(ang)*500*world.dpr, vy: Math.sin(ang)*500*world.dpr,
        life: 0.5, maxLife: 0.5,
        color: '#ef4444', size: 3*world.dpr, drag: 0.9
      });
    }
    world.shake = Math.max(world.shake, 12*world.dpr);
  },
  update(){}, render(){},
};

// ═══ 5. MAGMA RIFT — ENHANCED ═══
POWERS.magma_rift = {
  name:'Faille Magmatique', icon:'🔥', color:'#fb923c',
  desc:'Traînée de lave persistante qui blesse au passage.',
  cast(ball){
    const target = nearestEnemy(ball);
    const ang = target ? angleTo(ball, target) : Math.atan2(ball.vy, ball.vx);
    world.zones.push({
      type: 'magma_line',
      x1: ball.x, y1: ball.y,
      x2: ball.x + Math.cos(ang)*220*world.dpr,
      y2: ball.y + Math.sin(ang)*220*world.dpr,
      life: 5, maxLife: 5, width: 24*world.dpr, ownerId: ball.id, team: ball.team,
      flowOffset: 0, hitCooldowns: Object.create(null),
    });
    for(let t=0; t<=1; t+=0.05){
      const x = lerp(ball.x, ball.x + Math.cos(ang)*220*world.dpr, t);
      const y = lerp(ball.y, ball.y + Math.sin(ang)*220*world.dpr, t);
      for(let k=0;k<3;k++){
        world.particles.push({
          x, y,
          vx: rand(-40,40)*world.dpr, vy: rand(-120,-30)*world.dpr,
          life: rand(0.4,1.0), maxLife: 1.0,
          color: Math.random()<0.5 ? '#fb923c' : '#fde047',
          size: rand(1.5,3.5)*world.dpr, drag: 0.9
        });
      }
    }
    world.shake = Math.max(world.shake, 3*world.dpr);
  },
  update(dt){
    for(const z of world.zones){
      if(z.type !== 'magma_line') continue;
      z.life -= dt;
      z.flowOffset = (z.flowOffset || 0) + dt * 60*world.dpr;
      if(Math.random() < 0.9){
        const t = Math.random();
        const x = lerp(z.x1, z.x2, t) + rand(-8,8)*world.dpr;
        const y = lerp(z.y1, z.y2, t) + rand(-4,4)*world.dpr;
        world.particles.push({
          x, y,
          vx: rand(-15,15)*world.dpr, vy: rand(-130,-50)*world.dpr,
          life: rand(0.4,0.9), maxLife: 0.9,
          color: Math.random()<0.4 ? '#fde047' : '#fb923c',
          size: rand(1.5,3.2)*world.dpr, drag: 0.92
        });
      }
      for(const b of world.balls){
        if(b.id === z.ownerId || !b.alive || (z.team != null && b.team === z.team)) continue;
        const px = b.x, py = b.y;
        const vx = z.x2-z.x1, vy = z.y2-z.y1;
        const wx = px-z.x1, wy = py-z.y1;
        const t = clamp((wx*vx+wy*vy)/(vx*vx+vy*vy), 0, 1);
        const cx = z.x1 + vx*t, cy = z.y1 + vy*t;
        const d = Math.hypot(px-cx, py-cy);
        if(d < z.width/2 + b.r && !(z.hitCooldowns[b.id] > 0)){
          damageBall(b, 4, 'magma_rift');
          z.hitCooldowns[b.id] = 0.5;
        }
      }
      for(const id of Object.keys(z.hitCooldowns)){
        z.hitCooldowns[id] = Math.max(0, z.hitCooldowns[id] - dt);
        if(z.hitCooldowns[id] <= 0) delete z.hitCooldowns[id];
      }
    }
    world.zones = world.zones.filter(z => z.life > 0);
  },
  render(c){
    for(const z of world.zones){
      if(z.type !== 'magma_line') continue;
      const p = Math.min(1, z.life / z.maxLife);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = `rgba(251,146,60,${p*0.4})`;
      c.lineWidth = z.width * 2.4 * p;
      c.shadowColor = '#fb923c';
      c.shadowBlur = 28*world.dpr;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(z.x1,z.y1); c.lineTo(z.x2,z.y2); c.stroke();
      c.strokeStyle = `rgba(255,220,120,${p*0.95})`;
      c.lineWidth = z.width * p;
      c.shadowBlur = 14*world.dpr;
      c.stroke();
      c.strokeStyle = `rgba(255,255,240,${p*0.9})`;
      c.lineWidth = z.width * 0.35 * p;
      c.shadowBlur = 0;
      c.stroke();
      // flowing bright cores
      const dx = z.x2-z.x1, dy = z.y2-z.y1;
      const len = Math.hypot(dx,dy) || 1;
      const ux = dx/len, uy = dy/len;
      const nPulse = 6;
      for(let k=0;k<nPulse;k++){
        const t = ((z.flowOffset/(40*world.dpr) + k/nPulse) % 1);
        const px = z.x1 + dx*t;
        const py = z.y1 + dy*t;
        c.fillStyle = `rgba(255,255,255,${p*0.85})`;
        c.shadowColor = '#fde047';
        c.shadowBlur = 20*world.dpr;
        c.beginPath();
        c.arc(px, py, 4*world.dpr, 0, TAU);
        c.fill();
      }
      c.restore();
    }
  }
};

// ═══ 6. SINGULARITY — ENHANCED ═══
POWERS.singularity = {
  name:'Singularité Violette', icon:'◯', color:'#a855f7',
  desc:'Attire les boules puis implose.',
  cast(ball){
    const a = world.arena, margin = 65*world.dpr;
    let x = a.cx, y = a.cy;
    for(let i=0;i<24;i++){
      const nx=rand(a.x+margin,a.x+a.w-margin), ny=rand(a.y+margin,a.y+a.h-margin);
      if(Math.hypot(nx-ball.x,ny-ball.y)>=220*world.dpr){x=nx;y=ny;break;}
    }
    world.zones.push({
      type: 'singularity', x, y,
      life: 2, maxLife: 2,
      radius: 0, maxRadius: 200*world.dpr,
      pull: 420*world.dpr, implodeAt: 1.9,
      ownerId: ball.id, spin: 0,
    });
    world.shake = Math.max(world.shake, 4*world.dpr);
  },
  update(dt){
    for(const z of world.zones){
      if(z.type !== 'singularity') continue;
      z.life -= dt;
      z.spin += dt*2.8;
      const t = 1 - z.life / z.maxLife;
      if(t < z.implodeAt/z.maxLife){
        z.radius = z.maxRadius * (t / (z.implodeAt/z.maxLife));
      } else {
        z.radius = z.maxRadius * (1 - (t - z.implodeAt/z.maxLife)/(1 - z.implodeAt/z.maxLife)) * 0.3;
      }
      for(const b of world.balls){
        if(!b.alive) continue;
        const d = Math.hypot(b.x - z.x, b.y - z.y);
        if(d < z.maxRadius && d > 5){
          const f = (1 - d/z.maxRadius) * z.pull;
          b.vx += (z.x - b.x)/d * f * dt;
          b.vy += (z.y - b.y)/d * f * dt;
        }
      }
      if(Math.random() < 0.9){
        const ang = Math.random()*TAU;
        const rr = z.maxRadius * rand(0.5, 1.15);
        world.particles.push({
          x: z.x + Math.cos(ang)*rr,
          y: z.y + Math.sin(ang)*rr,
          vx: -Math.cos(ang)*rr*1.6, vy: -Math.sin(ang)*rr*1.6,
          life: 0.6, maxLife: 0.6,
          color: Math.random()<0.5 ? '#c084fc' : '#e9d5ff',
          size: rand(1.5,3.2)*world.dpr, drag: 0.98
        });
      }
      if(!z.imploded && t >= z.implodeAt/z.maxLife){
        z.imploded = true;
        world.shockwaves.push({ x:z.x, y:z.y, r:0, maxR: 260*world.dpr, color:'#a855f7', life:0.7, maxLife:0.7, width:6 });
        world.shockwaves.push({ x:z.x, y:z.y, r:0, maxR: 180*world.dpr, color:'#ffffff', life:0.4, maxLife:0.4, width:4 });
        burstParticles(z.x, z.y, '#e9d5ff', 50, 540*world.dpr, 0.95);
        burstParticles(z.x, z.y, '#a855f7', 38, 380*world.dpr, 1.05);
        world.shake = Math.max(world.shake, 15*world.dpr);
        for(const b of world.balls){
          if(!b.alive) continue;
          const d = Math.hypot(b.x - z.x, b.y - z.y);
          if(d < 220*world.dpr){
            const falloff = 1 - d/(220*world.dpr);
            damageBall(b, 28*falloff, 'singularity');
            const ang = Math.atan2(b.y - z.y, b.x - z.x);
            b.vx += Math.cos(ang) * 440*world.dpr * falloff;
            b.vy += Math.sin(ang) * 440*world.dpr * falloff;
          }
        }
      }
    }
    world.zones = world.zones.filter(z => z.life > 0);
  },
  render(c){
    for(const z of world.zones){
      if(z.type !== 'singularity') continue;
      c.save();
      const g = c.createRadialGradient(z.x, z.y, 0, z.x, z.y, Math.max(20, z.maxRadius));
      g.addColorStop(0, 'rgba(10,0,25,0.98)');
      g.addColorStop(0.3, 'rgba(100,40,180,0.55)');
      g.addColorStop(0.65, 'rgba(168,85,247,0.18)');
      g.addColorStop(1, 'rgba(168,85,247,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(z.x, z.y, z.maxRadius, 0, TAU); c.fill();
      c.restore();
      c.save();
      c.globalCompositeOperation = 'lighter';
      for(let i=0; i<4; i++){
        const ang = z.spin * (i%2===0 ? 1 : -1) + i*Math.PI/2;
        const r = z.maxRadius * (0.32 + i*0.06);
        c.strokeStyle = `rgba(192,132,252,${0.55})`;
        c.lineWidth = 2.5*world.dpr;
        c.shadowColor = '#a855f7';
        c.shadowBlur = 14*world.dpr;
        c.beginPath();
        c.arc(z.x, z.y, r, ang, ang + Math.PI*1.4);
        c.stroke();
      }
      c.restore();
      if(z.radius > 0){
        c.save();
        const core = c.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.radius);
        core.addColorStop(0, '#000');
        core.addColorStop(0.65, '#1a0033');
        core.addColorStop(1, 'rgba(168,85,247,0.5)');
        c.fillStyle = core;
        c.beginPath(); c.arc(z.x, z.y, Math.max(4, z.radius*0.55), 0, TAU); c.fill();
        c.restore();
      }
    }
  }
};

// ═══ 7. QUANTUM JUMP — ENHANCED ═══
POWERS.quantum_jump = {
  name:'Saut Quantique', icon:'◈', color:'#22d3ee',
  desc:'Téléportation avec anneaux visibles.',
  cast(ball){
    const a = world.arena;
    const from = { x: ball.x, y: ball.y };
    let to = null;
    for(let i=0;i<20;i++){
      const nx = rand(a.x + 40*world.dpr, a.x + a.w - 40*world.dpr);
      const ny = rand(a.y + 40*world.dpr, a.y + a.h - 40*world.dpr);
      if(Math.hypot(nx - ball.x, ny - ball.y) > 150*world.dpr){ to = { x: nx, y: ny }; break; }
    }
    if(!to) to = { x: a.cx, y: a.cy };
    ball.x = to.x; ball.y = to.y;
    ball.invuln = Math.max(ball.invuln, 0.4);
    world.zones.push({ type:'quantum', from, to, life: 1.1, maxLife: 1.1 });
  },
  update(dt){
    for(const z of world.zones){ if(z.type === 'quantum') z.life -= dt; }
    world.zones = world.zones.filter(z => z.life > 0);
  },
  render(c){
    for(const z of world.zones){
      if(z.type !== 'quantum') continue;
      const p = 1 - z.life / z.maxLife;
      const fade = 1 - p;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const ringSize = 24*world.dpr + (1-p)*40*world.dpr;
      ['from','to'].forEach(k=>{
        const pos = z[k];
        for(let ring=0; ring<3; ring++){
          c.strokeStyle = `rgba(34,211,238,${fade * (1-ring*0.25)})`;
          c.lineWidth = (3-ring*0.7)*world.dpr;
          c.shadowColor = '#22d3ee';
          c.shadowBlur = 20*world.dpr*fade;
          c.beginPath();
          c.arc(pos.x, pos.y, ringSize*(1-p) * (1 - ring*0.25), 0, TAU);
          c.stroke();
        }
      });
      c.setLineDash([6*world.dpr, 10*world.dpr]);
      c.strokeStyle = `rgba(34,211,238,${fade*0.6})`;
      c.lineWidth = 2*world.dpr;
      c.shadowColor = '#22d3ee';
      c.shadowBlur = 14*world.dpr;
      c.beginPath(); c.moveTo(z.from.x, z.from.y); c.lineTo(z.to.x, z.to.y); c.stroke();
      c.restore();
    }
  }
};

// ═══ 8. COLOSSUS — ENHANCED ═══
POWERS.colossus = {
  name:'Surcharge Giga', icon:'⬢', color:'#fbbf24',
  desc:'Devient géant et gagne un bonus de dégâts.',
  cast(ball){
    ball.colossus = 3.0;
    ball.r = ball.baseR * 1.6;
    world.shockwaves.push({ x: ball.x, y: ball.y, r: 0, maxR: 100*world.dpr, color:'#fbbf24', life:0.6, maxLife:0.6, width:4 });
    burstParticles(ball.x, ball.y, '#fbbf24', 32, 400*world.dpr, 0.9);
    burstParticles(ball.x, ball.y, '#fff7ae', 14, 260*world.dpr, 0.6);
    world.shake = Math.max(world.shake, 12*world.dpr);
  },
  update(dt){
    for(const b of world.balls){
      if(b.colossus > 0){
        const prev = b.colossus;
        b.colossus -= dt;
        if(prev > 0 && b.colossus <= 0){ b.r = b.baseR; }
      }
    }
  },
  render(c){
    for(const b of world.balls){
      if(b.colossus > 0 && b.alive){
        const p = Math.min(1, b.colossus / 3);
        c.save();
        c.globalCompositeOperation = 'lighter';
        for(let i=0;i<4;i++){
          const rr = b.r + (8 + i*9)*world.dpr + Math.sin(world.time*6 + i)*3*world.dpr;
          c.strokeStyle = `rgba(251,191,36,${(0.6 - i*0.1)*p})`;
          c.lineWidth = 2.5*world.dpr;
          c.shadowColor = '#fbbf24';
          c.shadowBlur = 16*world.dpr;
          c.beginPath(); c.arc(b.x, b.y, rr, 0, TAU); c.stroke();
        }
        c.restore();
        c.save();
        c.strokeStyle = `rgba(255,42,42,${0.85*p})`;
        c.lineWidth = 2*world.dpr;
        c.shadowColor = '#ff2a42';
        c.shadowBlur = 12*world.dpr;
        const seed = b.id * 7.3;
        for(let i=0;i<5;i++){
          const ang = seed + i * 1.4 + world.time*0.7;
          const r1 = b.r * 0.15, r2 = b.r * 0.88;
          c.beginPath();
          c.moveTo(b.x + Math.cos(ang)*r1, b.y + Math.sin(ang)*r1);
          const midX = b.x + Math.cos(ang+0.15)*(r1+r2)/2;
          const midY = b.y + Math.sin(ang+0.15)*(r1+r2)/2;
          c.lineTo(midX, midY);
          c.lineTo(b.x + Math.cos(ang+0.2)*r2, b.y + Math.sin(ang+0.2)*r2);
          c.stroke();
        }
        c.restore();
      }
    }
  }
};

// ═══ 9. PRISM REFLECTOR — ENHANCED ═══
POWERS.prism_reflector = {
  name:'Prisme Réflecteur', icon:'◇', color:'#93c5fd',
  desc:'Bouclier hexagonal qui renvoie les dégâts.',
  cast(ball){
    ball.prism = 3.0;
    ball.prismAngle = 0;
    world.shockwaves.push({ x:ball.x, y:ball.y, r:0, maxR:80*world.dpr, color:'#93c5fd', life:0.5, maxLife:0.5, width:3 });
  },
  update(dt){
    for(const b of world.balls){
      if(b.prism > 0){
        b.prism -= dt;
        b.prismAngle = (b.prismAngle || 0) + dt * 1.4;
      }
    }
  },
  render(c){
    for(const b of world.balls){
      if(b.prism > 0 && b.alive){
        const p = Math.min(1, b.prism / 3);
        const hexR = b.r + 14*world.dpr;
        c.save();
        c.translate(b.x, b.y);
        c.rotate(b.prismAngle || 0);
        c.beginPath();
        for(let i=0;i<=6;i++){
          const ang = i/6*TAU - Math.PI/2;
          const px = Math.cos(ang)*hexR, py = Math.sin(ang)*hexR;
          if(i===0) c.moveTo(px,py); else c.lineTo(px,py);
        }
        c.closePath();
        const g = c.createRadialGradient(0,0,hexR*0.2, 0,0,hexR);
        g.addColorStop(0, `rgba(147,197,253,${0.08*p})`);
        g.addColorStop(0.7, `rgba(147,197,253,${0.2*p})`);
        g.addColorStop(1, `rgba(220,240,255,${0.45*p})`);
        c.fillStyle = g;
        c.fill();
        c.strokeStyle = `hsla(${(world.time*100)%360}, 90%, 80%, ${p})`;
        c.lineWidth = 3*world.dpr;
        c.shadowColor = '#93c5fd';
        c.shadowBlur = 20*world.dpr;
        c.stroke();
        // inner hexagon
        c.beginPath();
        for(let i=0;i<=6;i++){
          const ang = i/6*TAU - Math.PI/2;
          const px = Math.cos(ang)*hexR*0.6, py = Math.sin(ang)*hexR*0.6;
          if(i===0) c.moveTo(px,py); else c.lineTo(px,py);
        }
        c.strokeStyle = `hsla(${(world.time*100+180)%360}, 90%, 85%, ${p*0.7})`;
        c.lineWidth = 1.5*world.dpr;
        c.stroke();
        // sparkles around
        for(let k=0;k<3;k++){
          const ang = world.time*2 + k*TAU/3;
          const sx = Math.cos(ang)*hexR*1.1;
          const sy = Math.sin(ang)*hexR*1.1;
          c.fillStyle = `rgba(255,255,255,${p*0.9})`;
          c.shadowColor = '#93c5fd';
          c.shadowBlur = 12*world.dpr;
          c.beginPath();
          c.arc(sx, sy, 2.5*world.dpr, 0, TAU);
          c.fill();
        }
        c.restore();
      }
    }
  }
};

// ═══ 10. MULTIPLICATION — ENHANCED ═══
POWERS.multiplication = {
  name:'Division Cellulaire', icon:'✧', color:'#ff2a85',
  desc:'Deux clones translucides se séparent.',
  cast(ball){
    world.shockwaves.push({ x:ball.x, y:ball.y, r:0, maxR:100*world.dpr, color:'#ffffff', life:0.4, maxLife:0.4, width:3 });
    burstParticles(ball.x, ball.y, '#ff2a85', 26, 320*world.dpr, 0.75);
    for(let i=0;i<2;i++){
      const ang = (ball.id*1.3 + i*Math.PI) + rand(-0.3, 0.3);
      world.decoys.push({
        x: ball.x, y: ball.y,
        vx: Math.cos(ang) * 220*world.dpr,
        vy: Math.sin(ang) * 220*world.dpr,
        r: ball.r, color: '#ff2a85',
        life: 3.0, maxLife: 3.0, phase: rand(0, TAU),
        sourceX: ball.x, sourceY: ball.y,
        ownerId: ball.id, team: ball.team,
        hitCooldowns: Object.create(null),
      });
    }
  },
  update(dt){
    const a = world.arena;
    for(let i=world.decoys.length-1;i>=0;i--){
      const d = world.decoys[i];
      d.life -= dt;
      for(const id of Object.keys(d.hitCooldowns || {})){
        d.hitCooldowns[id] = Math.max(0, d.hitCooldowns[id] - dt);
        if(d.hitCooldowns[id] <= 0) delete d.hitCooldowns[id];
      }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      const left = a.x + d.r, right = a.x + a.w - d.r;
      const top = a.y + d.r, bottom = a.y + a.h - d.r;
      if(d.x < left){ d.x = left; d.vx = Math.abs(d.vx); }
      else if(d.x > right){ d.x = right; d.vx = -Math.abs(d.vx); }
      if(d.y < top){ d.y = top; d.vy = Math.abs(d.vy); }
      else if(d.y > bottom){ d.y = bottom; d.vy = -Math.abs(d.vy); }
      // Les clones sont des projectiles solides : ils repoussent et blessent les adversaires.
      for(const b of world.balls){
        if(!b.alive || b.id === d.ownerId || (d.team != null && b.team === d.team)) continue;
        const dx = b.x - d.x, dy = b.y - d.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minDist = d.r + b.r;
        if(dist >= minDist) continue;
        const nx = dx / dist, ny = dy / dist;
        d.x = b.x - nx * (minDist + 1);
        d.y = b.y - ny * (minDist + 1);
        d.vx = -nx * 220*world.dpr - ny * 45*world.dpr;
        d.vy = -ny * 220*world.dpr + nx * 45*world.dpr;
        b.vx += nx * 80*world.dpr;
        b.vy += ny * 80*world.dpr;
        if(!d.hitCooldowns[b.id]){
          damageBall(b, 5, 'multiplication');
          d.hitCooldowns[b.id] = 0.45;
        }
      }
      if(d.life <= 0) world.decoys.splice(i,1);
    }
  },
  render(c){
    for(const d of world.decoys){
      const p = d.life / d.maxLife;
      const wob = Math.sin(world.time*6 + d.phase) * 2*world.dpr;
      c.save();
      c.globalAlpha = 0.6 * p;
      const g = c.createRadialGradient(d.x - d.r*0.3, d.y - d.r*0.3, 0, d.x, d.y, d.r + wob);
      g.addColorStop(0, 'rgba(255,220,240,0.95)');
      g.addColorStop(0.3, '#ff2a85');
      g.addColorStop(1, '#7a0035');
      c.fillStyle = g;
      c.shadowColor = '#ff2a85';
      c.shadowBlur = 22*world.dpr;
      c.beginPath(); c.arc(d.x, d.y, d.r + wob, 0, TAU); c.fill();
      // specular on clone
      c.globalAlpha = 0.7 * p;
      c.fillStyle = 'rgba(255,255,255,0.9)';
      c.beginPath();
      c.ellipse(d.x - d.r*0.32, d.y - d.r*0.4, d.r*0.25, d.r*0.14, -0.6, 0, TAU);
      c.fill();
      c.restore();
    }
  }
};

// ═══ 11. CHAÎNE D'ÉCLAIRS — CHAÎNE TOURNANTE ═══
POWERS.chain_lightning = {
  name:'Chaîne d\'Éclairs', icon:'ϟ', color:'#fbbf24',
  desc:'Chaîne tournoyante qui lie deux boules et les écrase.',
  entities: [],
  cast(ball){
    const target = world.balls.filter(b=>b.alive&&b.id!==ball.id)
      .sort((a,b)=>Math.hypot(b.x-ball.x,b.y-ball.y)-Math.hypot(a.x-ball.x,a.y-ball.y))[0];
    if(!target) return;
    this.entities.push({ownerId:ball.id,targetId:target.id,x1:ball.x,y1:ball.y,age:0,phase:'strike',strikeDur:0.28,damageDone:false});
    burstParticles(ball.x, ball.y, '#fbbf24', 18, 260*world.dpr, 0.5);
  },
  update(dt){
    for(let i=this.entities.length-1;i>=0;i--){
      const e = this.entities[i];
      const owner = world.balls.find(b => b.id === e.ownerId);
      if(e.phase === 'strike'){
        const target=world.balls.find(b=>b.id===e.targetId&&b.alive);
        e.age+=dt;
        if(owner){e.x1=owner.x;e.y1=owner.y;}
        if(target){
          e.x2=target.x;e.y2=target.y;
          if(!e.damageDone){e.damageDone=true;damageBall(target,18,'chain_lightning');burstParticles(target.x,target.y,'#fbbf24',24,360*world.dpr,0.55);}
        }
        if(e.age>=e.strikeDur)this.entities.splice(i,1);
      } else if(e.phase === 'spin'){
        if(!owner || !owner.alive){ this.entities.splice(i,1); continue; }
        e.ownerX = owner.x; e.ownerY = owner.y;
        e.age += dt;
        e.angle += e.spinSpeed * dt;
        const spinP = Math.min(1, e.age / e.spinDur);
        e.radius = 30*world.dpr + (e.maxRadius - 30*world.dpr) * Math.min(1, spinP * 1.35);
        const samples = 20;
        for(let s=0; s<samples; s++){
          if(e.phase === 'link') break;
          const a = e.angle + (s/samples) * TAU;
          const px = e.ownerX + Math.cos(a) * e.radius;
          const py = e.ownerY + Math.sin(a) * e.radius;
          for(const b of world.balls){
            if(!b.alive || b.id === e.ownerId) continue;
            if(e.caughtIds.includes(b.id)) continue;
            const d = Math.hypot(b.x - px, b.y - py);
            if(d < b.r + 10*world.dpr){
              e.caughtIds.push(b.id);
              burstParticles(b.x, b.y, '#fbbf24', 16, 260*world.dpr, 0.5);
              burstParticles(b.x, b.y, '#fef3c7', 10, 200*world.dpr, 0.4);
              world.shockwaves.push({ x:b.x, y:b.y, r:0, maxR:50*world.dpr, color:'#fbbf24', life:0.3, maxLife:0.3, width:2 });
              if(e.caughtIds.length >= 2){
                e.phase = 'link';
                e.linkA = e.caughtIds[0];
                e.linkB = e.caughtIds[1];
                e.linkTimer = e.linkDur;
                break;
              }
            }
          }
        }
        if(e.phase === 'spin' && e.age >= e.spinDur){
          e.phase = 'fade'; e.fadeAge = 0;
        }
      } else if(e.phase === 'link'){
        const a = world.balls.find(b => b.id === e.linkA);
        const b = world.balls.find(bb => bb.id === e.linkB);
        if(!a || !a.alive || !b || !b.alive){ this.entities.splice(i,1); continue; }
        e.linkTimer -= dt;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx/dist, uy = dy/dist;
        const pullSpeed = 500*world.dpr;
        a.vx = ux * pullSpeed; a.vy = uy * pullSpeed;
        b.vx = -ux * pullSpeed; b.vy = -uy * pullSpeed;
        const minDist = a.r + b.r + 4*world.dpr;
        if(dist < minDist || e.linkTimer <= 0){
          damageBall(a, 18, 'chain_lightning', true);
          damageBall(b, 18, 'chain_lightning', true);
          const sx = (a.x + b.x)/2, sy = (a.y + b.y)/2;
          world.shake = Math.max(world.shake, 16*world.dpr);
          burstParticles(sx, sy, '#fbbf24', 50, 540*world.dpr, 0.9);
          burstParticles(sx, sy, '#ffffff', 26, 380*world.dpr, 0.6);
          burstParticles(sx, sy, '#fef3c7', 30, 460*world.dpr, 0.75);
          world.shockwaves.push({ x:sx, y:sy, r:0, maxR:260*world.dpr, color:'#fbbf24', life:0.65, maxLife:0.65, width:7 });
          world.shockwaves.push({ x:sx, y:sy, r:0, maxR:160*world.dpr, color:'#ffffff', life:0.4, maxLife:0.4, width:4 });
          a.vx = -ux * 340*world.dpr; a.vy = -uy * 340*world.dpr;
          b.vx = ux * 340*world.dpr; b.vy = uy * 340*world.dpr;
          e.phase = 'fade'; e.fadeAge = 0;
        }
      } else if(e.phase === 'fade'){
        e.fadeAge += dt;
        if(e.fadeAge >= 0.35) this.entities.splice(i,1);
      }
    }
  },
  render(c){
    for(const e of this.entities){
      const flicker = 0.7 + 0.3*Math.sin(world.time*40);
      if(e.phase === 'strike'){
        c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
        const target=world.balls.find(b=>b.id===e.targetId&&b.alive);
        const x2=target?target.x:(e.x2??e.x1),y2=target?target.y:(e.y2??e.y1);
        c.strokeStyle='rgba(251,191,36,0.65)';c.lineWidth=18*world.dpr;c.shadowColor='#fbbf24';c.shadowBlur=24*world.dpr;
        c.beginPath();c.moveTo(e.x1,e.y1);
        for(let k=1;k<8;k++){const t=k/8;c.lineTo(e.x1+(x2-e.x1)*t+rand(-16,16)*world.dpr,e.y1+(y2-e.y1)*t+rand(-16,16)*world.dpr);}
        c.lineTo(x2,y2);c.stroke();c.strokeStyle='#fff7cc';c.lineWidth=3*world.dpr;c.shadowBlur=10*world.dpr;c.stroke();c.restore();
      } else if(e.phase === 'spin'){
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';
        c.strokeStyle = `rgba(251,191,36,${0.4*flicker})`;
        c.lineWidth = 20*world.dpr;
        c.shadowColor = '#fbbf24';
        c.shadowBlur = 30*world.dpr;
        c.beginPath();
        const samples = 40;
        for(let s=0; s<=samples; s++){
          const a = e.angle + (s/samples)*TAU;
          const px = e.ownerX + Math.cos(a)*e.radius;
          const py = e.ownerY + Math.sin(a)*e.radius;
          if(s===0) c.moveTo(px,py); else c.lineTo(px,py);
        }
        c.stroke();
        c.strokeStyle = `rgba(254,243,199,${0.95*flicker})`;
        c.lineWidth = 5*world.dpr;
        c.shadowBlur = 16*world.dpr;
        c.stroke();
        c.strokeStyle = `rgba(255,255,255,${flicker})`;
        c.lineWidth = 2*world.dpr;
        c.shadowBlur = 0;
        c.stroke();
        const linkCount = 16;
        for(let k=0; k<linkCount; k++){
          const a = e.angle + (k/linkCount)*TAU;
          const px = e.ownerX + Math.cos(a)*e.radius;
          const py = e.ownerY + Math.sin(a)*e.radius;
          c.fillStyle = `rgba(255,255,255,${flicker*0.7})`;
          c.shadowColor = '#fbbf24';
          c.shadowBlur = 16*world.dpr;
          c.beginPath(); c.arc(px, py, 5*world.dpr, 0, TAU); c.fill();
        }
        c.restore();
        for(const bid of e.caughtIds){
          const b = world.balls.find(bb => bb.id === bid);
          if(!b || !b.alive) continue;
          c.save();
          c.globalCompositeOperation = 'lighter';
          const pulse = 0.6 + 0.4*Math.sin(world.time*20);
          c.strokeStyle = `rgba(251,191,36,${0.85*flicker*pulse})`;
          c.lineWidth = 3*world.dpr;
          c.shadowColor = '#fbbf24';
          c.shadowBlur = 20*world.dpr;
          c.beginPath(); c.arc(b.x, b.y, b.r + 10*world.dpr, 0, TAU); c.stroke();
          for(let s=0; s<5; s++){
            const ang = world.time*4 + s*(TAU/5);
            const px = b.x + Math.cos(ang)*(b.r + 8*world.dpr);
            const py = b.y + Math.sin(ang)*(b.r + 8*world.dpr);
            c.fillStyle = `rgba(255,255,255,${flicker})`;
            c.beginPath(); c.arc(px, py, 2.5*world.dpr, 0, TAU); c.fill();
          }
          c.restore();
        }
      } else if(e.phase === 'link'){
        const a = world.balls.find(b => b.id === e.linkA);
        const b = world.balls.find(bb => bb.id === e.linkB);
        if(!a || !a.alive || !b || !b.alive) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx,dy) || 1;
        const ux = dx/dist, uy = dy/dist;
        const nx = -uy, ny = ux;
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';
        const segCount = 14;
        const points = [{x: a.x, y: a.y}];
        for(let i=1; i<segCount; i++){
          const t = i/segCount;
          const px = a.x + dx*t;
          const py = a.y + dy*t;
          const jitter = rand(-12, 12)*world.dpr;
          points.push({ x: px + nx*jitter, y: py + ny*jitter });
        }
        points.push({x: b.x, y: b.y});
        c.strokeStyle = `rgba(251,191,36,${0.45*flicker})`;
        c.lineWidth = 24*world.dpr;
        c.shadowColor = '#fbbf24';
        c.shadowBlur = 32*world.dpr;
        c.beginPath();
        points.forEach((pt, i) => i===0 ? c.moveTo(pt.x,pt.y) : c.lineTo(pt.x,pt.y));
        c.stroke();
        c.strokeStyle = `rgba(254,243,199,${flicker})`;
        c.lineWidth = 6*world.dpr;
        c.shadowBlur = 16*world.dpr;
        c.stroke();
        c.strokeStyle = `rgba(255,255,255,${flicker})`;
        c.lineWidth = 2.5*world.dpr;
        c.shadowBlur = 0;
        c.stroke();
        for(let i=1; i<points.length-1; i++){
          if(Math.random() > 0.5) continue;
          const p = points[i];
          const arcLen = rand(12, 30)*world.dpr;
          const dir = Math.random() < 0.5 ? 1 : -1;
          c.strokeStyle = `rgba(251,191,36,${0.65*flicker})`;
          c.lineWidth = 1.8*world.dpr;
          c.shadowColor = '#fbbf24';
          c.shadowBlur = 12*world.dpr;
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(p.x + nx*arcLen*dir + ux*rand(-10,10)*world.dpr, p.y + ny*arcLen*dir + uy*rand(-10,10)*world.dpr);
          c.stroke();
        }
        c.restore();
        for(const bb of [a, b]){
          c.save();
          c.globalCompositeOperation = 'lighter';
          const pulse = 0.6 + 0.4*Math.sin(world.time*22);
          c.strokeStyle = `rgba(251,191,36,${0.9*flicker*pulse})`;
          c.lineWidth = 3.5*world.dpr;
          c.shadowColor = '#fbbf24';
          c.shadowBlur = 22*world.dpr;
          c.beginPath(); c.arc(bb.x, bb.y, bb.r + 10*world.dpr, 0, TAU); c.stroke();
          c.restore();
        }
      } else if(e.phase === 'fade'){
        const fade = 1 - e.fadeAge/0.35;
        for(const bid of e.caughtIds){
          const b = world.balls.find(bb => bb.id === bid);
          if(!b || !b.alive) continue;
          c.save();
          c.globalAlpha = fade;
          c.globalCompositeOperation = 'lighter';
          c.strokeStyle = `rgba(251,191,36,0.6)`;
          c.lineWidth = 2.5*world.dpr;
          c.shadowColor = '#fbbf24';
          c.shadowBlur = 16*world.dpr;
          c.beginPath(); c.arc(b.x, b.y, b.r + 10*world.dpr, 0, TAU); c.stroke();
          c.restore();
        }
      }
    }
  }
};

// ═══ 12. PRISON DE CRISTAL — PIÈGE ═══
POWERS.crystal_prison = {
  name:'Prison de Cristal', icon:'❄', color:'#7dd3fc',
  desc:'Pose un piège. Verrouille la boule qui marche dessus.',
  entities: [],
  cast(ball){
    this.entities.push({
      x: ball.x, y: ball.y, ownerId: ball.id,
      age: 0, life: 6.0, maxLife: 6.0,
      trapRadius: 40*world.dpr,
      victimId: null, phase: 'trap', phaseTimer: 0,
      lockDur: 1.1, shatterDur: 0.4,
    });
    burstParticles(ball.x, ball.y, '#7dd3fc', 16, 220*world.dpr, 0.5);
    world.shockwaves.push({ x:ball.x, y:ball.y, r:0, maxR:55*world.dpr, color:'#7dd3fc', life:0.3, maxLife:0.3, width:2 });
  },
  update(dt){
    for(let i=this.entities.length-1;i>=0;i--){
      const e = this.entities[i];
      if(e.phase === 'trap'){
        e.age += dt; e.life -= dt;
        if(e.life <= 0){ this.entities.splice(i,1); continue; }
        for(const b of world.balls){
          if(!b.alive || b.id === e.ownerId) continue;
          const d = Math.hypot(b.x - e.x, b.y - e.y);
          if(d < e.trapRadius + b.r){
            e.phase = 'lock'; e.phaseTimer = e.lockDur;
            e.victimId = b.id;
            b.x = e.x; b.y = e.y; b.vx = 0; b.vy = 0;
            b._frozen = true;
            burstParticles(e.x, e.y, '#7dd3fc', 26, 300*world.dpr, 0.6);
            world.shockwaves.push({ x:e.x, y:e.y, r:0, maxR:100*world.dpr, color:'#7dd3fc', life:0.4, maxLife:0.4, width:3 });
            world.shake = Math.max(world.shake, 7*world.dpr);
            break;
          }
        }
      } else if(e.phase === 'lock'){
        e.phaseTimer -= dt;
        const victim = world.balls.find(b => b.id === e.victimId);
        if(!victim || !victim.alive){ this.entities.splice(i,1); continue; }
        victim.x = e.x; victim.y = e.y;
        victim.vx = 0; victim.vy = 0;
        if(e.phaseTimer <= 0){
          e.phase = 'shatter'; e.phaseTimer = e.shatterDur;
          victim._frozen = false;
          damageBall(victim, 22, 'crystal_prison', true);
          burstParticles(e.x, e.y, '#7dd3fc', 52, 540*world.dpr, 0.9);
          burstParticles(e.x, e.y, '#ffffff', 26, 380*world.dpr, 0.6);
          burstParticles(e.x, e.y, '#a5e8ff', 20, 440*world.dpr, 0.7);
          world.shockwaves.push({ x:e.x, y:e.y, r:0, maxR:180*world.dpr, color:'#7dd3fc', life:0.55, maxLife:0.55, width:6 });
          world.shockwaves.push({ x:e.x, y:e.y, r:0, maxR:110*world.dpr, color:'#ffffff', life:0.35, maxLife:0.35, width:4 });
          world.shake = Math.max(world.shake, 10*world.dpr);
        }
      } else if(e.phase === 'shatter'){
        e.phaseTimer -= dt;
        if(e.phaseTimer <= 0) this.entities.splice(i,1);
      }
    }
  },
  render(c){
    for(const e of this.entities){
      if(e.phase === 'trap'){
        const pulse = 0.5 + 0.5*Math.sin(world.time*4);
        c.save();
        c.strokeStyle = `rgba(125,211,252,${0.45 + 0.3*pulse})`;
        c.lineWidth = 2.5*world.dpr;
        c.shadowColor = '#7dd3fc';
        c.shadowBlur = 16*world.dpr;
        c.beginPath(); c.arc(e.x, e.y, e.trapRadius, 0, TAU); c.stroke();
        for(let i=0; i<8; i++){
          const a = (i/8)*TAU + world.time*0.9;
          const px = e.x + Math.cos(a)*e.trapRadius*0.65;
          const py = e.y + Math.sin(a)*e.trapRadius*0.65;
          c.fillStyle = `rgba(125,211,252,${0.6*pulse + 0.3})`;
          c.beginPath(); c.arc(px, py, 3*world.dpr, 0, TAU); c.fill();
        }
        const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.trapRadius*0.8);
        g.addColorStop(0, `rgba(125,211,252,${0.22*pulse})`);
        g.addColorStop(1, 'rgba(125,211,252,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(e.x, e.y, e.trapRadius*0.8, 0, TAU); c.fill();
        c.restore();
      } else if(e.phase === 'lock'){
        const growP = 1 - (e.phaseTimer / e.lockDur);
        const victim = world.balls.find(b => b.id === e.victimId);
        if(victim) drawCrystals(c, e.x, e.y, victim.r, growP, 1);
      } else if(e.phase === 'shatter'){
        const fade = Math.max(0, e.phaseTimer / e.shatterDur);
        const victim = world.balls.find(b => b.id === e.victimId);
        drawCrystals(c, e.x, e.y, victim?.r || 16*world.dpr, 1, fade);
      }
    }
  }
};

function drawCrystals(ctx, x, y, baseR, growP, alpha){
  const N = 6;
  for(let i=0;i<N;i++){
    const ang = (i/N)*TAU - Math.PI/2;
    const len = (24 + 8*Math.sin(world.time*4 + i*2)) * world.dpr * growP;
    const w = 13*world.dpr * growP;
    const cx = x + Math.cos(ang) * (baseR + 12*world.dpr);
    const cy = y + Math.sin(ang) * (baseR + 12*world.dpr);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.rotate(ang + Math.PI/2);
    const grad = ctx.createLinearGradient(0, -len, 0, len*0.4);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#a5e8ff');
    grad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#7dd3fc';
    ctx.shadowBlur = 22*world.dpr;
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.lineTo(w, -len*0.35);
    ctx.lineTo(w*0.5, len*0.4);
    ctx.lineTo(-w*0.5, len*0.4);
    ctx.lineTo(-w, -len*0.35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5*world.dpr;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1*world.dpr;
    ctx.beginPath();
    ctx.moveTo(0, -len*0.85);
    ctx.lineTo(0, len*0.35);
    ctx.stroke();
    ctx.restore();
  }
}

// ═══ 13. FLEUR EXPLOSIVE ═══
POWERS.explosive_flower = {
  name:'Fleur Explosive', icon:'✿', color:'#ec4899',
  desc:'Une fleur se déploie, ses pétales partent en étoile.',
  entities: [],
  cast(ball){
    const a = world.arena, margin = 45*world.dpr;
    const x = rand(a.x + margin, a.x + a.w - margin);
    const y = rand(a.y + margin, a.y + a.h - margin);
    this.entities.push({
      x, y, ownerId: ball.id,
      age: 0, bloomDur: 2, detonated: false, detonateAge: 0,
      hitIds: new Set(),
    });
  },
  update(dt){
    for(let i=this.entities.length-1;i>=0;i--){
      const e = this.entities[i];
      e.age += dt;
      if(!e.detonated && e.age >= e.bloomDur){
        e.detonated = true;
        const N = 8;
        for(let k=0;k<N;k++){
          const ang = (k/N)*TAU;
          const far = 220*world.dpr;
          for(let dist=20; dist<far; dist+=30*world.dpr){
            const px = e.x + Math.cos(ang)*dist;
            const py = e.y + Math.sin(ang)*dist;
            world.particles.push({
              x: px + rand(-8,8)*world.dpr, y: py + rand(-8,8)*world.dpr,
              vx: rand(-50,50)*world.dpr, vy: rand(-50,50)*world.dpr,
              life: 0.65, maxLife: 0.65,
              color: Math.random()<0.5 ? '#ec4899' : '#fbcfe8',
              size: rand(2,4.5)*world.dpr, drag: 0.9
            });
          }
          for(const b of world.balls){
            if(!b.alive || b.id === e.ownerId || e.hitIds.has(b.id)) continue;
            const dx = b.x - e.x, dy = b.y - e.y;
            const proj = dx*Math.cos(ang) + dy*Math.sin(ang);
            if(proj < 0 || proj > far) continue;
            const perp = Math.abs(-dx*Math.sin(ang) + dy*Math.cos(ang));
            if(perp < 32*world.dpr){
              e.hitIds.add(b.id);
              damageBall(b, 16, 'explosive_flower');
              b.vx += Math.cos(ang)*200*world.dpr;
              b.vy += Math.sin(ang)*200*world.dpr;
            }
          }
        }
        world.shockwaves.push({ x:e.x, y:e.y, r:0, maxR:240*world.dpr, color:'#ec4899', life:0.6, maxLife:0.6, width:6 });
        world.shake = Math.max(world.shake, 10*world.dpr);
        e.detonateAge = 0;
      }
      if(e.detonated){
        e.detonateAge += dt;
        if(e.detonateAge > 0.7) this.entities.splice(i,1);
      }
    }
  },
  render(c){
    for(const e of this.entities){
      const N = 8;
      if(!e.detonated){
        const bloomP = easeOut(Math.min(1, e.age / e.bloomDur));
        c.save();
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, 70*world.dpr * bloomP);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.4, 'rgba(236,72,153,0.75)');
        g.addColorStop(1, 'rgba(236,72,153,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(e.x, e.y, 70*world.dpr*bloomP, 0, TAU); c.fill();
        c.restore();
        for(let k=0;k<N;k++){
          const ang = (k/N)*TAU + world.time*0.6;
          const petalLen = 100*world.dpr * bloomP;
          const petalW = 24*world.dpr * bloomP;
          const px = e.x + Math.cos(ang)*petalLen*0.5;
          const py = e.y + Math.sin(ang)*petalLen*0.5;
          c.save();
          c.translate(px, py);
          c.rotate(ang);
          const grad = c.createLinearGradient(-petalLen*0.5, 0, petalLen*0.5, 0);
          grad.addColorStop(0, '#ec4899');
          grad.addColorStop(0.5, '#fbcfe8');
          grad.addColorStop(1, '#ec4899');
          c.fillStyle = grad;
          c.shadowColor = '#ec4899';
          c.shadowBlur = 18*world.dpr;
          c.beginPath();
          c.ellipse(0, 0, petalLen*0.5, petalW*0.5, 0, 0, TAU);
          c.fill();
          c.strokeStyle = '#ffffff';
          c.lineWidth = 1.5*world.dpr;
          c.stroke();
          // petal vein
          c.strokeStyle = 'rgba(255,200,220,0.8)';
          c.lineWidth = 1*world.dpr;
          c.beginPath();
          c.moveTo(-petalLen*0.3, 0);
          c.lineTo(petalLen*0.3, 0);
          c.stroke();
          c.restore();
        }
      } else {
        const fade = 1 - e.detonateAge / 0.7;
        c.save();
        c.globalAlpha = fade;
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, 240*world.dpr);
        g.addColorStop(0, 'rgba(236,72,153,0.65)');
        g.addColorStop(1, 'rgba(236,72,153,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(e.x, e.y, 240*world.dpr, 0, TAU); c.fill();
        c.restore();
      }
    }
  }
};

// ═══ 14. SCEAU D'EMPRISONNEMENT ═══
POWERS.imprisonment_seal = {
  name:'Sceau d\'Emprisonnement', icon:'⬡', color:'#a78bfa',
  desc:'Runes et cage d\'énergie piègent une zone.',
  entities: [],
  cast(ball){
    const target = nearestEnemy(ball);
    const tx = target ? target.x : world.arena.cx;
    const ty = target ? target.y : world.arena.cy;
    this.entities.push({
      x: tx, y: ty, age: 0,
      runeDur: 0.55, wallDur: 1.7,
      radius: 110*world.dpr, ownerId: ball.id,
      trappedIds: new Set(), released: false, releaseAge: 0,
    });
  },
  update(dt){
    for(let i=this.entities.length-1;i>=0;i--){
      const e = this.entities[i];
      e.age += dt;
      if(e.age < e.runeDur) continue;
      if(!e.released){
        for(const b of world.balls){
          if(!b.alive) continue;
          const dx = b.x-e.x, dy = b.y-e.y, d = Math.hypot(dx,dy);
          if(d < e.radius + b.r){
            if(!e.trappedIds.has(b.id)){
              e.trappedIds.add(b.id);
              damageBall(b, 8, 'imprisonment_seal');
            }
            if(d > e.radius - b.r){
              const nx = dx/d, ny = dy/d;
              b.x = e.x + nx*(e.radius - b.r - 2);
              b.y = e.y + ny*(e.radius - b.r - 2);
              const radial = b.vx*nx + b.vy*ny;
              if(radial > 0){ b.vx -= radial*nx; b.vy -= radial*ny; }
            }
          }
        }
        if(e.age >= e.runeDur + e.wallDur){
          e.released=true;e.collapseAge=0;
          for(const b of world.balls){
            if(!b.alive)continue;
            if(Math.hypot(b.x-e.x,b.y-e.y)<=e.radius+b.r){
              damageBall(b,18,'imprisonment_seal');
              const dx=e.x-b.x,dy=e.y-b.y,d=Math.hypot(dx,dy)||1;
              b.vx+=dx/d*150*world.dpr;b.vy+=dy/d*150*world.dpr;
            }
          }
          world.shake=Math.max(world.shake,7*world.dpr);
        }
      } else {
        e.collapseAge+=dt;
        if(e.collapseAge>0.16)this.entities.splice(i,1);
      }
    }
  },
  render(c){
    for(const e of this.entities){
      if(e.released){
        const p=Math.max(0,1-e.collapseAge/0.16);
        c.save();c.globalAlpha=p;c.strokeStyle='#c4b5fd';c.lineWidth=(2.5+5*(1-p))*world.dpr;
        c.shadowColor='#a78bfa';c.shadowBlur=18*world.dpr*p;
        c.beginPath();c.arc(e.x,e.y,e.radius*p,0,TAU);c.stroke();c.restore();continue;
      }
      const wallP = e.age < e.runeDur ? 0 : Math.min(1, (e.age - e.runeDur) / 0.35);
      c.save();
      c.globalAlpha = 0.6 + 0.4*Math.sin(world.time*8);
      c.strokeStyle = '#a78bfa';
      c.shadowColor = '#a78bfa';
      c.shadowBlur = 18*world.dpr;
      c.lineWidth = 2.5*world.dpr;
      c.beginPath(); c.arc(e.x, e.y, e.radius, 0, TAU); c.stroke();
      const N = 6;
      c.beginPath();
      for(let i=0;i<=N;i++){
        const ang = (i/N)*TAU + world.time*0.35;
        const px = e.x + Math.cos(ang)*e.radius*0.6;
        const py = e.y + Math.sin(ang)*e.radius*0.6;
        if(i===0) c.moveTo(px,py); else c.lineTo(px,py);
      }
      c.stroke();
      for(let i=0;i<N;i++){
        const ang = (i/N)*TAU + world.time*0.35;
        c.beginPath();
        c.moveTo(e.x, e.y);
        c.lineTo(e.x + Math.cos(ang)*e.radius, e.y + Math.sin(ang)*e.radius);
        c.stroke();
      }
      c.restore();
      if(wallP > 0){
        c.save();
        c.globalCompositeOperation = 'lighter';
        const wallHeight = 70 * wallP * world.dpr;
        const panelCount = 28;
        for(let i=0;i<panelCount;i++){
          const ang = (i/panelCount)*TAU;
          const px = e.x + Math.cos(ang)*e.radius;
          const py = e.y + Math.sin(ang)*e.radius;
          c.save();
          c.translate(px, py);
          c.rotate(ang + Math.PI/2);
          c.globalAlpha = 0.3 + 0.55*Math.sin(world.time*8 + i*0.3);
          c.fillStyle = '#a78bfa';
          c.shadowColor = '#a78bfa';
          c.shadowBlur = 14*world.dpr;
          c.fillRect(-3*world.dpr, -wallHeight, 6*world.dpr, wallHeight);
          c.restore();
        }
        c.restore();
      }
    }
  }
};

// ══════════════════════════════════════════════════════════════════
// PROJECTILES
// ══════════════════════════════════════════════════════════════════


function updateProjectiles(dt){
  for(let i = world.projectiles.length-1; i>=0; i--){
    const p = world.projectiles[i];
    p.life -= dt;
    if(p.type === 'missile'){
      const target = world.balls.find(b=>b.id===p.targetId && b.alive);
      if(target){
        const desired = Math.atan2(target.y - p.y, target.x - p.x);
        let da = desired - p.angle;
        while(da > Math.PI) da -= TAU;
        while(da < -Math.PI) da += TAU;
        p.angle += clamp(da, -(p.turnRate || 1.15)*dt, (p.turnRate || 1.15)*dt);
      }
      p.speed = Math.min(p.speed + 90*world.dpr*dt, 330*world.dpr);
      p.vx = Math.cos(p.angle)*p.speed;
      p.vy = Math.sin(p.angle)*p.speed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.trail.push({x:p.x, y:p.y});
      if(p.trail.length > 22) p.trail.shift();
      if(Math.random()<0.95) trailParticle(p.x, p.y, '#fb923c', 70*world.dpr, 0.45, p.angle+Math.PI, 0.4);
      if(Math.random()<0.5) trailParticle(p.x, p.y, '#fde047', 110*world.dpr, 0.3, p.angle+Math.PI, 0.3);
      for(const b of world.balls){
        if(!b.alive || b.id === p.ownerId) continue;
        if(Math.hypot(b.x-p.x, b.y-p.y) < b.r + 6*world.dpr){
          damageBall(b, p.damage, 'star_hunter');
          world.shockwaves.push({ x:p.x, y:p.y, r:0, maxR:70*world.dpr, color:'#fb923c', life:0.4, maxLife:0.4, width:4 });
          world.shockwaves.push({ x:p.x, y:p.y, r:0, maxR:40*world.dpr, color:'#ffffff', life:0.25, maxLife:0.25, width:2 });
          burstParticles(p.x, p.y, '#fb923c', 24, 380*world.dpr, 0.6);
          burstParticles(p.x, p.y, '#fde047', 14, 260*world.dpr, 0.5);
          world.shake = Math.max(world.shake, 6*world.dpr);
          world.projectiles.splice(i,1);
          break;
        }
      }
    }
    else if(p.type === 'bomb'){
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.fuse += dt;
      if(Math.random()<0.7) trailParticle(p.x, p.y, '#22d3ee', 80*world.dpr, 0.5, Math.atan2(-p.vy,-p.vx), 0.8);
      let hit = false;
      for(const b of world.balls){
        if(!b.alive || b.id === p.ownerId) continue;
        if(Math.hypot(b.x-p.x, b.y-p.y) < b.r + 8*world.dpr){ hit = true; break; }
      }
      const a = world.arena;
      if(p.x < a.x || p.x > a.x+a.w || p.y < a.y || p.y > a.y+a.h) hit = true;
      if(hit){ explodeBomb(p.x, p.y, p.ownerId); world.projectiles.splice(i,1); }
    }
    if(p.type==='missile'){
      const a = world.arena;
      if(p.x < a.x || p.x > a.x+a.w || p.y < a.y || p.y > a.y+a.h){
        burstParticles(p.x, p.y, '#fb923c', 18, 300*world.dpr, 0.5);
        world.projectiles.splice(i,1);
        continue;
      }
    }
    if(p.life <= 0){
      if(p.type==='bomb') explodeBomb(p.x, p.y, p.ownerId);
      world.projectiles.splice(i,1);
    }
  }
}

function explodeBomb(x,y,ownerId){
  world.shockwaves.push({ x,y, r:0, maxR: 150*world.dpr, color:'#22d3ee', life:0.6, maxLife:0.6, width:6 });
  world.shockwaves.push({ x,y, r:0, maxR: 100*world.dpr, color:'#ffffff', life:0.35, maxLife:0.35, width:3.5 });
  world.shockwaves.push({ x,y, r:0, maxR: 60*world.dpr, color:'#a5f3fc', life:0.25, maxLife:0.25, width:2.5 });
  burstParticles(x,y,'#22d3ee', 46, 540*world.dpr, 0.85);
  burstParticles(x,y,'#a5f3fc', 24, 380*world.dpr, 0.65);
  burstParticles(x,y,'#ffffff', 14, 260*world.dpr, 0.45);
  world.shake = Math.max(world.shake, 10*world.dpr);
  for(let i=0;i<8;i++){
    const ang = (i/8)*TAU + rand(-0.1, 0.1);
    world.projectiles.push({
      type:'shrapnel', x, y,
      vx: Math.cos(ang)*380*world.dpr,
      vy: Math.sin(ang)*380*world.dpr,
      life: 0.65, maxLife: 0.65,
      ownerId, color:'#a5f3fc', damage: 5, angle: ang,
    });
  }
  for(const b of world.balls){
    if(!b.alive || b.id === ownerId) continue;
    const d = Math.hypot(b.x-x, b.y-y);
    if(d < 150*world.dpr){
      const f = 1 - d/(150*world.dpr);
      damageBall(b, 16*f, 'bomb_shrapnel');
    }
  }
}

function updateShrapnels(dt){
  for(let i = world.projectiles.length-1; i>=0; i--){
    const p = world.projectiles[i];
    if(p.type !== 'shrapnel') continue;
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.95; p.vy *= 0.95;
    if(Math.random()<0.7) trailParticle(p.x, p.y, '#a5f3fc', 50*world.dpr, 0.35, Math.atan2(-p.vy,-p.vx), 1.0);
    for(const b of world.balls){
      if(!b.alive || b.id === p.ownerId) continue;
      if(Math.hypot(b.x-p.x, b.y-p.y) < b.r + 4*world.dpr){
        damageBall(b, p.damage, 'bomb_shrapnel');
        p.life = 0;
        break;
      }
    }
    if(p.life <= 0) world.projectiles.splice(i,1);
  }
}

// ══════════════════════════════════════════════════════════════════
// BALL AI
// ══════════════════════════════════════════════════════════════════
function updateBallAI(b, dt){
  if(!b.alive) return;
  if(b._frozen){ b.vx = 0; b.vy = 0; b.invuln = Math.max(0, b.invuln - dt); return; }
  b.perturbTimer -= dt;
  if(b.perturbTimer <= 0){
    b.perturbTimer = rand(1.2, 3.0);
    const ang = Math.atan2(b.vy, b.vx) + rand(-0.45, 0.45);
    const sp = Math.hypot(b.vx, b.vy) || CFG.ballSpeed;
    b.vx = Math.cos(ang) * sp;
    b.vy = Math.sin(ang) * sp;
  }
  const sp = Math.hypot(b.vx, b.vy);
  if(sp > 0.01){
    const target = CFG.ballSpeed * (b.colossus > 0 ? 0.7 : 1);
    b.vx = b.vx / sp * target;
    b.vy = b.vy / sp * target;
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  world.arena.resolve(b);
  b.trail.push({x:b.x, y:b.y});
  if(b.trail.length > 14) b.trail.shift();
  if(b.invuln > 0) b.invuln -= dt;
}

function ballCollisions(){
  for(let i=0;i<world.balls.length;i++){
    const a = world.balls[i];
    if(!a.alive) continue;
    for(let j=i+1;j<world.balls.length;j++){
      const b = world.balls[j];
      if(!b.alive) continue;
      const dx = b.x-a.x, dy = b.y-a.y;
      const d = Math.hypot(dx,dy);
      const minD = a.r + b.r;
      if(d < minD && d > 0){
        const nx = dx/d, ny = dy/d;
        const overlap = minD - d;
        a.x -= nx*overlap*0.5; a.y -= ny*overlap*0.5;
        b.x += nx*overlap*0.5; b.y += ny*overlap*0.5;
        const rel = (a.vx-b.vx)*nx + (a.vy-b.vy)*ny;
        if(rel > 0){
          a.vx -= rel*nx; a.vy -= rel*ny;
          b.vx += rel*nx; b.vy += rel*ny;
        }
        if(!a._cT || world.time > a._cT[b.id]){
          a._cT = a._cT || {}; b._cT = b._cT || {};
          const mult = a.colossus > 0 ? 1.35 : 1;
          damageBall(b, 4*mult, 'contact');
          damageBall(a, 4, 'contact');
          a._cT[b.id] = world.time + 0.5;
          b._cT[a.id] = world.time + 0.5;
        }
      }
    }
  }
}

function updateNovas(dt){
  for(const s of world.shockwaves){
    if(s.kind !== 'nova') continue;
    const rNow = s.maxR * (1 - s.life/s.maxLife);
    for(const b of world.balls){
      if(!b.alive || s.hitIds.has(b.id)) continue;
      const d = Math.hypot(b.x - s.sourceX, b.y - s.sourceY);
      if(d < rNow + b.r){
        s.hitIds.add(b.id);
        const ang = Math.atan2(b.y - s.sourceY, b.x - s.sourceX);
        b.vx += Math.cos(ang) * s.knockback;
        b.vy += Math.sin(ang) * s.knockback;
        damageBall(b, 14, 'seismic_nova');
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// UPDATES
// ══════════════════════════════════════════════════════════════════
function updateParticles(dt){
  for(let i=world.particles.length-1; i>=0; i--){
    const p = world.particles[i];
    p.life -= dt;
    if(p.life <= 0){ world.particles.splice(i,1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= (p.drag ?? 0.94);
    p.vy *= (p.drag ?? 0.94);
  }
}

function updateShockwaves(dt){
  for(let i=world.shockwaves.length-1; i>=0; i--){
    const s = world.shockwaves[i];
    s.life -= dt;
    if(s.life <= 0){ world.shockwaves.splice(i,1); continue; }
    s.r = s.maxR * (1 - s.life/s.maxLife);
  }
}

function updateDamageTexts(dt){
  for(let i=world.damageTexts.length-1; i>=0; i--){
    const d = world.damageTexts[i];
    d.life -= dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vy += 220*world.dpr * dt;
    d.vx *= 0.94;
    d.scale = Math.min(1, d.scale + dt*6);
    if(d.life <= 0) world.damageTexts.splice(i,1);
  }
}

// ══════════════════════════════════════════════════════════════════
// RENDERS
// ══════════════════════════════════════════════════════════════════

function renderParticles(c){
  c.save();
  c.globalCompositeOperation = 'lighter';
  for(const p of world.particles){
    const t = p.life / p.maxLife;
    c.globalAlpha = t;
    c.fillStyle = p.color;
    c.shadowColor = p.color;
    c.shadowBlur = 8*world.dpr;
    c.beginPath();
    c.arc(p.x, p.y, p.size * t, 0, TAU);
    c.fill();
  }
  c.restore();
}

function renderShockwaves(c){
  c.save();
  c.globalCompositeOperation = 'lighter';
  for(const s of world.shockwaves){
    const t = s.life / s.maxLife;
    c.globalAlpha = t;
    c.strokeStyle = s.color;
    c.lineWidth = (s.width ?? 3) * t;
    c.shadowColor = s.color;
    c.shadowBlur = 20*world.dpr;
    c.beginPath();
    c.arc(s.x, s.y, s.r, 0, TAU);
    c.stroke();
  }
  c.restore();
}

function renderDamageTexts(c){
  for(const d of world.damageTexts){
    const t = d.life / d.maxLife;
    c.save();
    c.globalAlpha = Math.min(1, t*2);
    const sz = 16*world.dpr * d.scale;
    c.font = `900 ${sz}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineWidth = Math.max(2, sz*0.18);
    c.strokeStyle = 'rgba(0,0,0,0.85)';
    c.strokeText(d.val, d.x, d.y);
    c.fillStyle = d.color;
    c.shadowColor = d.color;
    c.shadowBlur = 8*world.dpr;
    c.fillText(d.val, d.x, d.y);
    c.restore();
  }
}

function renderProjectiles(c){
  for(const p of world.projectiles){
    if(p.type === 'missile'){
      c.save();
      c.globalCompositeOperation = 'lighter';
      for(let i=0;i<p.trail.length;i++){
        const t = p.trail[i];
        const a = i/p.trail.length;
        c.globalAlpha = a * 0.7;
        c.fillStyle = '#fb923c';
        c.beginPath(); c.arc(t.x, t.y, 1 + 7*a*world.dpr, 0, TAU); c.fill();
      }
      c.restore();
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.angle);
      c.shadowColor = '#fb923c';
      c.shadowBlur = 24*world.dpr;
      c.fillStyle = '#fb923c';
      c.beginPath();
      c.moveTo(10*world.dpr, 0);
      c.lineTo(-7*world.dpr, 6*world.dpr);
      c.lineTo(-4*world.dpr, 0);
      c.lineTo(-7*world.dpr, -6*world.dpr);
      c.closePath();
      c.fill();
      c.fillStyle = '#fff7ed';
      c.beginPath(); c.arc(0,0, 3*world.dpr, 0, TAU); c.fill();
      c.restore();
    }
    else if(p.type === 'bomb'){
      const pulse = 0.5 + 0.5*Math.sin(p.fuse*22);
      c.save();
      c.shadowColor = '#22d3ee';
      c.shadowBlur = (16 + pulse*14)*world.dpr;
      const g = c.createRadialGradient(p.x - 3*world.dpr, p.y - 3*world.dpr, 0, p.x, p.y, (10+pulse*2)*world.dpr);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.4, '#22d3ee');
      g.addColorStop(1, '#0891b2');
      c.fillStyle = g;
      c.beginPath(); c.arc(p.x, p.y, (9 + pulse*2)*world.dpr, 0, TAU); c.fill();
      c.strokeStyle = '#a5f3fc';
      c.lineWidth = 1.5*world.dpr;
      c.beginPath(); c.arc(p.x, p.y, (11 + pulse*2)*world.dpr, 0, TAU); c.stroke();
      c.restore();
    }
    else if(p.type === 'shrapnel'){
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.shadowColor = '#a5f3fc';
      c.shadowBlur = 14*world.dpr;
      c.fillStyle = '#a5f3fc';
      c.beginPath(); c.arc(p.x, p.y, 4*world.dpr, 0, TAU); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(p.x, p.y, 1.8*world.dpr, 0, TAU); c.fill();
      c.restore();
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// MAIN LOOP
// ══════════════════════════════════════════════════════════════════
let lastT = 0;


// Chaque pouvoir est déclenché une seule fois à son acquisition. Les effets persistants
// continuent via original.update, mais aucun recast automatique n'est effectué.
let lastUpdate=new WeakMap();let lastPowerRender=new WeakMap();let lastSystemUpdate=null;
function syncWorld(w){realWorld=w;state.time=world.time||state.time;}
Object.keys(POWERS).forEach(id=>{
 const original=POWERS[id];
 window.AbilityBehaviors[id]={
  attach(ball,w,slot){
   syncWorld(w);slot.data={originalId:id,used:true};
   try{
    if(id==='quantum_jump')slot.data.jokerReady=true;
    else if(id==='seismic_nova')state.pendingCasts.push({powerId:id,ownerId:ball.id,ball:realBall(ball),timer:2});
    else original.cast(proxyBall(ball));
    if(window.audioSynth)window.audioSynth.playFx('power',{powerId:id,volume:.20});
   }catch(e){console.warn('[Powers Final cast]',id,e);}
  },
  update(ball,w,slot,dt){
   syncWorld(w);
   const frame=world.time;
   if(lastUpdate.get(original)!==frame){
    lastUpdate.set(original,frame);
    try{
     if(original.update)original.update(dt);
    }catch(e){console.warn('[Powers Final update]',id,e);}
   }
   if(lastSystemUpdate!==frame){
    lastSystemUpdate=frame;
    try{
     if(frame!==undefined&&frame!==null)state.time=frame;
     for(let i=state.pendingCasts.length-1;i>=0;i--){
      const pending=state.pendingCasts[i];pending.timer-=dt;
      if(pending.timer<=0){
       state.pendingCasts.splice(i,1);
       const owner=world.balls.find(b=>b.id===pending.ownerId)||pending.ball;
       if(owner)POWERS[pending.powerId].castNow(proxyBall(owner));
      }
     }
     updateProjectiles(dt);updateShrapnels(dt);updateNovas(dt);updateParticles(dt);updateShockwaves(dt);updateDamageTexts(dt);
    }catch(e){console.warn('[Powers Final effects update]',e);}
   }
   // Pas de recast : le pouvoir ne s'active qu'à l'acquisition.
   // Les animations et effets déjà créés restent mis à jour normalement.
  },
  onTakeDamage(target,attacker,amount,w,slot){
   if(id==='quantum_jump'&&slot?.data?.jokerReady&&amount>0){
    slot.data.jokerReady=false;slot.timeLeft=0;
    try{original.cast(proxyBall(target));}catch(e){console.warn('[Quantum Joker]',e);}
    return 0;
   }
   if(id==='prism_reflector'&&target&&target.prism>0){
    if(attacker&&attacker.alive)world.damage(attacker,target,amount*.45,'prism_reflector',{ignoreInvuln:true,noPowerReflect:true});
    return amount*.4;
   }
   return amount;
  },
  render(ctx,ball,w,slot){
   syncWorld(w);
   try{
    const frame=world.time;
    if(lastRenderFrame!==frame){lastRenderFrame=frame;renderParticles(ctx);renderShockwaves(ctx);renderDamageTexts(ctx);renderProjectiles(ctx);}
    if(lastPowerRender.get(original)!==frame){lastPowerRender.set(original,frame);original.render(ctx);}
   }catch(e){console.warn('[Powers Final render]',id,e);}
  }
 };
});
let lastRenderFrame=null;
window.AbilityBehaviors.resetAll=function(){
 const keys=['projectiles','particles','shockwaves','decoys','beams','zones','damageTexts','shrapnels','novas','pendingCasts'];
 for(const key of keys) state[key].length=0;
 state.time=0;state.shake=0;realWorld=null;
 for(const power of Object.values(POWERS)){if(Array.isArray(power.entities))power.entities.length=0;}
 lastUpdate=new WeakMap();lastPowerRender=new WeakMap();lastSystemUpdate=null;lastRenderFrame=null;
};
window.PowersFinalOriginal=POWERS;
})();