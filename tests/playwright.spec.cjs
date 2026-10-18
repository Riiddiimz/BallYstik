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
