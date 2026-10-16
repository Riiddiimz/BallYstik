/* BallYstik MVP — moteur autonome vanilla JS, rendu vertical 1080×1920. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('simCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const W = 1080, H = 1920;
  canvas.width = W; canvas.height = H;
  const COLORS = [
    { name: 'Rouge', color: '#ff5364', dark: '#8d1830' },
    { name: 'Bleu', color: '#49a8ff', dark: '#164a9a' },
    { name: 'Vert', color: '#4de0a0', dark: '#16734f' },
    { name: 'Jaune', color: '#ffd34f', dark: '#9a7012' }
  ];
  const state = {
    running: false, finished: false, elapsed: 0, last: 0, raf: 0,
    balls: [], weapon: null, weaponEvents: [15, 35, 50], spawned: [],
    particles: [], waves: [], shake: 0, audio: false, showHp: true,
    record: null, recorder: null, chunks: [], recording: false, recordStart: 0,
    recordStream: null, recordMime: '', resultTimer: null
  };
  const arena = { x: 74, y: 118, w: 932, h: 1684, baseInset: 0, shrink: 0 };
  const rand = (a,b) => a + Math.random() * (b-a);
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  function resetBalls() {
    state.balls = COLORS.map((c,i) => ({
      id:i, name:c.name, color:c.color, dark:c.dark,
      x: arena.x + arena.w * ([.25,.75,.25,.75][i]),
      y: arena.y + arena.h * ([.22,.22,.78,.78][i]),
      vx: rand(-190,190), vy: rand(-220,220), r: 34, hp:100, maxHp:100,
      damage:0, charge:0, armed:false, hitCooldown:0, ultCooldown:0, alive:true
    }));
  }
  function resetMatch() {
    clearTimeout(state.resultTimer);
    state.elapsed=0; state.running=true; state.finished=false;
    state.weapon=null; state.spawned=[]; state.particles=[]; state.waves=[]; state.shake=0;
    $('victoryOverlay').classList.add('hidden');
    $('victoryOverlay').classList.remove('opacity-100');
    $('victoryOverlay').classList.add('opacity-0','pointer-events-none');
    $('timerCounter').textContent='60';
    $('recordStatus').textContent='';
    resetBalls(); state.last=performance.now();
    if (!state.raf) state.raf=requestAnimationFrame(frame);
  }
  function roundedRect(c,x,y,w,h,r) {
    c.beginPath(); c.roundRect(x,y,w,h,r);
  }
  function spawnWeapon() {
    state.weapon={x:W/2,y:H/2,r:40,life:0,active:true};
    for(let i=0;i<56;i++){
      const a=rand(0,Math.PI*2), s=rand(90,570);
      state.particles.push({x:W/2,y:H/2,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.25,.65),max:.65,color:i%2?'#ffd38a':'#7ce7ff',r:rand(3,10)});
    }
    if(state.audio && window.audioSynth) { try { window.audioSynth.init(); window.audioSynth.playTone?.(660,.12); } catch(_){} }
  }
  function burst(x,y,color,count=18) {
    for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),s=rand(80,420);state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.18,.5),max:.5,color,r:rand(2,7)});}
  }
  function damage(target, amount, source) {
    if(!target.alive) return;
    const actual=Math.min(target.hp,amount);
    target.hp=Math.max(0,target.hp-actual);
    if(source){source.damage+=actual;source.charge=clamp(source.charge+actual*.85,0,100);}
    if(target.hp<=0){target.alive=false;burst(target.x,target.y,target.color,32);}
  }
  function triggerUltimate(b) {
    b.charge=0; b.ultCooldown=1.2;
    state.waves.push({x:b.x,y:b.y,r:28,max:330,life:.55,maxLife:.55,owner:b.id});
    state.shake=Math.max(state.shake,8); burst(b.x,b.y,'#fff4c2',30);
    for(const other of state.balls){
      if(!other.alive||other.id===b.id)continue;
      const dx=other.x-b.x,dy=other.y-b.y,d=Math.hypot(dx,dy);
      if(d<330){const nx=dx/(d||1),ny=dy/(d||1);const power=(1-d/330);other.vx+=nx*700*power;other.vy+=ny*700*power;damage(other,12+16*power,b);}
    }
  }
  function update(dt) {
    if(!state.running||state.finished)return;
    state.elapsed=Math.min(60,state.elapsed+dt);
    const t=state.elapsed;
    // La zone se referme progressivement entre 30 et 60 secondes.
    arena.shrink=t<30?0:Math.min(190,(t-30)/30*190);
    const bounds={l:arena.x+arena.shrink,r:arena.x+arena.w-arena.shrink,t:arena.y+arena.shrink,b:arena.y+arena.h-arena.shrink};
    for(const at of state.weaponEvents){
      if(t>=at&&!state.spawned.includes(at)){state.spawned.push(at);spawnWeapon();}
    }
    if(state.weapon){state.weapon.life+=dt;if(state.weapon.life>.5)for(const b of state.balls){if(b.alive&&Math.hypot(b.x-state.weapon.x,b.y-state.weapon.y)<b.r+state.weapon.r){b.armed=true;b.r=43;b.weaponGlow=1;state.weapon=null;burst(b.x,b.y,'#ffd38a',26);break;}}}
    for(const b of state.balls){
      if(!b.alive)continue;
      b.hitCooldown=Math.max(0,b.hitCooldown-dt);b.ultCooldown=Math.max(0,b.ultCooldown-dt);b.weaponGlow=Math.max(0,(b.weaponGlow||0)-dt*.5);
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      const radius=b.r;
      if(b.x<bounds.l+radius){b.x=bounds.l+radius;b.vx=Math.abs(b.vx);}
      if(b.x>bounds.r-radius){b.x=bounds.r-radius;b.vx=-Math.abs(b.vx);}
      if(b.y<bounds.t+radius){b.y=bounds.t+radius;b.vy=Math.abs(b.vy);}
      if(b.y>bounds.b-radius){b.y=bounds.b-radius;b.vy=-Math.abs(b.vy);}
      const speed=Math.hypot(b.vx,b.vy);
      if(speed<130){b.vx+=rand(-100,100);b.vy+=rand(-100,100);}
      if(speed>430){b.vx=b.vx/speed*430;b.vy=b.vy/speed*430;}
      if(t>=30&&Math.hypot(b.x-clamp(b.x,bounds.l+radius,bounds.r-radius),b.y-clamp(b.y,bounds.t+radius,bounds.b-radius))>0)damage(b,10*dt,null);
      if(b.charge>=100&&b.ultCooldown<=0)triggerUltimate(b);
    }
    for(let i=0;i<state.balls.length;i++)for(let j=i+1;j<state.balls.length;j++){
      const a=state.balls[i],b=state.balls[j];if(!a.alive||!b.alive)continue;
      let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.r+b.r;
      if(d>=min)continue;
      if(d<.001){dx=1;dy=0;d=1;}
      const nx=dx/d,ny=dy/d,overlap=min-d;
      a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;
      const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
      if(rel<0){const impulse=-(1.06)*rel/2;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;}
      if(a.hitCooldown<=0&&b.hitCooldown<=0){
        const base=6+(Math.hypot(a.vx-b.vx,a.vy-b.vy)/160);
        const da=base*(a.armed?1.8:1),db=base*(b.armed?1.8:1);
        damage(b,da,a);damage(a,db,b);
        const push=a.armed||b.armed?1.5:1;
        a.vx-=nx*110*push;a.vy-=ny*110*push;b.vx+=nx*110*push;b.vy+=ny*110*push;
        a.hitCooldown=b.hitCooldown=.22;
        burst((a.x+b.x)/2,(a.y+b.y)/2,'#7ce7ff',5);
      }
    }
    state.particles=state.particles.filter(p=>(p.life-=dt)>0);
    for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985;}
    state.waves=state.waves.filter(w=>(w.life-=dt)>0);
    for(const w of state.waves)w.r=w.max*(1-w.life/w.maxLife);
    state.shake=Math.max(0,state.shake-dt*18);
    if(t>=60)finishMatch();
  }
  function finishMatch() {
    if(state.finished)return;
    state.finished=true;state.running=false;
    const ranked=[...state.balls].sort((a,b)=>b.damage-a.damage);
    const winner=ranked[0];
    $('victoryTitle').textContent=winner.name;
    $('victoryRule').textContent='Gagnant : dégâts infligés';
    $('damageResults').innerHTML=ranked.map(b=>'<div class="result-row"><span style="color:'+b.color+'">● '+b.name+'</span><strong>'+Math.round(b.damage)+' dégâts</strong></div>').join('');
    $('victoryOverlay').classList.remove('hidden','opacity-0','pointer-events-none');
    $('victoryOverlay').classList.add('opacity-100');
    $('replayBtn').classList.add('hidden');
    state.resultTimer=setTimeout(()=> $('replayBtn').classList.remove('hidden'),3000);
    if(state.recording)stopRecording();
  }
  function drawBall(b) {
    ctx.save();
    if(b.armed){ctx.shadowColor='#ffd38a';ctx.shadowBlur=45;}
    const g=ctx.createRadialGradient(b.x-b.r*.35,b.y-b.r*.4,2,b.x,b.y,b.r*1.2);g.addColorStop(0,'#ffffff');g.addColorStop(.18,b.color);g.addColorStop(1,b.dark);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();
    ctx.lineWidth=5;ctx.strokeStyle=b.armed?'#ffd38a':b.color;ctx.stroke();
    ctx.shadowBlur=0;ctx.textAlign='center';ctx.font='bold 26px Inter,system-ui,sans-serif';ctx.fillStyle='#fff';ctx.fillText(b.name,b.x,b.y-b.r-26);
    if(state.showHp){
      const bw=96,bh=10,x=b.x-bw/2,y=b.y-b.r-17;
      ctx.fillStyle='rgba(0,0,0,.7)';roundedRect(ctx,x,y,bw,bh,5);ctx.fill();
      ctx.fillStyle=b.hp>50?'#4de0a0':b.hp>25?'#ffd34f':'#ff5364';roundedRect(ctx,x,y,bw*clamp(b.hp/b.maxHp,0,1),bh,5);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;roundedRect(ctx,x,y,bw,bh,5);ctx.stroke();
    }
    if(b.charge>0){ctx.strokeStyle='#ffd38a';ctx.lineWidth=7;ctx.beginPath();ctx.arc(b.x,b.y,b.r+12,-Math.PI/2,-Math.PI/2+Math.PI*2*b.charge/100);ctx.stroke();}
    ctx.restore();
  }
  function draw() {
    ctx.save();
    if(state.shake>0)ctx.translate(rand(-state.shake,state.shake),rand(-state.shake,state.shake));
    const bg=ctx.createRadialGradient(W*.5,H*.45,20,W*.5,H*.5,H*.75);bg.addColorStop(0,'#111a2b');bg.addColorStop(1,'#090b12');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.save();roundedRect(ctx,arena.x,arena.y,arena.w,arena.h,58);ctx.clip();
    ctx.fillStyle='#090d18';ctx.fillRect(arena.x,arena.y,arena.w,arena.h);
    ctx.strokeStyle='rgba(124,231,255,.085)';ctx.lineWidth=2;
    for(let x=arena.x;x<arena.x+arena.w;x+=44){ctx.beginPath();ctx.moveTo(x,arena.y);ctx.lineTo(x,arena.y+arena.h);ctx.stroke();}
    for(let y=arena.y;y<arena.y+arena.h;y+=44){ctx.beginPath();ctx.moveTo(arena.x,y);ctx.lineTo(arena.x+arena.w,y);ctx.stroke();}
    ctx.restore();
    // Fixed outer cyan frame plus animated shrinking danger line.
    ctx.save();ctx.shadowColor='#7ce7ff';ctx.shadowBlur=25;ctx.strokeStyle='#7ce7ff';ctx.lineWidth=8;roundedRect(ctx,arena.x,arena.y,arena.w,arena.h,58);ctx.stroke();ctx.restore();
    if(state.elapsed>=30){
      const inset=arena.shrink;
      ctx.save();ctx.shadowColor='#ff624f';ctx.shadowBlur=26;ctx.strokeStyle='rgba(255,91,67,'+(.65+.3*Math.sin(state.elapsed*9))+')';ctx.lineWidth=9;roundedRect(ctx,arena.x+inset,arena.y+inset,arena.w-inset*2,arena.h-inset*2,Math.max(22,58-inset*.18));ctx.stroke();ctx.restore();
    }
    if(state.weapon){
      const p=clamp(state.weapon.life/.5,0,1),r=state.weapon.r*(.8+p*.5);
      ctx.save();ctx.globalAlpha=1-p*.3;ctx.shadowColor='#ffd38a';ctx.shadowBlur=40;ctx.strokeStyle='#ffd38a';ctx.lineWidth=9;ctx.beginPath();ctx.arc(state.weapon.x,state.weapon.y,r*1.7,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='rgba(255,211,138,.15)';ctx.beginPath();ctx.arc(state.weapon.x,state.weapon.y,r*1.4,0,Math.PI*2);ctx.fill();
      ctx.translate(state.weapon.x,state.weapon.y);ctx.rotate(-Math.PI/4);ctx.fillStyle='#fff0bf';ctx.strokeStyle='#ffd38a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,-64);ctx.lineTo(15,8);ctx.lineTo(0,26);ctx.lineTo(-15,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#7b4e20';ctx.fillRect(-5,24,10,42);ctx.restore();
    }
    for(const w of state.waves){ctx.save();ctx.globalAlpha=clamp(w.life/w.maxLife,0,1);ctx.strokeStyle='#fff2c2';ctx.lineWidth=16*w.life/w.maxLife+2;ctx.shadowColor='#ffd38a';ctx.shadowBlur=30;ctx.beginPath();ctx.arc(w.x,w.y,w.r,0,Math.PI*2);ctx.stroke();ctx.restore();}
    for(const p of state.particles){ctx.save();ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();}
    state.balls.forEach(drawBall);
    // Canvas chrono: visible and legible in a captured 1080×1920 video.
    ctx.save();ctx.textAlign='center';ctx.shadowColor='#7ce7ff';ctx.shadowBlur=18;ctx.fillStyle='#fff';ctx.font='800 58px Inter,system-ui,sans-serif';ctx.fillText('BALLYSTIK',W/2,72);
    ctx.shadowBlur=0;ctx.fillStyle='#7ce7ff';ctx.font='800 72px Inter,system-ui,sans-serif';ctx.fillText(String(Math.ceil(60-state.elapsed)).padStart(2,'0'),W/2,arena.y-20);ctx.restore();
    ctx.restore();
  }
  function frame(now) {
    state.raf=0;const dt=Math.min(.035,Math.max(0,(now-state.last)/1000));state.last=now;
    update(dt);draw();
    $('timerCounter').textContent=String(Math.ceil(60-state.elapsed)).padStart(2,'0')+' s';
    $('ballCounter').textContent=state.balls.filter(b=>b.alive).length;
    if(state.running||state.recording)state.raf=requestAnimationFrame(frame);
  }
  function setStatus(text){$('recordStatus').textContent=text;}
  async function startRecording() {
    if(state.recording)return;
    if(!window.MediaRecorder||!canvas.captureStream){setStatus('Enregistrement non pris en charge par ce navigateur.');return;}
    resetMatch();
    const types=['video/mp4;codecs=h264','video/mp4'];
    const mime=types.find(t=>MediaRecorder.isTypeSupported(t));
    if(!mime){setStatus('MP4 natif indisponible : conversion MP4 à intégrer/valider dans ce navigateur.');return;}
    state.recordMime=mime;state.chunks=[];state.recordStream=canvas.captureStream(60);
    try {
      state.recorder=new MediaRecorder(state.recordStream,{mimeType:mime,videoBitsPerSecond:12000000});
      state.recorder.ondataavailable=e=>{if(e.data&&e.data.size)state.chunks.push(e.data);};
      state.recorder.onstop=()=>{
        const blob=new Blob(state.chunks,{type:'video/mp4'}),url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download='ballystik-combat.mp4';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
        state.recordStream?.getTracks().forEach(t=>t.stop());state.recording=false;setStatus('Vidéo MP4 prête au téléchargement.');
      };
      state.recording=true;state.recorder.start(1000);setStatus('Enregistrement du combat… 1080 × 1920');
    } catch(error){state.recording=false;state.recordStream?.getTracks().forEach(t=>t.stop());setStatus('Impossible de démarrer l’enregistrement MP4 dans ce navigateur.');}
  }
  function stopRecording(){if(state.recorder&&state.recorder.state!=='inactive')state.recorder.stop();}
  $('newGameBtn')?.addEventListener('click',resetMatch);
  $('resetBtn')?.addEventListener('click',resetMatch);
  $('replayBtn')?.addEventListener('click',resetMatch);
  $('recordBtn')?.addEventListener('click',startRecording);
  $('showHpToggle')?.addEventListener('change',e=>{state.showHp=e.target.checked;});
  $('audioInitBtn')?.addEventListener('click',()=>{
    state.audio=!state.audio;
    $('audioInitBtn').innerHTML=state.audio?'<i class="fa-solid fa-volume-high"></i> Audio':'<i class="fa-solid fa-volume-xmark"></i> Muet';
  });
  $('fullscreenBtn')?.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(_){}});
  const bindSidebar=(toggleId,closeId,sidebarId,direction)=>{
    const side=$(sidebarId),toggle=$(toggleId),close=$(closeId);if(!side)return;
    toggle?.addEventListener('click',()=>{side.classList.remove(direction==='left'?'-translate-x-full':'translate-x-full');side.classList.add('translate-x-0');});
    close?.addEventListener('click',()=>{side.classList.add(direction==='left'?'-translate-x-full':'translate-x-full');side.classList.remove('translate-x-0');});
  };
  bindSidebar('toggleLeftSidebarBtn','closeLeftSidebarBtn','leftSidebar','left');
  bindSidebar('toggleRightSidebarBtn','closeRightSidebarBtn','rightSidebar','right');
  resetMatch();
})();
