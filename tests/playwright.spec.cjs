const { test, expect } = require('@playwright/test');

test.describe('BallYstik v2-power — smoke tests', () => {
  test('charge la simulation et le menu Pouvoirs', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/BallYstik/i);
    await expect(page.locator('#simCanvas')).toBeVisible();
    await expect(page.locator('#rightSettingsContainer')).toContainText('24 pouvoirs');

    // Le registre et les menus doivent présenter 24 pouvoirs répartis en 8 familles.
    await expect(page.locator('#manualSpawnAbility option')).toHaveCount(24);
    await expect(page.locator('[data-power-enabled]')).toHaveCount(24);
    await expect(page.locator('[data-power-group]')).toHaveCount(8);

    // Vérifie les catégories visibles et le compteur d'activation.
    await expect(page.locator('#rightSettingsContainer')).toContainText('À distance');
    await expect(page.locator('#rightSettingsContainer')).toContainText('Défense / Réactif');
    await expect(page.locator('#powerEnabledCount')).toContainText('24 / 24');

    expect(pageErrors, 'Aucune exception JavaScript non gérée au chargement').toEqual([]);
  });

  test('les réglages des pouvoirs sont interactifs et persistés', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const firstToggle = page.locator('[data-power-enabled="judgment_ray"]');
    await expect(firstToggle).toBeChecked();
    await firstToggle.uncheck();
    await expect(page.locator('#powerEnabledCount')).toContainText('23 / 24');
    await expect.poll(async () => {
      return page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('ballystik.v2-power.settings.v1') || '{}');
        return state.judgment_ray && state.judgment_ray.enabled;
      });
    }).toBe(false);

    const groupButton = page.locator('[data-power-group="distance"]');
    await groupButton.click();
    await expect(groupButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#power-group-distance')).toBeHidden();
    await groupButton.click();
    await expect(page.locator('#power-group-distance')).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-power-enabled="judgment_ray"]')).not.toBeChecked();
    await expect(page.locator('#powerEnabledCount')).toContainText('23 / 24');
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


test.describe('BallYstik v2-power — comportements prioritaires', () => {
  test('Dernier Souffle inflige des dégâts à la mort et produit un effet', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(() => {
      const behavior = window.AbilityBehaviors.last_breath;
      const ball = { id: 1, x: 100, y: 100, radius: 20, team: 'red', alive: false };
      const target = { id: 2, x: 150, y: 100, radius: 18, team: 'blue', alive: true, vx: 0, vy: 0 };
      const calls = { damage: [], particles: 0, shockwaves: 0 };
      const world = {
        balls: [ball, target],
        damage: (...args) => calls.damage.push(args),
        spawnParticle: () => calls.particles++,
        addShockwave: () => calls.shockwaves++
      };
      behavior.onDeath(ball, world, { data: {} });
      return { damageCount: calls.damage.length, damage: calls.damage[0]?.[2], particles: calls.particles, shockwaves: calls.shockwaves, targetAlive: target.alive };
    });
    expect(result.damageCount).toBe(1);
    expect(result.damage).toBeGreaterThan(0);
    expect(result.particles).toBeGreaterThan(0);
    expect(result.shockwaves).toBeGreaterThan(0);
  });

  test('Dôme Réfractaire réduit le premier dégât et consomme le bouclier', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(() => {
      const behavior = window.AbilityBehaviors.refractive_dome;
      const ball = { id: 1, x: 100, y: 100, radius: 20, team: 'red', alive: true };
      const slot = { data: {} };
      const world = { spawnParticle: () => {}, addShockwave: () => {} };
      behavior.attach(ball, world, slot);
      slot.data.shield = true;
      slot.data.shieldLife = 3.5;
      const reduced = behavior.onTakeDamage(ball, { alive: true }, 10, world, slot);
      return { reduced, shield: slot.data.shield, shieldLife: slot.data.shieldLife };
    });
    expect(result.reduced).toBeCloseTo(1.8, 5);
    expect(result.shield).toBe(false);
    expect(result.shieldLife).toBe(0);
  });

  test('Bélier Titan active une charge quand une cible est disponible', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(() => {
      const behavior = window.AbilityBehaviors.titan_ram;
      const ball = { id: 1, x: 100, y: 100, radius: 20, baseMoveSpeed: 200, vx: 0, vy: 0, team: 'red', alive: true, speedMultiplier: 1 };
      const target = { id: 2, x: 300, y: 100, radius: 20, vx: 0, vy: 0, team: 'blue', alive: true };
      const world = { balls: [ball, target], damage: () => {}, spawnParticle: () => {}, addShockwave: () => {} };
      const slot = { data: {} };
      behavior.attach(ball, world, slot);
      slot.data.cooldown = 0;
      behavior.update(ball, world, slot, 0.016);
      return { active: slot.data.active, cooldown: slot.data.cooldown, speedMultiplier: ball.speedMultiplier, vx: ball.vx, vy: ball.vy };
    });
    expect(result.active).toBeGreaterThan(0);
    expect(result.cooldown).toBeGreaterThan(0);
    expect(result.speedMultiplier).toBe(2.2);
    expect(result.vx).toBeGreaterThan(0);
    expect(Math.abs(result.vy)).toBeLessThan(0.001);
  });

  test('Surcharge Électrique endommage une cible proche pendant son activation', async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(() => {
      const behavior = window.AbilityBehaviors.electric_overload;
      const ball = { id: 1, x: 100, y: 100, radius: 20, baseMoveSpeed: 200, vx: 0, vy: 0, team: 'red', alive: true };
      const target = { id: 2, x: 145, y: 100, radius: 20, vx: 0, vy: 0, team: 'blue', alive: true };
      const calls = [];
      const world = { balls: [ball, target], damage: (...args) => calls.push(args), spawnParticle: () => {}, addShockwave: () => {} };
      const slot = { data: {} };
      behavior.attach(ball, world, slot);
      slot.data.cooldown = 0;
      behavior.update(ball, world, slot, 0.016);
      slot.data.hitTimers = {};
      behavior.update(ball, world, slot, 0.016);
      return { active: slot.data.active, damageCount: calls.length, damage: calls[0]?.[2] };
    });
    expect(result.active).toBeGreaterThan(0);
    expect(result.damageCount).toBeGreaterThan(0);
    expect(result.damage).toBe(7);
  });
});


// Audit individuel : chaque pouvoir est déclenché dans un scénario isolé.
// Ces tests vérifient le déclenchement, une conséquence mesurable et l'absence
// d'exception pendant le rendu Canvas. Ils ne remplacent pas une notation visuelle humaine.
const POWER_CASES = [
  ['judgment_ray', 'Rayon du Jugement', 'damage'],
  ['star_hunter', 'Chasseur Stellaire', 'projectile'],
  ['ghost_billiard', 'Billard Fantôme', 'triple-projectile'],
  ['seismic_nova', 'Nova Sismique', 'damage'],
  ['titan_ram', 'Bélier Titan', 'ram'],
  ['zero_detonator', 'Détonateur Zéro', 'delayed-damage'],
  ['magma_rift', 'Faille Magmatique', 'zone'],
  ['ice_prison', 'Prison de Givre', 'zone'],
  ['toxic_mist', 'Brouillard Toxique', 'zone'],
  ['singularity', 'Singularité', 'pull'],
  ['polarity_flip', 'Polarité Inversée', 'control'],
  ['time_distortion', 'Distorsion Temporelle', 'slow'],
  ['lightning_ghost', 'Fantôme Éclair', 'dash'],
  ['mirror_portal', 'Portail Miroir', 'teleport'],
  ['crazy_orbit', 'Orbite Folle', 'orbit'],
  ['multiplication', 'Multiplication', 'clones'],
  ['sentinel_turret', 'Tourelle Sentinelle', 'turret'],
  ['voracious_swarm', 'Essaim Vorace', 'swarm'],
  ['colossus', 'Colosse', 'transform'],
  ['electric_overload', 'Surcharge Électrique', 'damage'],
  ['blazing_comet', 'Comète Ardente', 'trail'],
  ['refractive_dome', 'Dôme Réfractaire', 'shield'],
  ['revenge_mirror', 'Miroir Vengeur', 'reflect'],
  ['last_breath', 'Dernier Souffle', 'death']
];

for (const [powerId, powerName, expectation] of POWER_CASES) {
  test(`audit individuel — ${powerName} (${powerId})`, async ({ page }) => {
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(({ powerId, expectation }) => {
      const behavior = window.AbilityBehaviors[powerId];
      const registryEntry = window.AbilityRegistry.get(powerId);
      if (!behavior || !registryEntry) return { error: 'Pouvoir absent du registre ou des comportements' };

      const ball = {
        id: 1, x: 100, y: 100, radius: 20, baseMoveSpeed: 200,
        vx: 0, vy: 0, team: 'red', alive: true, speedMultiplier: 1,
        hp: 100, maxHp: 100
      };
      const target = {
        id: 2, x: 145, y: 100, radius: 18, vx: 0, vy: 0,
        team: 'blue', alive: true, hp: 100, maxHp: 100
      };
      const calls = { damage: [], particles: 0, shockwaves: 0, clones: 0 };
      const world = {
        balls: [ball, target],
        projectiles: [],
        arena: { getBounds: () => ({ left: 0, right: 600, top: 0, bottom: 1000 }) },
        damage: (...args) => calls.damage.push(args),
        spawnParticle: () => calls.particles++,
        addShockwave: () => calls.shockwaves++,
        spawnCloneFor: (source) => {
          const id = 100 + (++calls.clones);
          world.balls.push({ ...source, id, x: source.x + 30 * calls.clones, y: source.y + 25 * calls.clones, alive: true, isClone: true });
          return id;
        }
      };
      if (expectation === 'pull') world.balls.push({ id: 3, x: 220, y: 100, radius: 18, vx: 0, vy: 0, team: 'blue', alive: true, hp: 100, maxHp: 100 });
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
      if (expectation === 'death') {
        ball.alive = false;
        behavior.onDeath(ball, world, slot);
      } else if (expectation === 'reflect') {
        behavior.update(ball, world, slot, 0.016);
        behavior.onTakeDamage(ball, target, 12, world, slot);
      } else {
        const steps = expectation === 'damage' && powerId === 'judgment_ray' ? 45
          : expectation === 'delayed-damage' ? 45
          : expectation === 'pull' ? 20
          : expectation === 'zone' ? 8
          : expectation === 'turret' ? 8 : 3;
        for (let i = 0; i < steps; i++) behavior.update(ball, world, slot, 0.02);
      }

      let renderError = null;
      try { behavior.render(ctx, ball, world, slot); } catch (e) { renderError = e.message; }

      let passed = false;
      switch (expectation) {
        case 'damage': passed = calls.damage.length > 0; break;
        case 'projectile': passed = world.projectiles.some(p => p.powerId === powerId); break;
        case 'triple-projectile': passed = world.projectiles.filter(p => p.type === 'ghost-billiard').length === 3; break;
        case 'ram': passed = slot.data.active > 0 && ball.speedMultiplier === 2.2; break;
        case 'delayed-damage': passed = calls.damage.some(c => c[3] === 'zero-detonator'); break;
        case 'zone': passed = slot.data.zones.length > 0; break;
        case 'pull': passed = slot.data.zones.length > 0 && (world.balls[2].vx !== 0 || world.balls[2].vy !== 0); break;
        case 'control': passed = slot.data.active > 0 && (target.vx !== 0 || target.vy !== 0); break;
        case 'slow': passed = (target._powerSlowTimer || 0) > 0; break;
        case 'dash': passed = !!slot.data.dash && ball.speedMultiplier === 3.1; break;
        case 'teleport': passed = !!slot.data.portal && (ball.x !== initial.x || ball.y !== initial.y); break;
        case 'orbit': passed = slot.data.active > 0 && (ball.vx !== initial.vx || ball.vy !== initial.vy); break;
        case 'clones': passed = calls.clones === 2; break;
        case 'turret': passed = slot.data.turretLife > 0 && world.projectiles.some(p => p.powerId === powerId); break;
        case 'swarm': passed = slot.data.active > 0; break;
        case 'transform': passed = ball.radius > initial.radius && ball.speedMultiplier === 0.7; break;
        case 'trail': passed = slot.data.zones.length > 0 && ball.speedMultiplier === 1.4; break;
        case 'shield': passed = slot.data.shield === true; break;
        case 'reflect': passed = calls.damage.some(c => c[3] === 'revenge-mirror'); break;
        case 'death': passed = calls.damage.some(c => c[3] === 'last-breath') && calls.shockwaves > 0; break;
      }
      return {
        passed, renderError, damageCount: calls.damage.length, projectileCount: world.projectiles.length,
        zoneCount: slot.data.zones.length, cloneCount: calls.clones, active: slot.data.active,
        cooldown: slot.data.cooldown, shield: slot.data.shield, mirror: slot.data.mirror,
        radius: ball.radius, speedMultiplier: ball.speedMultiplier,
        targetVx: target.vx, targetVy: target.vy, slowTimer: target._powerSlowTimer || 0
      };
    }, { powerId, expectation });

    expect(result.error, `${powerName}: présence dans le registre`).toBeUndefined();
    expect(result.renderError, `${powerName}: rendu Canvas sans exception`).toBeNull();
    expect(result.passed, `${powerName}: déclenchement et conséquence attendue. Résultat: ${JSON.stringify(result)}`).toBe(true);
  });
}
