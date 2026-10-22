const { test, expect } = require('@playwright/test');

test.describe('Maps sources intégrées au moteur Arena Brawl', () => {
  test('les 15 maps originales sont proposées dans le menu Maps', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const select=page.locator('#arenaMapSelect');
    await expect(select.locator('optgroup[label*="Map Neon"] option')).toHaveCount(11);
    await expect(select.locator('optgroup[label*="Refonte"] option')).toHaveCount(4);
  });
  test('chaque map source expose son rendu et sa géométrie de collision', async ({ page }) => {
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
    await expect.poll(()=>page.evaluate(()=>window.BallYstikSourceMaps?.ready===true),{timeout:15000}).toBe(true);
    const results=await page.evaluate(()=>Array.from(document.querySelectorAll('#arenaMapSelect option')).filter(o=>/^source_(neon|refonte)_\d+$/.test(o.value)).map(o=>{const g=window.BallYstikSourceMaps.getGeometry(o.value,390,693,1,.5);return{id:o.value,name:g?.name,boundary:g?.boundary?.type,renderable:window.BallYstikSourceMaps.isSourceMap(o.value)}}));
    expect(results).toHaveLength(15);
    expect(results.every(r=>r.name&&r.boundary&&r.renderable)).toBe(true);
    expect(errors).toEqual([]);
  });
});

test.describe('BallYstik — pouvoirs d’origine fidèles à powers_final.html', () => {
  test('charge la simulation et présente les 14 pouvoirs validés', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/BallYstik/i);
    await expect(page.locator('#simCanvas')).toBeVisible();
    await expect(page.locator('#rightSettingsContainer')).toContainText('14 POUVOIRS');
    await expect(page.locator('[data-power-spawn]')).toHaveCount(14);
    await expect(page.locator('.power-catalog-group')).toHaveCount(4);
    for (const name of [
      'Rayon du Jugement', 'Chasseur Stellaire', 'Bombe à fragmentation',
      'Nova Sismique', 'Faille Magmatique', 'Singularité Violette',
      'Saut Quantique', 'Surcharge Giga', 'Prisme Réflecteur',
      'Division Cellulaire', 'Éclair en chaîne', 'Prison de Cristal',
      'Fleur Explosive', 'Sceau d’Emprisonnement'
    ]) {
      await expect(page.locator('#rightSettingsContainer')).toContainText(name);
    }
    expect(pageErrors, 'Aucune exception JavaScript non gérée au chargement').toEqual([]);
  });

  test('le panneau de spawn correspond au moteur et ne propose pas les anciens réglages fantômes', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-power-spawn]')).toHaveCount(14);
    await expect(page.locator('#manualSpawnAbility')).toHaveCount(0);
    await expect(page.locator('#powerEnabledCount')).toHaveCount(0);
    await expect(page.locator('[data-power-enabled]')).toHaveCount(0);
    await expect(page.locator('[data-power-group]')).toHaveCount(0);
    const ids = await page.locator('[data-power-spawn]').evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('data-power-spawn'))
    );
    expect(new Set(ids).size).toBe(14);
    expect(ids).toContain('crystal_prison');
    expect(ids).toContain('imprisonment_seal');
  });

  test('les effets globaux sont réinitialisés entre deux matchs', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(() => {
      const powers = window.PowersFinalOriginal;
      const behaviors = window.AbilityBehaviors;
      if (!powers || !behaviors || typeof behaviors.resetAll !== 'function') return { available: false };
      for (const power of Object.values(powers)) {
        if (Array.isArray(power.entities)) power.entities.push({ __auditResetProbe: true });
      }
      behaviors.resetAll();
      return {
        available: true,
        entityLeaks: Object.values(powers).some(power => Array.isArray(power.entities) && power.entities.some(entity => entity.__auditResetProbe)),
        probeEntities: Object.values(powers).reduce((n, power) => n + (Array.isArray(power.entities) ? power.entities.filter(entity => entity.__auditResetProbe).length : 0), 0)
      };
    });
    expect(result.available).toBe(true);
    expect(result.entityLeaks).toBe(false);
    expect(result.probeEntities).toBe(0);
  });
});

test('les contrôles principaux du combat sont présents', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#newGameBtn')).toBeVisible();
    await expect(page.locator('#resetBtn')).toBeVisible();
    await expect(page.locator('#recordBtn')).toBeVisible();
    await expect(page.locator('#playPauseBtn')).toBeVisible();
    await expect(page.locator('#activeSeedBadge')).toBeAttached();
  });
});

test('captures visuelles réelles des 10 pouvoirs sur canvas vertical 9:16', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 693 });
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#simCanvas')).toBeVisible();
  // Pause le combat : chaque capture montre un état déterministe plutôt qu'une image aléatoire.
  const pause = page.locator('#playPauseBtn');
  if (await pause.isVisible()) {
    const text = await page.locator('#playPauseText').textContent().catch(() => '');
    if (text.trim() === 'Pause') await pause.click();
  }
  await page.waitForTimeout(250);
  const fs = require('fs');
  fs.mkdirSync('test-results/power-visuals', { recursive: true });
  const ids = [
    'judgment_ray', 'star_hunter', 'bomb_shrapnel', 'seismic_nova', 'magma_rift',
    'singularity', 'quantum_jump', 'colossus', 'prism_reflector', 'multiplication'
  ];
  for (const id of ids) {
    const setup = await page.evaluate((powerId) => {
      const world = window.ArenaBattle && window.ArenaBattle._world;
      const bridge = window.ArenaBattleBridge;
      const behavior = window.AbilityBehaviors && window.AbilityBehaviors[powerId];
      const meta = window.AbilityRegistry && window.AbilityRegistry.get(powerId);
      if (!world || !bridge || !behavior || !meta || !world.balls || world.balls.length < 2) {
        return { error: 'Monde, balles ou pouvoir indisponible', powerId };
      }
      // Chaque capture part d'un état propre : aucun projectile ou effet du pouvoir précédent.
      world.projectiles.length = 0;
      window.ArenaBattle.particles.length = 0;
      window.ArenaBattle.shockwaves.length = 0;
      world.balls = world.balls.filter(b => !b.isClone);
      const bounds = world.arena.getBounds();
      const width = bounds.right - bounds.left;
      const height = bounds.bottom - bounds.top;
      const balls = world.balls.filter(b => b.alive && !b.isClone);
      for (const existingBall of balls) existingBall.abilitySlots = [];
      const ball = balls[0];
      const target = balls.find(b => b !== ball && b.team !== ball.team);
      if (!target) return { error: 'Cible adverse absente', powerId };
      // Mise en scène dans les limites de l'arène ; le canevas et le moteur de rendu restent réels.
      ball.x = bounds.left + width * .34; ball.y = bounds.top + height * .48;
      target.x = bounds.left + width * .62; target.y = bounds.top + height * .48;
      for (const [index, otherBall] of balls.entries()) {
        if (otherBall === ball || otherBall === target) continue;
        otherBall.x = bounds.left + width * (.46 + index * .08);
        otherBall.y = bounds.top + height * .74;
        otherBall.vx = 0; otherBall.vy = 0;
      }
      ball.vx = 0; ball.vy = 0; target.vx = 0; target.vy = 0;
      ball.abilitySlots = [];
      const slot = { meta, data: {}, timeLeft: 999, maxTime: 999, cooldownBase: 0 };
      behavior.attach(ball, world, slot);
      slot.data.cooldown = 0;
      ball.abilitySlots.push(slot);
      const dt = .02;
      if (powerId === 'judgment_ray') {
        for (let i = 0; i < 32; i++) behavior.update(ball, world, slot, dt);
      } else if (powerId === 'star_hunter') {
        behavior.update(ball, world, slot, dt);
        const p = world.projectiles.find(projectile => projectile.powerId === powerId);
        if (p) for (let i = 0; i < 20; i++) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 18) p.trail.shift();
          p.x += p.vx * dt; p.y += p.vy * dt;
          behavior.update(ball, world, slot, dt);
        }
      } else if (powerId === 'magma_rift') {
        slot.data.drop = 0;
        for (let i = 0; i < 8; i++) {
          behavior.update(ball, world, slot, .15);
          ball.x = Math.min(bounds.right - ball.radius, ball.x + width * .075);
        }
      } else {
        behavior.update(ball, world, slot, dt);
      }
      if (powerId === 'seismic_nova') slot.data.flash = .22;
      if (powerId === 'bomb_shrapnel') {
        const projectile = world.projectiles.find(p => p.powerId === powerId);
        if (projectile) { projectile.x = target.x; projectile.y = target.y; }
      }
      // Force l'impact et laisse le moteur réel traiter explosion + éclats.
      let realImpactFragments = 0;
      if (powerId === 'bomb_shrapnel') {
        // Isoler l'impact de la bombe du décor : le test vérifie ses éclats, pas le blocage par obstacle.
        // En combat réel, un obstacle peut légitimement intercepter le projectile avant la cible.
        world.arena.obstacles = [];
        const projectile = world.projectiles.find(p => p.powerId === powerId);
        if (projectile) {
          projectile.x = target.x;
          projectile.y = target.y;
          projectile.vx = 0;
          projectile.vy = 0;
          window.ArenaBattle.update(.016, world);
          realImpactFragments = world.projectiles.filter(p => p.type === 'shrapnel-fragment').length;
        }
      }
      window.ArenaBattle.render(bridge.ctx, world);
      return {
        powerId, canvasWidth: bridge.canvas.width, canvasHeight: bridge.canvas.height,
        aspectRatio: bridge.canvas.width / bridge.canvas.height,
        active: slot.data.active, beam: !!slot.data.beam, projectileCount: world.projectiles.length,
        zoneCount: slot.data.zones.length, portal: !!slot.data.portal,
        clones: world.balls.filter(b => b.isPowerDecoy && b.alive).length, realImpactFragments, bombBlastVisible: !!slot.data.blastFlash,
        radius: ball.radius, mirror: slot.data.mirror
      };
    }, id);
    expect(setup.error, id + ': préparation de la capture').toBeUndefined();
    expect(setup.canvasHeight, id + ': canvas réel non vide').toBeGreaterThan(0);
    expect(setup.aspectRatio, id + ': le canvas vidéo doit rester en 9:16').toBeCloseTo(9 / 16, 2);
    if (id === 'bomb_shrapnel') {
      expect(setup.realImpactFragments, 'la bombe doit réellement produire 8 éclats à l’impact').toBe(8);
      expect(setup.bombBlastVisible, 'l’impact doit déclencher son animation d’explosion').toBe(true);
    }
    // Capture les pixels du canvas lui-même, sans les boutons HTML superposés de l'interface.
    const dataUrl = await page.locator('#simCanvas').evaluate(canvas => canvas.toDataURL('image/png'));
    fs.writeFileSync('test-results/power-visuals/' + id + '.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
  }
});

test('les 10 boutons SPAWN créent le bon pickup dans le vrai moteur', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#rightSettingsContainer')).toBeVisible();
  const playText = (await page.locator('#playPauseText').textContent().catch(() => '')).trim();
  if (playText === 'Pause') await page.locator('#playPauseBtn').click();
  const powers = [
    ['judgment_ray', 'Rayon du Jugement'],
    ['star_hunter', 'Chasseur Stellaire'],
    ['bomb_shrapnel', 'Bombe à fragmentation'],
    ['seismic_nova', 'Nova Sismique'],
    ['magma_rift', 'Faille Magmatique'],
    ['singularity', 'Singularité Violette'],
    ['quantum_jump', 'Saut Quantique'],
    ['colossus', 'Surcharge Giga'],
    ['prism_reflector', 'Prisme Réflecteur'],
    ['multiplication', 'Division Cellulaire']
  ];
  for (const [id, name] of powers) {
    await page.locator('[data-power-spawn="' + id + '"]').click();
    await expect.poll(() => page.evaluate(powerId =>
      window.ArenaBattle.pickupSystem.items.some(p => p.meta && p.meta.id === powerId),
    id), { message: id + ': le bouton doit créer un pickup dans le moteur' }).toBe(true);
    await expect(page.locator('#powerSpawnStatus')).toContainText(name);
  }
});

const POWER_CASES = [
  ['judgment_ray', 'Rayon du Jugement', 'ray'],
  ['star_hunter', 'Chasseur Stellaire', 'homing'],
  ['bomb_shrapnel', 'Bombe à fragmentation', 'bomb'],
  ['seismic_nova', 'Nova Sismique', 'nova'],
  ['magma_rift', 'Faille Magmatique', 'magma'],
  ['singularity', 'Singularité Violette', 'singularity'],
  ['quantum_jump', 'Saut Quantique', 'teleport'],
  ['colossus', 'Surcharge Giga', 'colossus'],
  ['prism_reflector', 'Prisme Réflecteur', 'parry'],
  ['multiplication', 'Division Cellulaire', 'clones']
];

for (const [powerId, powerName, expectation] of POWER_CASES) {
  test('audit individuel — ' + powerName + ' (' + powerId + ')', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(({ powerId, expectation }) => {
      const behavior = window.AbilityBehaviors[powerId];
      const registryEntry = window.AbilityRegistry.get(powerId);
      if (!behavior || !registryEntry) return { error: 'Pouvoir absent du registre ou des comportements' };
      const ball = {
        id: 1, x: 100, y: 100, radius: 20, baseMoveSpeed: 200,
        vx: 0, vy: 0, team: 'red', alive: true, speedMultiplier: 1
      };
      const target = {
        id: 2, x: 145, y: 100, radius: 18, vx: 0, vy: 0,
        team: 'blue', alive: true
      };
      const calls = { damage: [], particles: 0, shockwaves: 0, clones: 0 };
      const world = {
        balls: [ball, target],
        projectiles: [],
        arena: { getBounds: () => ({ left: 0, right: 600, top: 0, bottom: 1000 }) },
        damage: (...args) => calls.damage.push(args),
        spawnParticle: () => calls.particles++,
        addShockwave: () => calls.shockwaves++,
        playSound: () => {},
        spawnCloneFor: (source) => {
          const id = 100 + (++calls.clones);
          world.balls.push({ ...source, id, x: source.x + 30 * calls.clones,
            y: source.y + 25 * calls.clones, alive: true, isClone: true, isPowerDecoy: true });
          return id;
        }
      };
      if (expectation === 'singularity') {
        world.balls.push({ id: 3, x: 220, y: 100, radius: 18, vx: 0, vy: 0, team: 'green', alive: true });
      }
      const slot = { data: {}, meta: { color: registryEntry.color } };
      behavior.attach(ball, world, slot);
      slot.data.cooldown = 0;
      const ctx = new Proxy({
        createRadialGradient: () => ({ addColorStop: () => {} }),
        measureText: () => ({ width: 1 })
      }, {
        get: (obj, key) => key in obj ? obj[key] : (() => {}),
        set: (obj, key, value) => { obj[key] = value; return true; }
      });
      const initial = { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, radius: ball.radius };
      if (expectation === 'ray') {
        for (let i = 0; i < 40; i++) behavior.update(ball, world, slot, 0.02);
      } else if (expectation === 'magma') {
        for (let i = 0; i < 8; i++) behavior.update(ball, world, slot, 0.02);
      } else if (expectation === 'singularity') {
        behavior.update(ball, world, slot, 0.02);
      } else if (expectation === 'parry') {
        behavior.update(ball, world, slot, 0.016);
        const reflected = behavior.onTakeDamage(ball, target, 12, world, slot);
        calls.parryBlocked = reflected === 0;
      } else {
        behavior.update(ball, world, slot, 0.02);
      }
      let renderError = null;
      try { behavior.render(ctx, ball, world, slot); } catch (e) { renderError = e.message; }
      let passed = false;
      switch (expectation) {
        case 'ray': passed = calls.damage.length > 0 && !!slot.data.beam; break;
        case 'homing': passed = world.projectiles.some(p => p.powerId === powerId && p.target); break;
        case 'bomb': passed = world.projectiles.some(p => p.powerId === powerId && p.splashRadius >= 80 && p.shrapnel === true); break;
        case 'nova': passed = calls.damage.length > 0 && calls.shockwaves > 0; break;
        case 'magma': passed = slot.data.zones.length > 0; break;
        case 'singularity': passed = slot.data.zones.length > 0 &&
          (world.balls[2].vx !== 0 || world.balls[2].vy !== 0); break;
        case 'teleport': passed = !!slot.data.portal && (ball.x !== initial.x || ball.y !== initial.y); break;
        case 'colossus': passed = ball.radius > initial.radius && ball.speedMultiplier === 0.7; break;
        case 'parry': passed = calls.parryBlocked && calls.damage.some(c => c[3] === 'prism-reflector') &&
          slot.data.mirror === false; break;
        case 'clones': passed = calls.clones === 2; break;
      }
      return { passed, renderError, damageCount: calls.damage.length,
        projectileCount: world.projectiles.length, zoneCount: slot.data.zones.length,
        cloneCount: calls.clones, active: slot.data.active, cooldown: slot.data.cooldown,
        radius: ball.radius, speedMultiplier: ball.speedMultiplier,
        targetVx: target.vx, targetVy: target.vy, portal: slot.data.portal };
    }, { powerId, expectation });
    expect(result.error, powerName + ': présence dans le registre').toBeUndefined();
    expect(result.renderError, powerName + ': rendu Canvas sans exception').toBeNull();
    expect(result.passed, powerName + ': déclenchement et conséquence attendue. Résultat: ' + JSON.stringify(result)).toBe(true);
  });
}


test('les panneaux de cartes suivent la sélection et les trois nouvelles maps sont instanciées', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
  const select = page.locator('#arenaMapSelect');
  for (const [map, panel] of [
    ['sanctuaire', '#sanctuaireMapSettings'],
    ['neon_grid', '#newMapSettings'],
    ['volcan', '#newMapSettings'],
    ['nexus', '#newMapSettings'],
    ['neon', '#defaultMapSettings']
  ]) {
    await select.selectOption(map);
    await expect(page.locator(panel)).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.ArenaBattle?._world?.arena?.mapStyle)).toBe(map);
    if (['neon_grid', 'volcan', 'nexus'].includes(map)) {
      await expect.poll(() => page.evaluate(() => window.ArenaBattle?._world?.arena?.obstacles?.length)).toBe(3);
    }
  }
  expect(pageErrors, 'Aucune exception JavaScript non gérée pendant les changements de carte').toEqual([]);
});

test('la map Sanctuaire du Chaos est sélectionnable et reste dans les limites de l’arène', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 693 });
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#arenaMapSelect')).toBeVisible();
  await page.locator('#arenaMapSelect').selectOption('sanctuaire');
  await expect(page.locator('#sanctuaireMapSettings')).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const world = window.ArenaBattle && window.ArenaBattle._world;
    return world && world.arena && world.arena.mapStyle;
  })).toBe('sanctuaire');
  const bounds = await page.evaluate(() => {
    const arena = window.ArenaBattle._world.arena;
    const b = arena.getBounds();
    const obstacles = arena.obstacles || [];
    return {
      left: b.left, top: b.top, right: b.right, bottom: b.bottom,
      obstacles: obstacles.map(o => ({ x: o.x, y: o.y, r: o.r }))
    };
  });
  expect(bounds.obstacles.length).toBeGreaterThan(0);
  for (const obstacle of bounds.obstacles) {
    expect(obstacle.x - obstacle.r).toBeGreaterThanOrEqual(bounds.left);
    expect(obstacle.x + obstacle.r).toBeLessThanOrEqual(bounds.right);
    expect(obstacle.y - obstacle.r).toBeGreaterThanOrEqual(bounds.top);
    expect(obstacle.y + obstacle.r).toBeLessThanOrEqual(bounds.bottom);
  }
  expect(pageErrors).toEqual([]);
});
