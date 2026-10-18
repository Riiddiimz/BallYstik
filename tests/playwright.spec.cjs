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
