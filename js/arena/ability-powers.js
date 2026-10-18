/* BallYstik v2-power — 10 pouvoirs à signatures visuelles uniques. Effets dessinés en Canvas. */
(function () {
'use strict';
window.AbilityBehaviors = {};
const TAU = Math.PI * 2;
const IDS = [
'judgment_ray','star_hunter','bomb_shrapnel','seismic_nova','magma_rift',
'singularity','quantum_jump','colossus','prism_reflector','multiplication'
];
function enemies(ball, world) { return world.balls.filter(b => b !== ball && b.alive && !b.isClone && b.team !== ball.team); }
function nearest(ball, world, max) {
  let target = null, best = (max == null ? Infinity : max * max);
  for (const b of enemies(ball, world)) { const dx=b.x-ball.x,dy=b.y-ball.y,d=dx*dx+dy*dy; if(d<best){best=d;target=b;} }
  return target;
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function burst(world,x,y,color,count,force){world.spawnParticle(x,y,{color,count:count||18,speed:force||260,life:.55,spread:TAU,size:2.8});world.addShockwave(x,y,{radius:120,color,life:.38});}
function hit(ball,target,world,damage,push,color,source) {
  if(!target || !target.alive) return;
  const dx=target.x-ball.x,dy=target.y-ball.y,len=Math.hypot(dx,dy)||1;
  world.damage(target,ball,damage,source||'power');
  target.vx += dx/len*(push||120); target.vy += dy/len*(push||120);
  world.spawnParticle(target.x,target.y,{color:color||'#7ce7ff',count:7,speed:150,life:.35,spread:TAU});
}
function radial(ball,world,radius,damage,push,color,source) {
  for(const target of enemies(ball,world)){const d=distance(ball,target);if(d<radius+target.radius){const fall=Math.max(.25,1-d/radius);hit(ball,target,world,damage*fall,push*fall,color,source);}}
  burst(world,ball.x,ball.y,color,26,330);
}
function ring(ctx,x,y,r,color,a,width) {
  ctx.save();ctx.globalAlpha=a==null?1:a;ctx.strokeStyle=color;ctx.lineWidth=width||3;ctx.shadowColor=color;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(x,y,Math.max(1,r),0,TAU);ctx.stroke();ctx.restore();
}
function glow(ctx,x,y,r,color,a) {
  ctx.save();ctx.globalAlpha=a==null?1:a;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'55');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();
}
function projectile(world,ball,target,opts) {
  const dx=(target?target.x:ball.x+ball.vx)-ball.x,dy=(target?target.y:ball.y+ball.vy)-ball.y,len=Math.hypot(dx,dy)||1;
  const p={x:ball.x+dx/len*ball.radius,y:ball.y+dy/len*ball.radius,vx:dx/len*opts.speed,vy:dy/len*opts.speed,radius:opts.radius||6,life:opts.life||2.5,bounces:opts.bounces||0,ownerId:ball.id,color:opts.color||'#7ce7ff',damage:opts.damage||10,splashRadius:opts.splashRadius||0,type:opts.type||'power',trail:[],powerId:opts.powerId||'',target:opts.target||null};
  p.render=function(ctx,q){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor=q.color;ctx.shadowBlur=q.type==='bomb-shrapnel'?24:18;
    if(q.type==='bomb-shrapnel'){
      ctx.strokeStyle=q.color;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(q.x,q.y,q.radius*1.65,q.radius*.78,Math.atan2(q.vy,q.vx),0,TAU);ctx.stroke();
      ctx.fillStyle=q.color;ctx.beginPath();ctx.arc(q.x,q.y,q.radius,0,TAU);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q.x-q.radius*.25,q.y-q.radius*.25,q.radius*.35,0,TAU);ctx.fill();
    } else if(q.type==='star-hunter'){
      // La courbe orange persistante rend immédiatement le guidage distinct du tir rectiligne.
      const trail=q.trail||[];
      for(let i=1;i<trail.length;i++){
        const a=trail[i-1],b=trail[i],alpha=i/trail.length;
        ctx.globalAlpha=.12+.68*alpha;ctx.strokeStyle=q.color;ctx.lineWidth=2+4*alpha;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      if(trail.length){const last=trail[trail.length-1];ctx.globalAlpha=.85;ctx.strokeStyle='#fed7aa';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
      const angle=Math.atan2(q.vy,q.vx);
      ctx.globalAlpha=1;ctx.fillStyle=q.color;ctx.beginPath();
      ctx.moveTo(q.x+Math.cos(angle)*q.radius*1.8,q.y+Math.sin(angle)*q.radius*1.8);
      ctx.lineTo(q.x+Math.cos(angle+2.45)*q.radius*1.5,q.y+Math.sin(angle+2.45)*q.radius*1.5);
      ctx.lineTo(q.x+Math.cos(angle-2.45)*q.radius*1.5,q.y+Math.sin(angle-2.45)*q.radius*1.5);
      ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q.x,q.y,q.radius*.55,0,TAU);ctx.fill();
    } else {
      ctx.strokeStyle=q.color;ctx.lineWidth=q.radius*1.1;ctx.beginPath();ctx.moveTo(q.x-q.vx*.035,q.y-q.vy*.035);ctx.lineTo(q.x,q.y);ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q.x,q.y,q.radius*.55,0,TAU);ctx.fill();
    }
    ctx.restore();
  };
  world.projectiles.push(p);return p;
}
function createState(){return {cooldown:.5,clock:0,active:0,charge:0,target:null,zones:[],hitTimers:{},angle:0,phase:0,portal:null,clones:[],turret:null,drones:[]};}
function tickZones(ball,world,d,dt,kind) {
  for(let i=d.zones.length-1;i>=0;i--){
    const z=d.zones[i];z.life-=dt;z.tick=(z.tick||0)-dt;
    if(z.life<=0){d.zones.splice(i,1);continue;}
    for(const target of enemies(ball,world)){
      if(distance(z,target)<z.r+target.radius && z.tick<=0){
        if(kind==='magma'||kind==='comet'||kind==='toxic') world.damage(target,ball,kind==='toxic'?2.2:3.5,kind,'power-zone');
        if(kind==='ice'){target._powerSlowTimer=Math.max(target._powerSlowTimer||0,1.5);target.vx*=.94;target.vy*=.94;}
        if(kind==='toxic'){target._powerPoisonTimer=Math.max(target._powerPoisonTimer||0,.7);}
        z.tick=kind==='toxic'?.55:.35;
      }
    }
  }
}
function renderZones(ctx,d,color,fillAlpha) {
  for(const z of d.zones){const a=Math.min(1,z.life/(z.maxLife||z.life));glow(ctx,z.x,z.y,z.r*1.4,color,.18*a);ctx.save();ctx.globalAlpha=(fillAlpha||.12)*a;ctx.fillStyle=color;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();ctx.restore();ring(ctx,z.x,z.y,z.r,color,.65*a,2);}
}
function renderMagmaTrail(ctx,d) {
  const zones=d.zones||[];
  if(!zones.length)return;
  ctx.save();
  ctx.lineCap='round';ctx.lineJoin='round';ctx.globalCompositeOperation='lighter';
  // Relie les impacts successifs pour que le spectateur lise une vraie fissure, pas des cercles isolés.
  for(let i=1;i<zones.length;i++){
    const a=zones[i-1],b=zones[i],alpha=Math.max(.12,Math.min(a.life,b.life)/3);
    ctx.globalAlpha=alpha;ctx.strokeStyle='#ff4b12';ctx.shadowColor='#ff5a1f';ctx.shadowBlur=26;ctx.lineWidth=27;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.strokeStyle='#ffb347';ctx.shadowColor='#ffd166';ctx.shadowBlur=12;ctx.lineWidth=10;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  for(const z of zones){
    const a=Math.max(.12,Math.min(1,z.life/3));
    glow(ctx,z.x,z.y,z.r*1.7,'#ff4b12',.34*a);
    ctx.globalAlpha=a;ctx.fillStyle='#ff5a1f';ctx.shadowColor='#ff4b12';ctx.shadowBlur=20;
    ctx.beginPath();ctx.arc(z.x,z.y,z.r*.78,0,TAU);ctx.fill();
    ctx.globalAlpha=a*.95;ctx.fillStyle='#ffd166';ctx.shadowColor='#fff1a8';ctx.shadowBlur=12;
    ctx.beginPath();ctx.arc(z.x,z.y,z.r*.34,0,TAU);ctx.fill();
    // Petites pointes irrégulières évoquant la lave qui jaillit de la fissure.
    for(let k=0;k<4;k++){
      const angle=(k/4)*TAU+z.x*.013;
      const x1=z.x+Math.cos(angle)*z.r*.55,y1=z.y+Math.sin(angle)*z.r*.55;
      const x2=z.x+Math.cos(angle+.16)*z.r*1.12,y2=z.y+Math.sin(angle+.16)*z.r*1.12;
      ctx.strokeStyle='#ffb347';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    }
  }
  ctx.restore();
}
function active(ball,d,seconds){d.active=seconds;d.cooldown=seconds;}
function updatePower(id,ball,world,slot,dt) {
 const d=slot.data;if(!d)return;
 d.clock+=dt;d.phase+=dt;
 d.cooldown-=dt;
 for(const k in d.hitTimers){d.hitTimers[k]-=dt;if(d.hitTimers[k]<=0)delete d.hitTimers[k];}
 if(d.active>0)d.active=Math.max(0,d.active-dt);
 if(d.portal){d.portal.life-=dt;if(d.portal.life<=0)d.portal=null;}
 if(id==='judgment_ray'){
   const target=nearest(ball,world,720);
   if(target&&d.cooldown<=.6){d.target=target;d.charge=Math.min(.6,d.charge+dt);}else{d.charge=0;d.target=null;}
   if(d.charge>=.6&&d.cooldown<=.6){const x1=ball.x,y1=ball.y,x2=target.x,y2=target.y,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;const struck=[];for(const victim of enemies(ball,world)){const px=victim.x-x1,py=victim.y-y1,along=(px*dx+py*dy)/(len*len),side=Math.abs(px*dy-py*dx)/len;if(along>0&&along<=1.25&&side<victim.radius+18){struck.push({victim,along});}}struck.sort((a,b)=>a.along-b.along);for(const item of struck.slice(0,2)){world.damage(item.victim,ball,item.along>1?9:18,'judgment-ray');world.spawnParticle(item.victim.x,item.victim.y,{color:'#7ce7ff',count:12,speed:210,life:.35,spread:TAU});}d.beam={x1,y1,x2,y2,life:.22};d.cooldown=2.2;d.charge=0;d.target=null;}
   if(d.beam){d.beam.life-=dt;if(d.beam.life<=0)d.beam=null;}
 } else if(id==='star_hunter'){
   for(const p of world.projectiles){if(p.ownerId!==ball.id||p.powerId!==id||!p.target||!p.target.alive)continue;const dx=p.target.x-p.x,dy=p.target.y-p.y,l=Math.hypot(dx,dy)||1;p.vx+=(dx/l)*1300*dt;p.vy+=(dy/l)*1300*dt;const s=Math.hypot(p.vx,p.vy)||1;if(s>540){p.vx=p.vx/s*540;p.vy=p.vy/s*540;}}
   if(d.cooldown<=0){const t=nearest(ball,world,750);if(t){projectile(world,ball,t,{powerId:id,target:t,speed:280,life:2.6,damage:20,splashRadius:0,radius:7,color:'#fb923c',type:'star-hunter'});d.cooldown=2.8;}}
 } else if(id==='bomb_shrapnel'){
   if(d.cooldown<=0){const t=nearest(ball,world,750);if(t){const p=projectile(world,ball,t,{powerId:id,speed:330,life:2.6,damage:15,splashRadius:92,radius:9,color:'#38bdf8',type:'bomb-shrapnel'});p.shrapnel=true;d.cooldown=3.2;}}
 } else if(id==='ghost_billiard'){
   if(d.cooldown<=0){const t=nearest(ball,world,750);if(t){const a=Math.atan2(t.y-ball.y,t.x-ball.x);for(let i=-1;i<=1;i++){const angle=a+i*.22;world.projectiles.push({x:ball.x+Math.cos(angle)*ball.radius,y:ball.y+Math.sin(angle)*ball.radius,vx:Math.cos(angle)*610,vy:Math.sin(angle)*610,radius:5,life:2.5,bounces:3,ownerId:ball.id,color:'#c084fc',damage:9,type:'ghost-billiard',trail:[],render:function(ctx,p){ctx.save();ctx.shadowColor='#c084fc';ctx.shadowBlur=20;ctx.fillStyle='#f5d0fe';ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,TAU);ctx.fill();ctx.restore();}});}d.cooldown=2.3;}}
 } else if(id==='seismic_nova'){
   if(d.cooldown<=0){radial(ball,world,175,9,230,'#fb4d5d','seismic-nova');d.cooldown=3.8;d.flash=.35;}
   if(d.flash)d.flash=Math.max(0,d.flash-dt);
 } else if(id==='titan_ram'){
   if(d.active<=0&&d.cooldown<=0){d.target=nearest(ball,world,700);if(d.target){d.active=.65;d.cooldown=4.1;d.ramHit={};const a=Math.atan2(d.target.y-ball.y,d.target.x-ball.x);ball.vx=Math.cos(a)*ball.baseMoveSpeed;ball.vy=Math.sin(a)*ball.baseMoveSpeed;ball.speedMultiplier=2.2;}}
   if(d.active>0){ball.speedMultiplier=2.2;for(const t of enemies(ball,world)){if(distance(ball,t)<ball.radius+t.radius+8&&!d.ramHit[t.id]){d.ramHit[t.id]=1;hit(ball,t,world,22,300,'#fbbf24','titan-ram');}}}else if(!d.colossus){ball.speedMultiplier=1;}
 } else if(id==='zero_detonator'){
   if(d.cooldown<=0&&!d.charge){d.charge=.8;d.blastPoint={x:ball.x,y:ball.y};d.cooldown=4.6;}
   if(d.charge>0){d.charge-=dt;if(d.charge<=0){const p=d.blastPoint||ball;for(const t of enemies(ball,world)){const dist=Math.hypot(t.x-p.x,t.y-p.y);if(dist<170){world.damage(t,ball,16,'zero-detonator');const l=dist||1;t.vx+=(t.x-p.x)/l*260;t.vy+=(t.y-p.y)/l*260;}}world.spawnParticle(p.x,p.y,{color:'#dbeafe',count:38,speed:360,life:.65,spread:TAU,size:3});world.addShockwave(p.x,p.y,{radius:190,color:'#7ce7ff',life:.45});d.blastFlash={x:p.x,y:p.y,life:.3};}}
   if(d.blastFlash){d.blastFlash.life-=dt;if(d.blastFlash.life<=0)d.blastFlash=null;}
 } else if(id==='magma_rift'){
   d.drop-=dt;if(d.drop<=0){d.drop=.42;d.zones.push({x:ball.x,y:ball.y,r:34,life:3,maxLife:3,tick:.25});}
   tickZones(ball,world,d,dt,'magma');
 } else if(id==='ice_prison'){
   if(d.cooldown<=0){const t=nearest(ball,world,550);if(t){d.zones.push({x:t.x,y:t.y,r:110,life:1.5,maxLife:1.5,tick:0});world.spawnParticle(t.x,t.y,{color:'#7ce7ff',count:22,speed:170,life:.5,spread:TAU});d.cooldown=4.1;}}
   tickZones(ball,world,d,dt,'ice');
 } else if(id==='toxic_mist'){
   d.drop-=dt;if(d.drop<=0){d.drop=.6;d.zones.push({x:ball.x,y:ball.y,r:72,life:3,maxLife:3,tick:.3});}
   tickZones(ball,world,d,dt,'toxic');
 } else if(id==='singularity'){
   if(d.cooldown<=0){const t=nearest(ball,world,650);if(t){d.zones.push({x:t.x,y:t.y,r:155,life:2,maxLife:2,tick:.3});d.cooldown=5;}}
   for(let zi=d.zones.length-1;zi>=0;zi--){
     const z=d.zones[zi];
     for(const t of enemies(ball,world)){
       const dx=z.x-t.x,dy=z.y-t.y,l=Math.hypot(dx,dy)||1;
       if(l<z.r*2){t.vx+=dx/l*230*dt;t.vy+=dy/l*230*dt;z.tick=(z.tick||0)-dt;if(l<z.r&&z.tick<=0){world.damage(t,ball,2,'singularity');z.tick=.3;}}
     }
     z.life-=dt;
     if(z.life<=0){
       world.spawnParticle(z.x,z.y,{color:'#c084fc',count:36,speed:390,life:.65,spread:TAU,size:3});
       world.addShockwave(z.x,z.y,{radius:210,color:'#a855f7',life:.5});
       for(const t of enemies(ball,world)){const dx=t.x-z.x,dy=t.y-z.y,l=Math.hypot(dx,dy)||1;if(l<210){const fall=1-l/210;world.damage(t,ball,18*fall,'singularity-implosion');t.vx+=dx/l*260*fall;t.vy+=dy/l*260*fall;}}
       d.zones.splice(zi,1);
     }
   }
 } else if(id==='polarity_flip'){
   if(d.cooldown<=0){d.target=nearest(ball,world,650);if(d.target){d.active=1;d.cooldown=4.1;}}
   if(d.active>0&&d.target&&d.target.alive){const dx=ball.x-d.target.x,dy=ball.y-d.target.y,l=Math.hypot(dx,dy)||1;d.target.vx+=dx/l*360*dt-dy/l*150*dt;d.target.vy+=dy/l*360*dt+dx/l*150*dt;}
 } else if(id==='time_distortion'){
   if(d.cooldown<=0){d.active=1.5;d.cooldown=4.2;}
   if(d.active>0){for(const t of enemies(ball,world)){if(distance(ball,t)<180)t._powerSlowTimer=Math.max(t._powerSlowTimer||0,.12);}}
 } else if(id==='lightning_ghost'){
   if(d.cooldown<=0){const t=nearest(ball,world,650);if(t){const a=Math.atan2(t.y-ball.y,t.x-ball.x);d.dash={life:.32,invuln:.13,x:ball.x,y:ball.y};ball.vx=Math.cos(a)*ball.baseMoveSpeed;ball.vy=Math.sin(a)*ball.baseMoveSpeed;ball.speedMultiplier=3.1;d.cooldown=3.5;world.spawnParticle(ball.x,ball.y,{color:'#67e8f9',count:18,speed:230,life:.35,spread:TAU});}}
   if(d.dash){d.dash.life-=dt;d.dash.invuln-=dt;if(d.dash.life<=0){d.dash=null;ball.speedMultiplier=1;}}
 } else if(id==='mirror_portal'){
   if(d.cooldown<=0){const t=nearest(ball,world,650);if(t){const a=Math.atan2(ball.y-t.y,ball.x-t.x);const ox=ball.x,oy=ball.y;const bounds=world.arena.getBounds();ball.x=Math.max(bounds.left+ball.radius,Math.min(bounds.right-ball.radius,ball.x+Math.cos(a)*190));ball.y=Math.max(bounds.top+ball.radius,Math.min(bounds.bottom-ball.radius,ball.y+Math.sin(a)*190));d.portal={x1:ox,y1:oy,x2:ball.x,y2:ball.y,life:1};world.addShockwave(ox,oy,{radius:70,color:'#c084fc',life:.3});world.addShockwave(ball.x,ball.y,{radius:70,color:'#c084fc',life:.3});d.cooldown=5;}}
 } else if(id==='quantum_jump'){
   if(d.cooldown<=0){const t=nearest(ball,world,700);if(t){const ox=ball.x,oy=ball.y,dx=ball.x-t.x,dy=ball.y-t.y,len=Math.hypot(dx,dy)||1;const bounds=world.arena.getBounds();const jump=90;ball.x=Math.max(bounds.left+ball.radius,Math.min(bounds.right-ball.radius,t.x-dx/len*jump));ball.y=Math.max(bounds.top+ball.radius,Math.min(bounds.bottom-ball.radius,t.y-dy/len*jump));d.portal={x1:ox,y1:oy,x2:ball.x,y2:ball.y,life:.7};world.spawnParticle(ox,oy,{color:'#fff',count:22,speed:230,life:.4,spread:TAU});world.spawnParticle(ball.x,ball.y,{color:'#38bdf8',count:22,speed:230,life:.4,spread:TAU});world.addShockwave(ox,oy,{radius:58,color:'#fff',life:.28});world.addShockwave(ball.x,ball.y,{radius:72,color:'#38bdf8',life:.32});d.cooldown=4.5;}}
 } else if(id==='crazy_orbit'){
   if(d.cooldown<=0){d.active=1.2;d.cooldown=4.5;d.angle=Math.atan2(ball.vy,ball.vx);}
   if(d.active>0){d.angle+=dt*7;const s=ball.baseMoveSpeed;ball.vx=Math.cos(d.angle)*s;ball.vy=Math.sin(d.angle)*s;}
 } else if(id==='multiplication'){
   if(d.cooldown<=0){for(let i=0;i<2;i++){const cloneId=world.spawnCloneFor(ball,{lifetime:3,hpRatio:.12,opacity:.42});const c=world.balls.find(b=>b.id===cloneId);if(c){c.isPowerDecoy=true;c.vx=ball.vx+(i?90:-90);c.vy=ball.vy+(i?-90:90);}}d.cooldown=6;world.spawnParticle(ball.x,ball.y,{color:'#22d3ee',count:24,speed:240,life:.45,spread:TAU});}
 } else if(id==='sentinel_turret'){
   d.turretCooldown=(d.turretCooldown||0)-dt;
   if(d.turretLife<=0&&d.turretCooldown<=0){d.turretLife=4;d.turretCooldown=8;d.turretX=ball.x;d.turretY=ball.y;d.turretFire=.1;}
   if(d.turretLife>0){d.turretLife-=dt;d.turretFire-=dt;if(d.turretFire<=0){const t=nearest({x:d.turretX,y:d.turretY,team:ball.team},world,540);if(t){projectile(world,{...ball,x:d.turretX,y:d.turretY},{x:t.x,y:t.y},{powerId:id,speed:520,life:1.8,damage:6,radius:5,color:'#67e8f9',type:'sentinel'});d.turretFire=.8;}}}
 } else if(id==='voracious_swarm'){
   if(d.cooldown<=0){d.active=4;d.cooldown=6.5;d.angle=0;d.droneHits={};}
   if(d.active>0){d.angle+=dt*3.5;for(let i=0;i<6;i++){const a=d.angle+i*TAU/6;const x=ball.x+Math.cos(a)*64,y=ball.y+Math.sin(a)*64;for(const t of enemies(ball,world)){if(Math.hypot(t.x-x,t.y-y)<t.radius+12&&!d.droneHits[t.id]){world.damage(t,ball,4,'voracious-swarm');const l=distance(ball,t)||1;t.vx+=(t.x-x)/l*75;t.vy+=(t.y-y)/l*75;d.droneHits[t.id]=.45;}}}for(const k in d.droneHits){d.droneHits[k]-=dt;if(d.droneHits[k]<=0)delete d.droneHits[k];}}
 } else if(id==='colossus'){
   if(d.cooldown<=0){d.active=3;d.cooldown=6;d.originalRadius=ball.radius;ball.radius=d.originalRadius*2.1;ball.speedMultiplier=.7;d.hitTimers={};world.addShockwave(ball.x,ball.y,{radius:110,color:'#fbbf24',life:.45});world.spawnParticle(ball.x,ball.y,{color:'#fbbf24',count:22,speed:220,life:.45,spread:TAU});}
   if(d.active>0){
     ball.speedMultiplier=.7;ball.radius=(d.originalRadius||ball.radius)*2.1;
     for(const t of enemies(ball,world)){if(distance(ball,t)<ball.radius+t.radius+3&&!d.hitTimers[t.id]){world.damage(t,ball,8,'colossus-impact');const dx=t.x-ball.x,dy=t.y-ball.y,l=Math.hypot(dx,dy)||1;t.vx+=dx/l*240;t.vy+=dy/l*240;d.hitTimers[t.id]=.65;world.spawnParticle(t.x,t.y,{color:'#fde68a',count:12,speed:190,life:.35,spread:TAU});}}
   }else{ball.speedMultiplier=1;ball.radius=d.originalRadius||ball.radius;}
 } else if(id==='electric_overload'){
   if(d.cooldown<=0){d.active=2.5;d.cooldown=5.2;d.hitTimers={};world.spawnParticle(ball.x,ball.y,{color:'#7ce7ff',count:22,speed:250,life:.5,spread:TAU});}
   if(d.active>0){for(const t of enemies(ball,world)){if(distance(ball,t)<ball.radius+t.radius+42&&!d.hitTimers[t.id]){world.damage(t,ball,7,'electric-overload');d.hitTimers[t.id]=.45;world.spawnParticle(t.x,t.y,{color:'#7ce7ff',count:12,speed:180,life:.3,spread:TAU});}}}
 } else if(id==='blazing_comet'){
   if(d.cooldown<=0){d.active=2;d.cooldown=5.4;d.drop=0;ball.speedMultiplier=1.4;}
   if(d.active>0){ball.speedMultiplier=1.4;d.drop-=dt;if(d.drop<=0){d.drop=.16;d.zones.push({x:ball.x,y:ball.y,r:38,life:.8,maxLife:.8,tick:.1});}}
   else ball.speedMultiplier=1;
   tickZones(ball,world,d,dt,'comet');
 } else if(id==='refractive_dome'){
   if(d.cooldown<=0){d.shield=true;d.cooldown=5.5;d.shieldLife=3.5;}
   if(d.shieldLife>0)d.shieldLife-=dt;else d.shield=false;
 } else if(id==='prism_reflector'){
   if(d.cooldown<=0){d.mirror=true;d.active=.62;d.cooldown=5.1;d.lastAttacker=null;}
   if(d.active<=0)d.mirror=false;
 } else if(id==='revenge_mirror'){
   if(d.cooldown<=0){d.mirror=true;d.active=1.5;d.cooldown=5.2;}
   if(d.active<=0)d.mirror=false;
 }
}
function renderPower(id,ctx,ball,world,slot) {
 const d=slot.data;if(!d)return;const color=slot.meta.color;
 if(id==='judgment_ray'){
   if(d.target&&d.charge>0){ring(ctx,d.target.x,d.target.y,22,'#7ce7ff',.4+d.charge,2);ctx.save();ctx.strokeStyle='#7ce7ff';ctx.globalAlpha=.25+d.charge*.7;ctx.setLineDash([10,8]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ball.x,ball.y);ctx.lineTo(d.target.x,d.target.y);ctx.stroke();ctx.restore();}
   if(d.beam){ctx.save();ctx.strokeStyle='#fff';ctx.shadowColor=color;ctx.shadowBlur=26;ctx.lineWidth=12*d.beam.life/.22;ctx.beginPath();ctx.moveTo(d.beam.x1,d.beam.y1);ctx.lineTo(d.beam.x2,d.beam.y2);ctx.stroke();ctx.restore();}
 } else if(id==='bomb_shrapnel'){
   /* La bombe porte sa propre silhouette sphérique ; l’explosion est rendue par le moteur à l’impact. */
 } else if(id==='zero_detonator'){
   if(d.charge>0&&d.blastPoint){ring(ctx,d.blastPoint.x,d.blastPoint.y,170*(1-d.charge/.8), '#dbeafe',.85,3);glow(ctx,d.blastPoint.x,d.blastPoint.y,28,'#fff',1);}
   if(d.blastFlash)ring(ctx,d.blastFlash.x,d.blastFlash.y,160,'#7ce7ff',d.blastFlash.life/.3,6);
 } else if(id==='seismic_nova'){if(d.flash>0)ring(ctx,ball.x,ball.y,175*(1-d.flash/.35),'#fb4d5d',d.flash/.35,7);}
 else if(id==='titan_ram'&&d.active>0){glow(ctx,ball.x,ball.y,ball.radius*3,'#fbbf24',.7);ring(ctx,ball.x,ball.y,ball.radius*1.8,'#fff',.7,3);}
 else if(id==='magma_rift')renderMagmaTrail(ctx,d);
 else if(id==='ice_prison')renderZones(ctx,d,'#7ce7ff',.12);
 else if(id==='toxic_mist')renderZones(ctx,d,'#84cc16',.12);
 else if(id==='singularity'){for(const z of d.zones){glow(ctx,z.x,z.y,z.r*1.7,'#a855f7',.25);ctx.save();ctx.fillStyle='#03020a';ctx.beginPath();ctx.arc(z.x,z.y,Math.min(48,z.r*.42),0,TAU);ctx.fill();for(let i=0;i<3;i++)ring(ctx,z.x,z.y,35+i*16,'#c084fc',.8-i*.2,3);ctx.restore();}}
 else if(id==='polarity_flip'&&d.active>0&&d.target&&d.target.alive){ctx.save();ctx.strokeStyle='#f472b6';ctx.shadowColor='#f472b6';ctx.shadowBlur=20;ctx.lineWidth=4;ctx.setLineDash([8,7]);ctx.beginPath();ctx.moveTo(ball.x,ball.y);ctx.lineTo(d.target.x,d.target.y);ctx.stroke();ctx.restore();ring(ctx,d.target.x,d.target.y,30,'#f472b6',.8,3);}
 else if(id==='time_distortion'&&d.active>0){ring(ctx,ball.x,ball.y,180,'#fbbf24',.8,3);ring(ctx,ball.x,ball.y,145,'#fff2b2',.4,2);}
 else if(id==='lightning_ghost'&&d.dash){for(let i=1;i<=3;i++){ctx.save();ctx.globalAlpha=.28/i;ctx.fillStyle='#67e8f9';ctx.beginPath();ctx.arc(d.dash.x-ball.vx*.02*i,d.dash.y-ball.vy*.02*i,ball.radius,0,TAU);ctx.fill();ctx.restore();}ring(ctx,ball.x,ball.y,ball.radius*1.8,'#67e8f9',.8,3);}
 else if((id==='mirror_portal'||id==='quantum_jump')&&d.portal){
   ring(ctx,d.portal.x1,d.portal.y1,26,'#fff',d.portal.life,4);ring(ctx,d.portal.x2,d.portal.y2,30,'#38bdf8',d.portal.life,5);
   ctx.save();ctx.globalAlpha=d.portal.life;ctx.strokeStyle='#7dd3fc';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(d.portal.x1,d.portal.y1);ctx.lineTo(d.portal.x2,d.portal.y2);ctx.stroke();ctx.restore();
 }
 else if(id==='crazy_orbit'&&d.active>0){for(let i=0;i<3;i++)ring(ctx,ball.x,ball.y,ball.radius+14+i*13,'#fbbf24',.6-i*.12,2);}
 else if(id==='sentinel_turret'&&d.turretLife>0){glow(ctx,d.turretX,d.turretY,48,'#67e8f9',.4);ring(ctx,d.turretX,d.turretY,20,'#67e8f9',.9,4);for(let i=0;i<4;i++){const a=d.phase+i*TAU/4;ctx.beginPath();ctx.moveTo(d.turretX,d.turretY);ctx.lineTo(d.turretX+Math.cos(a)*24,d.turretY+Math.sin(a)*24);ctx.strokeStyle='#cffafe';ctx.lineWidth=3;ctx.stroke();}}
 else if(id==='voracious_swarm'&&d.active>0){for(let i=0;i<6;i++){const a=d.angle+i*TAU/6,x=ball.x+Math.cos(a)*64,y=ball.y+Math.sin(a)*64;glow(ctx,x,y,22,'#a3e635',.5);ctx.fillStyle='#d9f99d';ctx.beginPath();ctx.arc(x,y,7,0,TAU);ctx.fill();}}
 else if(id==='colossus'&&d.active>0){
   glow(ctx,ball.x,ball.y,ball.radius*2.2,'#fbbf24',.48);
   ring(ctx,ball.x,ball.y,ball.radius+7,'#fde68a',.9,3);
   // Fissures rouges sur la boule géante : silhouette de boss immédiatement identifiable.
   for(let i=0;i<8;i++){
     const a=d.phase*.8+i*TAU/8, r1=ball.radius*.48, r2=ball.radius*.78, r3=ball.radius*1.03;
     ctx.save();ctx.strokeStyle='#fb3c3c';ctx.shadowColor='#ef4444';ctx.shadowBlur=13;ctx.lineWidth=3.5;
     ctx.beginPath();ctx.moveTo(ball.x+Math.cos(a)*r1,ball.y+Math.sin(a)*r1);
     ctx.lineTo(ball.x+Math.cos(a+.12)*r2,ball.y+Math.sin(a+.12)*r2);
     ctx.lineTo(ball.x+Math.cos(a-.08)*r3,ball.y+Math.sin(a-.08)*r3);ctx.stroke();ctx.restore();
   }
 }
 else if(id==='electric_overload'&&d.active>0){for(let i=0;i<7;i++){const a=d.phase*4+i*TAU/7;ctx.save();ctx.strokeStyle='#7ce7ff';ctx.shadowColor='#7ce7ff';ctx.shadowBlur=16;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ball.x+Math.cos(a)*ball.radius,ball.y+Math.sin(a)*ball.radius);ctx.lineTo(ball.x+Math.cos(a+.4)*ball.radius*1.8,ball.y+Math.sin(a+.4)*ball.radius*1.8);ctx.lineTo(ball.x+Math.cos(a-.2)*ball.radius*2.5,ball.y+Math.sin(a-.2)*ball.radius*2.5);ctx.stroke();ctx.restore();}}
 else if(id==='blazing_comet'&&d.active>0){glow(ctx,ball.x,ball.y,ball.radius*2.5,'#ff6b35',.65);ring(ctx,ball.x,ball.y,ball.radius+6,'#fff2b2',.9,3);}
 else if((id==='refractive_dome'||id==='prism_reflector')&&d.mirror){
   const r=ball.radius+15;glow(ctx,ball.x,ball.y,r*2,'#93c5fd',.42);ctx.save();ctx.strokeStyle='#dbeafe';ctx.fillStyle='rgba(147,197,253,.16)';ctx.lineWidth=3;ctx.shadowColor='#93c5fd';ctx.shadowBlur=22;ctx.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6+Math.PI/6;const x=ball.x+Math.cos(a)*r,y=ball.y+Math.sin(a)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
   if(id==='prism_reflector'&&d.lastAttacker){ctx.save();ctx.strokeStyle='#fff';ctx.shadowColor='#93c5fd';ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ball.x,ball.y);ctx.lineTo(d.lastAttacker.x,d.lastAttacker.y);ctx.stroke();ctx.restore();}
 }
 else if(id==='revenge_mirror'&&d.mirror){ring(ctx,ball.x,ball.y,ball.radius+13,'#e2e8f0',.9,3);for(let i=0;i<4;i++){const a=d.phase+i*TAU/4;ctx.beginPath();ctx.moveTo(ball.x+Math.cos(a)*(ball.radius+4),ball.y+Math.sin(a)*(ball.radius+4));ctx.lineTo(ball.x+Math.cos(a)*(ball.radius+20),ball.y+Math.sin(a)*(ball.radius+20));ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();}}
 else if(id==='multiplication'){/* doubles dessinés par le moteur comme leurres */}
}
for(const id of IDS){
 window.AbilityBehaviors[id]={
  attach(ball,world,slot){slot.data=createState();const d=slot.data;d.cooldown=.4+((ball.id||1)%4)*.25;d.drop=.1;d.turretLife=0;d.shieldLife=0;d.shield=false;d.mirror=false;d.originalRadius=ball.radius;},
  update(ball,world,slot,dt){updatePower(id,ball,world,slot,dt);},
  render(ctx,ball,world,slot){renderPower(id,ctx,ball,world,slot);},
  onTakeDamage(ball,attacker,amount,world,slot){
   const d=slot.data;if(!d)return amount;
   if(id==='refractive_dome'&&d.shield&&amount>0){d.shield=false;d.shieldLife=0;world.spawnParticle(ball.x,ball.y,{color:'#93c5fd',count:24,speed:270,life:.5,spread:TAU});world.addShockwave(ball.x,ball.y,{radius:ball.radius*3,color:'#93c5fd',life:.35});return amount*.18;}
   if(id==='prism_reflector'&&d.mirror&&d.active>0&&attacker&&attacker.alive){
     d.mirror=false;d.active=0;d.lastAttacker={x:attacker.x,y:attacker.y};
     world.damage(attacker,ball,amount*.9,'prism-reflector',{ignoreInvuln:true,noPowerReflect:true});
     world.spawnParticle(ball.x,ball.y,{color:'#dbeafe',count:24,speed:260,life:.42,spread:TAU});
     world.addShockwave(ball.x,ball.y,{radius:ball.radius*3.2,color:'#93c5fd',life:.32});
     world.spawnParticle(attacker.x,attacker.y,{color:'#fff',count:16,speed:190,life:.32,spread:TAU});
     return 0;
   }
   if(id==='revenge_mirror'&&d.mirror&&d.active>0&&attacker&&attacker.alive){d.mirror=false;d.active=0;world.damage(attacker,ball,amount*.75,'revenge-mirror',{ignoreInvuln:true,noPowerReflect:true});world.spawnParticle(ball.x,ball.y,{color:'#e2e8f0',count:18,speed:210,life:.4,spread:TAU});return amount*.45;}
   if(id==='crazy_orbit'&&d.active>0)return amount*.5;
   if(id==='colossus'&&d.active>0)return amount*.72;
   if(id==='lightning_ghost'&&d.dash&&d.dash.invuln>0)return 0;
   return amount;
  },
  onDeath(ball,world,slot){
   if(id==='last_breath'){radial(ball,world,170,18,260,'#c084fc','last-breath');world.spawnParticle(ball.x,ball.y,{color:'#fff',count:28,speed:360,life:.6,spread:TAU});}
   if(id==='multiplication'){for(const c of world.balls){if(c.isPowerDecoy&&c.alive&&c.team===ball.team){c.alive=false;}}}
  },
  detach(ball,world,slot){
   if(id==='titan_ram'||id==='lightning_ghost'||id==='blazing_comet'||id==='colossus'||id==='crazy_orbit')ball.speedMultiplier=1;
   if(id==='colossus'&&slot.data&&slot.data.originalRadius)ball.radius=slot.data.originalRadius;
  }
 };
}
})();