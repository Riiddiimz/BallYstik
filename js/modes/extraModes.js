class ArcadeMode {
constructor(sim,id){this.sim=sim;this.id=id;this.ownsPhysics=true;this.ownsSpawning=true;this.name=({accumulation:"Accumulation",multiply:"Multiply",battleLines:"Battle Lines",lines:"Lines",paint:"Paint",target:"Target",grow:"Grow",shatter:"Shatter",colorMatch:"Color Match",portal:"Portal"})[id];this.color="#00f2fe";this.radius=0;this.age=0;this.points=[];this.frozen=[];this.segments=[];this.portals=[];this.covered=0;this.battle=[];this.gapSizeDeg=42;this.gapAngleDeg=30;this.freezeInterval=5;this.ballSpeed=5.4;this.spawnPerBounce=1;this.initialBalls=2;this.maxBalls=10;this.radiusScale=1;this.ballCount=6;this.startingLines=5;this.wallLineGain=3;this.battleSpeed=4;this.lineSpreadDeg=7;this.hitCooldown={};}
applySettings(s={}){Object.assign(this,s)} setTargetDuration(){} setupRings(){this.updateGeometry();this.age=0;this.points=[];this.frozen=[];this.segments=[];this.portals=[];this.battle=[];this.covered=0;this.hitCooldown={};}
updateGeometry(){this.cx=this.sim.center.x;this.cy=this.sim.center.y;const boundaryRadius=Math.max(65,this.sim.boundaryRadius);const isMultiply=this.id==="multiply";const baseRadius=isMultiply?Math.max(45,boundaryRadius*1.05):Math.max(45,boundaryRadius-22);const requestedRadius=baseRadius*(isMultiply?Math.max(.7,Number(this.radiusScale)||100)/100:1);const maxVisibleRadius=Math.max(30,boundaryRadius-Math.max(4,this.sim.ballRadius||0));this.radius=isMultiply?Math.max(30,requestedRadius):Math.max(45,requestedRadius)}
initializeBalls(){this.updateGeometry();if(this.id==="battleLines"){for(let i=0;i<this.ballCount;i++){let a=i*Math.PI*2/this.ballCount;this.battle.push({x:this.cx+Math.cos(a)*this.radius*.4,y:this.cy+Math.sin(a)*this.radius*.4,vx:Math.cos(a+1)*this.battleSpeed,vy:Math.sin(a+1)*this.battleSpeed,lines:this.startingLines,hue:i*360/this.ballCount,alive:true,r:this.sim.ballRadius})}this.syncBattle();return}
let a=this.sim.prng.random()*Math.PI*2;this.angle=a;this.active=new Ball(this.cx,this.cy,Math.cos(a)*this.ballSpeed,Math.sin(a)*this.ballSpeed,this.sim.ballRadius,Math.floor(this.sim.prng.random()*360));this.sim.balls=[this.active];if(this.id==="multiply"){for(let i=1;i<this.initialBalls;i++){const q=this.sim.prng.random()*Math.PI*2;const offset=18+Math.floor(i/6)*this.sim.ballRadius*2;this.sim.spawnBall(this.cx+Math.cos(q)*offset,this.cy+Math.sin(q)*offset,Math.cos(q)*this.ballSpeed,Math.sin(q)*this.ballSpeed,Math.floor(this.sim.prng.random()*360));}}
if(this.id==="target")for(let i=0;i<12;i++)this.segments.push({a:i*Math.PI/6,alive:true,n:i+1});
if(this.id==="shatter"||this.id==="colorMatch")for(let i=0;i<24;i++)this.segments.push({a:i*Math.PI/12,hp:2,alive:true,hue:i%6*60});
if(this.id==="portal")this.portals=[{a:0,h:180,n:0,alive:true},{a:Math.PI,h:180,n:0,alive:true},{a:Math.PI/2,h:300,n:0,alive:true},{a:-Math.PI/2,h:300,n:0,alive:true}];}
syncBattle(){this.sim.balls=this.battle.filter(b=>b.alive).map(s=>{let b=new Ball(s.x,s.y,s.vx,s.vy,s.r,s.hue);b.state=s;return b})}
reflect(b,nx,ny){let d=b.vx*nx+b.vy*ny;if(d>0){b.vx=(b.vx-2*d*nx)*this.sim.bounciness;b.vy=(b.vy-2*d*ny)*this.sim.bounciness}}
diff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
bounce(b,dx,dy,d){let nx=dx/(d||1),ny=dy/(d||1);b.x=this.cx+nx*(this.radius-b.radius);b.y=this.cy+ny*(this.radius-b.radius);this.reflect(b,nx,ny);this.sim.totalBounces++}
update(dt){if(this.sim.isVictory)return;this.updateGeometry();if(this.id==="battleLines"){this.updateBattle(dt);return}if(this.id==="multiply"){this.updateMultiply(dt);return}if(this.id==="accumulation"){this.age+=dt/60;if(this.age>=this.freezeInterval&&this.active){const oldBall=this.active;this.frozen.push({x:oldBall.x,y:oldBall.y,r:oldBall.radius,h:oldBall.hue});this.active=new Ball(this.cx,this.cy,Math.cos(this.angle)*this.ballSpeed,Math.sin(this.angle)*this.ballSpeed,this.sim.ballRadius,Math.floor(this.sim.prng.random()*360));this.sim.balls=[this.active];this.age=0}}let b=this.active;if(!b)return;for(let k=0;k<6;k++){let step=dt/6;b.vy+=this.sim.gravity*step;b.x+=b.vx*step;b.y+=b.vy*step;let dx=b.x-this.cx,dy=b.y-this.cy,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);if(d>=this.radius-b.radius){if(this.id==="accumulation"){const gapCenter=this.gapAngleDeg*Math.PI/180;const halfGap=this.gapSizeDeg*Math.PI/360;const ballAllowance=Math.asin(Math.min(1,b.radius/Math.max(1,this.radius)));const insideGap=Math.abs(this.diff(a,gapCenter))<halfGap-ballAllowance;if(insideGap){if(d>this.radius+b.radius*1.5){this.sim.triggerVictory();return}}else{this.bounce(b,dx,dy,d)}}else this.bounce(b,dx,dy,d);

if(this.id==="lines")this.points.push({x:b.x,y:b.y,h:b.hue});
if(this.id==="paint"){this.points.push({x:b.x,y:b.y,h:this.points.length*3%360});if(this.points.length>1500)this.points.shift();this.covered=Math.min(100,this.points.length/15)}
if(this.id==="grow")b.radius=Math.min(b.radius+.35,this.radius*.35);
if(this.id==="target"){let s=this.segments.find(s=>s.alive&&Math.abs(this.diff(a,s.a))<.3);if(s&&s.n===this.segments.filter(x=>!x.alive).length+1)s.alive=false;if(this.segments.every(s=>!s.alive))this.sim.triggerVictory()}
if(this.id==="shatter"||this.id==="colorMatch"){let s=this.segments.find(s=>s.alive&&Math.abs(this.diff(a,s.a))<.13);if(s&&(this.id==="shatter"||Math.floor(b.hue/60)===Math.floor(s.hue/60))){s.hp--;if(!s.hp)s.alive=false;if(this.segments.every(s=>!s.alive))this.sim.triggerVictory()}if(this.id==="colorMatch")b.hue=(b.hue+60)%360}
if(this.id==="portal"){let p=this.portals.find(p=>p.alive&&Math.abs(this.diff(a,p.a))<.22);if(p){let t=this.portals.find(q=>q!==p&&q.alive&&q.h===p.h);if(t){p.n++;t.n++;b.x=this.cx+Math.cos(t.a)*(this.radius-b.radius-8);b.y=this.cy+Math.sin(t.a)*(this.radius-b.radius-8);if(p.n>=3){p.alive=false;t.alive=false}}}else this.bounce(b,dx,dy,d);if(this.portals.every(p=>!p.alive))this.sim.triggerVictory()}

}
for(let f of this.frozen){let x=b.x-f.x,y=b.y-f.y,d=Math.hypot(x,y);if(d<b.radius+f.r&&d>.001){let nx=x/d,ny=y/d;b.x=f.x+nx*(b.radius+f.r);b.y=f.y+ny*(b.radius+f.r);const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx=(b.vx-2*dot*nx)*this.sim.bounciness;b.vy=(b.vy-2*dot*ny)*this.sim.bounciness;this.sim.totalBounces++}}}
}}
searchParameterSets(targetDuration){
  const sets=[];
  const gaps=[30,42,55,70,85];
  const speeds=[3.5,4.5,5.4,6.5,7.5];
  const freezes=[2,3,4,5,7];
  const gravities=[0.08,0.16,0.24,0.32];
  for(const gapSizeDeg of gaps)for(const ballSpeed of speeds)for(const freezeInterval of freezes){
    sets.push({gapSizeDeg,ballSpeed,freezeInterval,gravity:gravities[(gapSizeDeg+Math.round(ballSpeed*10)+freezeInterval)%gravities.length],gapAngleDeg:this.gapAngleDeg,bounciness:this.sim.bounciness});
  }
  return sets;
}
evaluateSeed(seed,maxDuration=120,prng,settings=null){
  if(this.id!=="accumulation")return null;
  const cfg={gapSizeDeg:settings?.gapSizeDeg??this.gapSizeDeg,gapAngleDeg:settings?.gapAngleDeg??this.gapAngleDeg,ballSpeed:settings?.ballSpeed??this.ballSpeed,freezeInterval:settings?.freezeInterval??this.freezeInterval,gravity:settings?.gravity??this.sim.gravity,bounciness:settings?.bounciness??this.sim.bounciness};
  prng.setSeed(seed);
  const cx=this.sim.center.x,cy=this.sim.center.y;
  // Mirror updateGeometry(): the live mode clamps the effective boundary first.
  const boundaryRadius=Math.max(65,this.sim.boundaryRadius);
  const radius=Math.max(45,boundaryRadius-22);
  const ballRadius=this.sim.ballRadius||12;
  const gapCenter=cfg.gapAngleDeg*Math.PI/180,halfGap=cfg.gapSizeDeg*Math.PI/360;
  const angle=prng.random()*Math.PI*2;
  prng.random();
  let ball={x:cx,y:cy,vx:Math.cos(angle)*cfg.ballSpeed,vy:Math.sin(angle)*cfg.ballSpeed,r:ballRadius};
  const frozen=[];
  let age=0;
  const maxFrames=Math.floor(maxDuration*60);
  for(let frame=0;frame<maxFrames;frame++){
    // Match ArcadeMode.update exactly: age advances and a ball freezes/respawns
    // before this frame's physics substeps, not after them.
    age+=1/60;
    if(age>=cfg.freezeInterval){
      frozen.push({x:ball.x,y:ball.y,r:ball.r});
      ball={x:cx,y:cy,vx:Math.cos(angle)*cfg.ballSpeed,vy:Math.sin(angle)*cfg.ballSpeed,r:ballRadius};
      prng.random();age=0;
    }
    for(let k=0;k<6;k++){
      const step=1/6;
      ball.vy+=cfg.gravity*step;ball.x+=ball.vx*step;ball.y+=ball.vy*step;
      const dx=ball.x-cx,dy=ball.y-cy,d=Math.hypot(dx,dy);
      if(d>=radius-ball.r){
        const a=Math.atan2(dy,dx);
        const fitsGap=Math.abs(Math.atan2(Math.sin(a-gapCenter),Math.cos(a-gapCenter)))<halfGap-Math.asin(Math.min(1,ball.r/Math.max(1,radius)));
        if(fitsGap){
          // In the live mode, the opening is not a wall: let the ball keep
          // moving through it, and declare victory only after it exits.
          if(d>radius+ball.r*1.5){
            // Simulation.update increments elapsedSeconds before mode physics.
            return (frame+1)/60;
          }
        } else {
          const nx=dx/(d||1),ny=dy/(d||1);
          ball.x=cx+nx*(radius-ball.r);ball.y=cy+ny*(radius-ball.r);
          const dot=ball.vx*nx+ball.vy*ny;
          if(dot>0){ball.vx=(ball.vx-2*dot*nx)*cfg.bounciness;ball.vy=(ball.vy-2*dot*ny)*cfg.bounciness;}
        }
      }
      for(const f of frozen){
        const x=ball.x-f.x,y=ball.y-f.y,dist=Math.hypot(x,y);
        if(dist<ball.r+f.r&&dist>.001){
          const nx=x/dist,ny=y/dist;
          ball.x=f.x+nx*(ball.r+f.r);ball.y=f.y+ny*(ball.r+f.r);
          const dot=ball.vx*nx+ball.vy*ny;
          if(dot<0){ball.vx=(ball.vx-2*dot*nx)*cfg.bounciness;ball.vy=(ball.vy-2*dot*ny)*cfg.bounciness;}
        }
      }
    }
  }
  return maxDuration;
}
updateMultiply(dt){
  const balls=this.sim.balls;
  for(const b of balls)b.radius=this.sim.ballRadius||13;
  for(const b of [...balls]){
   b.vy+=this.sim.gravity*dt;
   b.x+=b.vx*dt;b.y+=b.vy*dt;
   const dx=b.x-this.cx,dy=b.y-this.cy,d=Math.hypot(dx,dy);
   if(d>=this.radius-b.radius)this.bounce(b,dx,dy,d);
  }
  // Spatial grid: only compare balls occupying neighboring cells, not every pair.
  const cellSize=Math.max(8,(this.sim.ballRadius||13)*2.2);
  const grid=new Map();
  for(let i=0;i<balls.length;i++){
   const b=balls[i],gx=Math.floor(b.x/cellSize),gy=Math.floor(b.y/cellSize),key=gx+","+gy;
   if(!grid.has(key))grid.set(key,[]);
   grid.get(key).push(i);
  }
  const checked=new Set();
  for(let i=0;i<balls.length&&balls.length<this.maxBalls;i++){
   const a=balls[i],gx=Math.floor(a.x/cellSize),gy=Math.floor(a.y/cellSize);
   for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){
    const nearby=grid.get((gx+ox)+","+(gy+oy));
    if(!nearby)continue;
    for(const j of nearby){
     if(j<=i)continue;
     const pairKey=i+":"+j;if(checked.has(pairKey))continue;checked.add(pairKey);
     const other=balls[j],dx=other.x-a.x,dy=other.y-a.y,d=Math.hypot(dx,dy),min=a.radius+other.radius;
     if(d<=0||d>=min)continue;
     const nx=dx/d,ny=dy/d;
     const closing=(a.vx-other.vx)*nx+(a.vy-other.vy)*ny;
     const overlap=min-d;
     a.x-=nx*overlap/2;a.y-=ny*overlap/2;
     other.x+=nx*overlap/2;other.y+=ny*overlap/2;
     if(closing<=0)continue;
     a.vx-=closing*nx;a.vy-=closing*ny;
     other.vx+=closing*nx;other.vy+=closing*ny;
     for(let k=0;k<this.spawnPerBounce&&balls.length<this.maxBalls&&balls.length<1200;k++){
      const angle=Math.atan2((a.vy+other.vy)/2,(a.vx+other.vx)/2)+(k%2===0?Math.PI/2:-Math.PI/2);
      const hue=(a.hue+(k+1)*55)%360;
      this.sim.spawnBall((a.x+other.x)/2+Math.cos(angle)*(min+2),(a.y+other.y)/2+Math.sin(angle)*(min+2),Math.cos(angle)*this.ballSpeed,Math.sin(angle)*this.ballSpeed,hue);
     }
    }
   }
  }
}
updateBattle(dt){
 const alive=this.battle.filter(b=>b.alive);
 for(const b of alive){
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  const x=b.x-this.cx,y=b.y-this.cy,d=Math.hypot(x,y);
  if(d>this.radius-b.r){const nx=x/(d||1),ny=y/(d||1);b.x=this.cx+nx*(this.radius-b.r);b.y=this.cy+ny*(this.radius-b.r);this.reflect(b,nx,ny);b.lines+=this.wallLineGain;}
 }
 // Collisions between balls are elastic and do not consume lines.
 for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){
  const a=alive[i],b=alive[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.r+b.r;
  if(d>0&&d<min){const nx=dx/d,ny=dy/d,rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
   if(rel>0){a.vx-=rel*nx;a.vy-=rel*ny;b.vx+=rel*nx;b.vy+=rel*ny;}
   const overlap=(min-d)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
  }
 }
 // A ball touching another ball's radial line removes one line, at most once per contact.
 for(const ball of alive)for(const owner of alive){
  if(owner===ball||owner.lines<=0)continue;
  const ang=Math.atan2(owner.y-this.cy,owner.x-this.cx);
  for(let k=0;k<owner.lines;k++){
   const aa=ang+(k-(owner.lines-1)/2)*(this.lineSpreadDeg*Math.PI/180);
   const ex=this.cx+Math.cos(aa)*this.radius,ey=this.cy+Math.sin(aa)*this.radius;
   const vx=ex-owner.x,vy=ey-owner.y,t=Math.max(0,Math.min(1,((ball.x-owner.x)*vx+(ball.y-owner.y)*vy)/(vx*vx+vy*vy||1)));
   const px=owner.x+vx*t,py=owner.y+vy*t,key=owner.hue+":"+k+":"+ball.hue;
   const touching=Math.hypot(ball.x-px,ball.y-py)<ball.r+1;
   if(touching&&!this.hitCooldown[key]){owner.lines--;this.hitCooldown[key]=true;break;}
   if(!touching)this.hitCooldown[key]=false;
  }
 }
 for(const b of alive)if(b.lines<=0)b.alive=false;
 this.syncBattle();if(this.battle.filter(b=>b.alive).length===1)this.sim.triggerVictory();
}
handleCollision(){}
render(ctx){this.updateGeometry();ctx.save();ctx.shadowColor=this.color;ctx.shadowBlur=this.sim.visualStyle==="minimal"?0:this.sim.glowIntensity*(this.sim.visualStyle==="soft"?3:8);ctx.strokeStyle=this.color;ctx.lineWidth=3;ctx.beginPath();if(this.id==="accumulation"){const ga=this.gapAngleDeg*Math.PI/180,gh=this.gapSizeDeg*Math.PI/360;ctx.arc(this.cx,this.cy,this.radius,ga+gh,ga-gh+Math.PI*2);}else ctx.arc(this.cx,this.cy,this.radius,0,Math.PI*2);ctx.stroke();
if(this.id==="lines")for(let p of this.points){ctx.beginPath();ctx.moveTo(this.cx,this.cy);ctx.lineTo(p.x,p.y);ctx.strokeStyle="hsla("+p.h+",100%,65%,.4)";ctx.stroke()}
if(this.id==="paint"){for(let p of this.points){ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle="hsl("+p.h+",100%,60%)";ctx.fill()}ctx.fillStyle="#fff";ctx.font="bold 16px monospace";ctx.fillText("Couverture "+Math.round(this.covered)+"%",this.cx,this.cy+this.radius+25)}
for(let s of this.segments){if(!s.alive)continue;ctx.beginPath();ctx.arc(this.cx,this.cy,this.radius,s.a-.12,s.a+.12);ctx.strokeStyle=this.id==="target"?"#facc15":this.id==="colorMatch"?"hsl("+s.hue+",100%,60%)":"#fb923c";ctx.lineWidth=8;ctx.stroke();if(this.id==="target"){ctx.fillStyle="#fff";ctx.font="bold 12px monospace";ctx.fillText(s.n,this.cx+Math.cos(s.a)*(this.radius-15),this.cy+Math.sin(s.a)*(this.radius-15))}}
for(let p of this.portals)if(p.alive){ctx.beginPath();ctx.arc(this.cx+Math.cos(p.a)*this.radius,this.cy+Math.sin(p.a)*this.radius,12,0,Math.PI*2);ctx.fillStyle="hsl("+p.h+",100%,60%)";ctx.fill()}
for(let f of this.frozen){ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fillStyle="hsl("+f.h+",100%,60%)";ctx.fill()}
if(this.id==="battleLines")for(let b of this.battle)if(b.alive){let a=Math.atan2(b.y-this.cy,b.x-this.cx);for(let i=0;i<b.lines;i++){let q=a+(i-(b.lines-1)/2)*(this.lineSpreadDeg*Math.PI/180);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(this.cx+Math.cos(q)*this.radius,this.cy+Math.sin(q)*this.radius);ctx.strokeStyle="hsl("+b.hue+",100%,65%)";ctx.stroke()}ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle="hsl("+b.hue+",100%,60%)";ctx.fill()}
ctx.restore()}
}
window.ArcadeMode=ArcadeMode;