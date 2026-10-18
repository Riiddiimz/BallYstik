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
        case 'bomb': passed = world.projectiles.some(p => p.powerId === powerId && p.splashRadius >= 80); break;
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
