/* Powers Final — adaptation au moteur natif BallYstik.
 * Les effets sont exécutés par les vrais abilitySlots du combat (pas de simulation parallèle).
 */
(function () {
  'use strict';
  window.AbilityBehaviors = window.AbilityBehaviors || {};
  const specs = {
    judgment_ray:{color:'#67e8f9',cooldown:1.7,range:260,damage:17,kind:'ray'},
    star_hunter:{color:'#fb923c',cooldown:2.1,range:300,damage:14,kind:'missile'},
    bomb_shrapnel:{color:'#22d3ee',cooldown:3.4,range:145,damage:16,kind:'burst'},
    seismic_nova:{color:'#ef4444',cooldown:3.0,range:125,damage:13,kind:'push'},
    magma_rift:{color:'#fb923c',cooldown:2.8,range:115,damage:5,kind:'burn'},
    colossus:{color:'#fbbf24',cooldown:5.5,range:100,damage:11,kind:'giant'},
    chain_lightning:{color:'#a5f3fc',cooldown:2.4,range:210,damage:12,kind:'chain'},
    explosive_flower:{color:'#ec4899',cooldown:3.1,range:135,damage:15,kind:'flower'},
    crystal_prison:{color:'#7dd3fc',cooldown:4.0,range:105,damage:4,kind:'freeze'},
    imprisonment_seal:{color:'#c084fc',cooldown:3.7,range:190,damage:13,kind:'seal'},
    singularity:{color:'#a855f7',cooldown:4.5,range:180,damage:18,kind:'singularity'},
    prism_reflector:{color:'#93c5fd',cooldown:0.1,range:0,damage:0,kind:'prism'},
    quantum_jump:{color:'#22d3ee',cooldown:4.0,range:0,damage:0,kind:'jump'},
    multiplication:{color:'#ff2a85',cooldown:5.0,range:130,damage:10,kind:'multiply'}
  };
  function enemies(ball, world, range) {
    return (world.balls || []).filter(other => other !== ball && other.alive && !other.isClone && other.team !== ball.team)
      .map(other => ({ball:other,d:Math.hypot(other.x-ball.x,other.y-ball.y)}))
      .filter(x => x.d <= range).sort((a,b)=>a.d-b.d);
  }
  function particle(world,x,y,color,count=12,speed=160) {
    if(world.spawnParticle) world.spawnParticle(x,y,{color,count,speed,life:.48,spread:Math.PI*2,size:2.5});
    if(world.addShockwave) world.addShockwave(x,y,{radius:46,color,life:.32});
  }
  Object.keys(specs).forEach(id => {
    const s=specs[id];
    window.AbilityBehaviors[id] = {
      attach(ball, world, slot) {
        slot.data={cooldown:.45,phase:0,shield:0,visual:0,hitTimers:{}};
      },
      update(ball, world, slot, dt) {
        const d=slot.data;if(!d)return;
        d.phase+=dt;d.visual=Math.max(0,d.visual-dt);d.cooldown-=dt;
        if(s.kind==='prism'){ d.shield=Math.max(0,d.shield-dt); if(d.shield<=0){d.shield=1.8;d.visual=.35;} return; }
        if(s.kind==='giant'){ if(d.visual>0) return; }
        if(s.kind==='jump' && d.cooldown<=0){
          const a=Math.atan2(ball.vy||0,ball.vx||1), dist=100;
          const arena=world.arena;
          ball.x+=Math.cos(a)*dist;ball.y+=Math.sin(a)*dist;
          if(arena){ball.x=Math.max(arena.x+ball.radius,Math.min(arena.x+arena.w-ball.radius,ball.x));ball.y=Math.max(arena.y+ball.radius,Math.min(arena.y+arena.h-ball.radius,ball.y));}
          d.cooldown=s.cooldown;d.visual=.65;particle(world,ball.x,ball.y,s.color,20,190);return;
        }
        if(d.cooldown>0)return;
        d.cooldown=s.cooldown;
        const targets=enemies(ball,world,s.range);
        if(s.kind==='giant'){d.visual=1.7;ball._powersFinalGiant=1.7;particle(world,ball.x,ball.y,s.color,22,170);return;}
        if(s.kind==='multiply'){particle(world,ball.x,ball.y,s.color,24,200);targets.forEach(t=>world.damage(t.ball,ball,s.damage,'multiplication'));return;}
        if(!targets.length){ if(s.kind==='singularity'||s.kind==='burst'||s.kind==='flower')particle(world,ball.x,ball.y,s.color,16,130);return; }
        const first=targets[0].ball;
        if(s.kind==='ray'||s.kind==='missile'||s.kind==='seal'){
          world.damage(first,ball,s.damage,id);particle(world,first.x,first.y,s.color,10,180);
        } else if(s.kind==='chain'){
          targets.slice(0,3).forEach((t,i)=>{world.damage(t.ball,ball,s.damage*Math.pow(.72,i),id);particle(world,t.ball.x,t.ball.y,s.color,7,140);});
        } else if(s.kind==='push'||s.kind==='burst'||s.kind==='flower'){
          targets.filter(t=>s.kind==='push'||t.d<=(s.kind==='burst'?s.range:s.range*.75)).forEach(t=>{
            world.damage(t.ball,ball,s.damage,id);
            if(s.kind==='push'){const dx=t.ball.x-ball.x,dy=t.ball.y-ball.y,len=Math.hypot(dx,dy)||1;t.ball.vx+=dx/len*180;t.ball.vy+=dy/len*180;}
          });
          particle(world,ball.x,ball.y,s.color,26,220);
        } else if(s.kind==='burn'||s.kind==='freeze'){
          targets.slice(0,s.kind==='freeze'?2:3).forEach(t=>{
            world.damage(t.ball,ball,s.damage,id);
            if(s.kind==='freeze'&&t.ball.status&&t.ball.status.apply){try{t.ball.status.apply('stun',.45);}catch(e){}}
            particle(world,t.ball.x,t.ball.y,s.color,9,120);
          });
        } else if(s.kind==='singularity'){
          targets.slice(0,4).forEach(t=>{const dx=ball.x-t.ball.x,dy=ball.y-t.ball.y,len=Math.hypot(dx,dy)||1;t.ball.vx+=dx/len*100;t.ball.vy+=dy/len*100;world.damage(t.ball,ball,s.damage,id);});
          particle(world,ball.x,ball.y,s.color,30,190);
        }
        d.visual=.35;
      },
      render(ctx, ball, world, slot) {
        const d=slot.data;if(!d)return;
        ctx.save();ctx.globalCompositeOperation='lighter';
        if(s.kind==='prism'){
          ctx.translate(ball.x,ball.y);ctx.rotate(d.phase*.5);ctx.strokeStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=16;ctx.lineWidth=2;
          ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;const x=Math.cos(a)*(ball.radius+9),y=Math.sin(a)*(ball.radius+9);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();
        } else if(d.visual>0){
          const pulse=1+(0.35-d.visual)*2;
          ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=18;ctx.lineWidth=2;
          ctx.globalAlpha=Math.min(1,d.visual*2.5);
          ctx.beginPath();ctx.arc(ball.x,ball.y,ball.radius+8+(1-d.visual)*45,0,Math.PI*2);ctx.stroke();
          if(s.kind==='giant'){ctx.beginPath();ctx.arc(ball.x,ball.y,ball.radius+9,0,Math.PI*2);ctx.stroke();}
        } else if(s.kind==='singularity'){
          ctx.strokeStyle=s.color;ctx.globalAlpha=.45;ctx.beginPath();ctx.arc(ball.x,ball.y,ball.radius+7+Math.sin(d.phase*5)*3,0,Math.PI*2);ctx.stroke();
        }
        ctx.restore();
      }
    };
  });
})();