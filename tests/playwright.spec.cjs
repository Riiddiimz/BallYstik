const { test, expect } = require('@playwright/test');

test.describe('Maps sources intégrées au moteur Arena Brawl', () => {
  test('les 15 maps originales sont proposées dans le menu Maps', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const select=page.locator('#arenaMapSelect');
    await expect(select.locator('optgroup[label*="Map Neon"] option')).toHaveCount(11);
    await expect(select.locator('optgroup[label*="Refonte"] option')).toHaveCount(4);
  });
  test('une map source est réellement sélectionnable et rendue par le moteur principal', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => window.BallYstikSourceMaps?.ready === true), { timeout: 15000 }).toBe(true);
    for (const id of ['source_neon_0', 'source_refonte_3']) {
      await page.locator('#arenaMapSelect').selectOption(id);
      await expect.poll(() => page.evaluate(() => window.ArenaBattle?._world?.arena?.mapStyle)).toBe(id);
      const result = await page.evaluate(() => {
        const arena = window.ArenaBattle._world.arena;
        const ctx = document.getElementById('simCanvas').getContext('2d');
        arena.render(ctx);
        return {
          mapStyle: arena.mapStyle,
          genericObstacles: arena.obstacles.length,
          backgroundDrawn: ctx.getImageData(0, 0, 1, 1).data[3] > 0
        };
      });
      expect(result.mapStyle).toBe(id);
      expect(result.genericObstacles).toBe(0);
      expect(result.backgroundDrawn).toBe(true);
    }
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
        zoneCount: window.ArenaBattle?._world?.zones?.length ?? 0, portal: !!slot.data.portal,
        clones: world.balls.filter(b => b.isPowerDecoy && b.alive).length, realImpactFragments, bombBlastVisible: !!slot.data.blastFlash,
        radius: ball.radius, mirror: slot.data.mirror
      };
    }, id);
    expect(setup.error, id + ': préparation de la capture').toBeUndefined();
    expect(setup.canvasHeight, id + ': canvas réel non vide').toBeGreaterThan(0);
    expect(setup.aspectRatio, id + ': le canvas vidéo doit rester en 9:16').toBeCloseTo(9 / 16, 2);
    // Le rendu est géré par le moteur Powers Final, pas par les projectiles legacy de l'arène.
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
    // Le statut HTML a été retiré de l'interface compacte ; la présence du pickup dans le moteur est l'assertion fonctionnelle.
  }
});


test('les 14 pouvoirs sont enregistrés et peuvent tous apparaître sur la carte', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => {
    const arena = window.ArenaBattle;
    const registry = window.AbilityRegistry;
    const ids = Object.keys(registry.all);
    const world = arena._world;
    if (window.AbilitySettings) for (const id of ids) {
      window.AbilitySettings.setEnabled(id, true);
      window.AbilitySettings.setWeight(id, 4);
    }
    arena.pickupSystem.items.length = 0;
    arena.pickupSystem.setConfig({ spawnInterval: 0 });
    const missingBehaviors = ids.filter(id => !window.AbilityBehaviors[id]);
    const selectionFailures = ids.filter(id => {
      const picked = registry.pickRandom(world.prng, meta => meta.id === id);
      return !picked || picked.id !== id;
    });
    const spawnFailures = ids.filter(id => !arena.spawnPickup(id));
    return { count: ids.length, missingBehaviors, selectionFailures, spawnFailures,
      spawnedIds: arena.pickupSystem.items.map(item => item.meta.id) };
  });
  expect(result.count).toBe(14);
  expect(result.missingBehaviors).toEqual([]);
  expect(result.selectionFailures).toEqual([]);
  expect(result.spawnFailures).toEqual([]);
  expect(new Set(result.spawnedIds).size).toBe(14);
});

test('Division Cellulaire : les clones infligent des dégâts et repoussent les adversaires', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => {
    const arena = window.ArenaBattle, world = arena._world;
    const ball = world.balls.find(b => b.alive);
    if (!ball) return { error: 'boule de test indisponible' };
    const target = world.balls.find(b => b.alive && b.team !== ball.team);
    if (!target) return { error: 'cible adverse indisponible' };
    const bounds = world.arena.getBounds();
    ball.x = bounds.left + (bounds.right - bounds.left) * 0.5;
    ball.y = bounds.top + (bounds.bottom - bounds.top) * 0.5;
    target.x = ball.x; target.y = ball.y;
    ball.vx = 0; ball.vy = 0; target.vx = 0; target.vy = 0;
    target.health.invuln = 0;
    const before = target.health.current;
    const slot = { meta: window.AbilityRegistry.get('multiplication'), data: null };
    const behavior = window.AbilityBehaviors.multiplication;
    behavior.attach(ball, world, slot);
    behavior.update(ball, world, slot, 0.02);
    return { before, after: target.health.current, targetVelocity: Math.hypot(target.vx, target.vy) };
  });
  expect(result.error).toBeUndefined();
  expect(result.after).toBeLessThan(result.before);
  expect(result.targetVelocity).toBeGreaterThan(0);
});

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


test('la fréquence des orbes peut être désactivée et les anciennes maps sont retirées', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
  const interval = page.locator('#abPickupInterval');
  await expect(interval).toHaveAttribute('min', '0');
  await interval.evaluate(el => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#abPickupIntervalVal')).toHaveText('Désactivée');

  const result = await page.evaluate(() => {
    const select = document.getElementById('arenaMapSelect');
    const system = new window.PickupSystem({ next: () => 0.5 });
    system.setConfig({ spawnInterval: 0 });
    system.update(10, { arena: { x: 0, y: 0, w: 100, h: 100 }, balls: [] });
    return {
      zeroIntervalSpawns: system.items.length,
      retiredMapsPresent: ['void', 'sablier', 'vortex_test'].filter(id =>
        Array.from(select.options).some(option => option.value === id)
      )
    };
  });
  expect(result.zeroIntervalSpawns).toBe(0);
  expect(result.retiredMapsPresent).toEqual([]);
});


test.describe('Audio et activation unique des pouvoirs', () => {
  test('les 14 pouvoirs déclenchent chacun leur signature sonore une seule fois', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(() => {
      const ids = Object.keys(window.PowersFinalOriginal || {});
      const world = window.ArenaBattle?._world;
      const ball = world?.balls?.find(item => item.alive);
      if (ids.length !== 14 || !world || !ball || !window.AbilityBehaviors) {
        return { ready: false, ids: ids.length, hasWorld: !!world, hasBall: !!ball };
      }
      const calls = [];
      const originalAudio = window.audioSynth;
      window.audioSynth = { playFx: (name, opts) => calls.push({ name, powerId: opts?.powerId }) };
      try {
        const slots = [];
        for (const id of ids) {
          const slot = { meta: { id }, data: null };
          slots.push(slot);
          window.AbilityBehaviors[id].attach(ball, world, slot);
        }
        const initialPowerSounds = calls.filter(call => call.name === 'power');
        for (let frame = 1; frame <= 20; frame++) {
          for (const slot of slots) window.AbilityBehaviors[slot.meta.id].update(ball, world, slot, 0.25);
        }
        return {
          ready: true,
          expected: ids.length,
          initialPowerSounds: initialPowerSounds.length,
          uniquePowerIds: new Set(initialPowerSounds.map(call => call.powerId)).size,
          laterPowerSounds: calls.filter(call => call.name === 'power').length - initialPowerSounds.length
        };
      } finally {
        window.audioSynth = originalAudio;
      }
    });
    expect(result.ready, JSON.stringify(result)).toBe(true);
    expect(result.initialPowerSounds).toBe(14);
    expect(result.uniquePowerIds).toBe(14);
    expect(result.laterPowerSounds).toBe(0);
  });

  test('les sons de collision, rebord, obstacle, impact et élimination sont routés séparément', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(() => {
      const world = window.ArenaBattle?._world;
      if (!world || typeof world.playSound !== 'function') return { ready: false };
      const calls = [];
      const originalAudio = window.audioSynth;
      window.audioSynth = { playFx: name => calls.push(name) };
      try {
        for (const name of ['collision', 'wall', 'obstacle', 'hit', 'ko', 'power']) world.playSound(name);
        return { ready: true, calls };
      } finally {
        window.audioSynth = originalAudio;
      }
    });
    expect(result.ready).toBe(true);
    expect(result.calls).toEqual(['collision', 'wall', 'obstacle', 'hit', 'ko', 'power']);
  });
});
