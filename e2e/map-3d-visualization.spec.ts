import { test, expect } from '@playwright/test';

test.describe('3D Map Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to load
    await page.waitForSelector('app-console', { state: 'visible' });
  });

  test('should open map modal when map command is entered', async ({ page }) => {
    // Type the map command
    await page.locator('input[type="text"]').fill('map');
    await page.keyboard.press('Enter');

    // Wait for map modal to appear
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });

    // Check that map modal is visible
    const mapOverlay = page.locator('.map-overlay');
    await expect(mapOverlay).toBeVisible();

    // Check for the 3D graph container
    const graphContainer = page.locator('.graph-container');
    await expect(graphContainer).toBeVisible();
  });

  test('should display initial room in the map', async ({ page }) => {
    // Open the map
    await page.locator('input[type="text"]').fill('map');
    await page.keyboard.press('Enter');

    // Wait for map modal to appear
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });

    // Check that room count is at least 1
    const roomCount = page.locator('.map-stat-value').first();
    await expect(roomCount).toContainText(/[1-9]/);
  });

  test('should update map when exploring new rooms', async ({ page }) => {
    // Open the map initially
    await page.locator('input[type="text"]').fill('map');
    await page.keyboard.press('Enter');

    // Wait for map modal and get initial room count
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });
    const initialRoomCount = await page.locator('.map-stat-value').first().textContent();

    // Close the map
    await page.locator('.map-close-btn').click();
    await page.waitForSelector('.map-overlay', { state: 'hidden' });

    // Move to a new room
    await page.locator('input[type="text"]').fill('north');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Open the map again
    await page.locator('input[type="text"]').fill('map');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });

    // Get the new room count
    const newRoomCount = await page.locator('.map-stat-value').first().textContent();

    // Room count should be different (likely increased)
    expect(newRoomCount).not.toBe(initialRoomCount);
  });

  test('should close map modal when close button is clicked', async ({ page }) => {
    // Open the map
    await page.locator('input[type="text"]').fill('map');
    await page.keyboard.press('Enter');

    // Wait for map modal to appear
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });

    // Click close button
    await page.locator('.map-close-btn').click();

    // Map should be hidden
    await expect(page.locator('.map-overlay')).toBeHidden();
  });

  test('should close map modal when overlay is clicked', async ({ page }) => {
    // Open the map
    await page.locator('input[type="text"]').fill('map');
    await page.keyboard.press('Enter');

    // Wait for map modal to appear
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });

    // Click overlay (not the modal content)
    await page.locator('.map-overlay').click({ position: { x: 10, y: 10 } });

    // Map should be hidden
    await expect(page.locator('.map-overlay')).toBeHidden();
  });

  test('should close map modal when ESC key is pressed', async ({ page }) => {
    // Open the map
    await page.locator('input[type="text"]').fill('map');
    await page.keyboard.press('Enter');

    // Wait for map modal to appear
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });

    // Press ESC
    await page.keyboard.press('Escape');

    // Map should be hidden
    await expect(page.locator('.map-overlay')).toBeHidden();
  });

  test('should display legend with correct items', async ({ page }) => {
    // Open the map
    await page.locator('input[type="text"]').fill('map');
    await page.keyboard.press('Enter');

    // Wait for map modal to appear
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });

    // Check for legend
    const legend = page.locator('.map-legend');
    await expect(legend).toBeVisible();

    // Check for legend items
    const legendItems = page.locator('.legend-item');
    const count = await legendItems.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should display instructions', async ({ page }) => {
    // Open the map
    await page.locator('input[type="text"]').fill('map');
    await page.keyboard.press('Enter');

    // Wait for map modal to appear
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });

    // Check for instructions
    const instructions = page.locator('.map-instructions');
    await expect(instructions).toBeVisible();
    await expect(instructions).toContainText('Controls');
  });

  test('should have accessible ARIA labels', async ({ page }) => {
    // Open the map
    await page.locator('input[type="text"]').fill('map');
    await page.keyboard.press('Enter');

    // Wait for map modal to appear
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });

    // Check for ARIA labels
    const mapOverlay = page.locator('.map-overlay');
    await expect(mapOverlay).toHaveAttribute('aria-modal', 'true');

    const mapContainer = page.locator('.map-container');
    const ariaLabel = await mapContainer.getAttribute('aria-label');
    expect(ariaLabel).toContain('3D map');
  });

  test('should open map using keyboard shortcut (Ctrl+M)', async ({ page }) => {
    // Use keyboard shortcut
    await page.keyboard.press('Control+m');

    // Wait for map modal to appear
    await page.waitForSelector('.map-overlay', { state: 'visible', timeout: 5000 });

    // Check that map modal is visible
    const mapOverlay = page.locator('.map-overlay');
    await expect(mapOverlay).toBeVisible();
  });
});
