const { test, expect } = require('@playwright/test');

test.describe('BallYstik v2-power — pouvoirs lisibles en une seconde', () => {
  test('charge la simulation et présente exactement 10 pouvoirs', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/BallYstik/i);
    await expect(page.locator('#simCanvas')).toBeVisible();
    await expect(page.locator('#rightSettingsContainer')).toContainText('10 pouvoirs');
    await expect(page.locator('#manualSpawnAbility option')).toHaveCount(10);
    await expect(page.locator('[data-power-enabled]')).toHaveCount(10);
    await expect(page.locator('[data-power-group]')).toHaveCount(8);
    await expect(page.locator('#powerEnabledCount')).toContainText('10 / 10');
    for (const name of ['Rayon du Jugement', 'Chasseur Stellaire', 'Bombe à fragmentation',
      'Nova Sismique', 'Faille Magmatique', 'Singularité Violette', 'Saut Quantique',
      'Surcharge Giga', 'Prisme Réflecteur', 'Division Cellulaire']) {
      await expect(page.locator('#rightSettingsContainer')).toContainText(name);
    }
    expect(pageErrors, 'Aucune exception JavaScript non gérée au chargement').toEqual([]);
  });

  test('les réglages des pouvoirs sont interactifs et persistés', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const firstToggle = page.locator('[data-power-enabled="judgment_ray"]');
    await expect(firstToggle).toBeChecked();
    await firstToggle.uncheck();
    await expect(page.locator('#powerEnabledCount')).toContainText('9 / 10');
    await expect.poll(async () => page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('ballystik.v2-power.settings.v1') || '{}');
      return state.judgment_ray && state.judgment_ray.enabled;
    })).toBe(false);
    const groupButton = page.locator('[data-power-group="distance"]');
    await groupButton.click();
    await expect(groupButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#power-group-distance')).toBeHidden();
    await groupButton.click();
    await expect(page.locator('#power-group-distance')).toBeVisible();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-power-enabled="judgment_ray"]')).not.toBeChecked();
    await expect(page.locator('#powerEnabledCount')).toContainText('9 / 10');
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
        if (p) for (let i = 0; i < 24; i++) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 10) p.trail.shift();
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
