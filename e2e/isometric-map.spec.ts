import { test, expect } from '@playwright/test';

test.describe('Isometric Map Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    // Wait for the game to initialize
    await page.waitForSelector('.console-container');
  });

  test('should open map dialog when map command is issued', async ({ page }) => {
    // Type and submit the map command
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for map dialog to appear
    const mapDialog = page.locator('.map-overlay[role="dialog"]');
    await expect(mapDialog).toBeVisible({ timeout: 2000 });
  });

  test('should display isometric map canvas', async ({ page }) => {
    // Open map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for map to appear
    await page.waitForSelector('.map-overlay', { timeout: 2000 });

    // Verify canvas element exists
    const canvas = page.locator('.map-canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has proper role
    await expect(canvas).toHaveAttribute('role', 'img');
  });

  test('should display map stats in header', async ({ page }) => {
    // Open map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    await page.waitForSelector('.map-overlay', { timeout: 2000 });

    // Check for stats display
    const statsContainer = page.locator('.map-stats');
    await expect(statsContainer).toBeVisible();

    // Check for rooms count
    const roomsStat = page.locator('.map-stat-label').filter({ hasText: 'Rooms:' });
    await expect(roomsStat).toBeVisible();

    // Check for connections count
    const connectionsStat = page.locator('.map-stat-label').filter({ hasText: 'Connections:' });
    await expect(connectionsStat).toBeVisible();
  });

  test('should display map legend', async ({ page }) => {
    // Open map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    await page.waitForSelector('.map-overlay', { timeout: 2000 });

    // Check for legend
    const legend = page.locator('.map-legend');
    await expect(legend).toBeVisible();

    // Check for legend items
    const legendItems = page.locator('.legend-item');
    const count = await legendItems.count();
    expect(count).toBeGreaterThanOrEqual(3); // Should have at least current, visited, and connection
  });

  test('should close map when X button is clicked', async ({ page }) => {
    // Open map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    await page.waitForSelector('.map-overlay', { timeout: 2000 });

    // Click close button
    const closeButton = page.getByRole('button', { name: 'Close map' });
    await closeButton.click();

    // Verify map dialog is closed
    const mapDialog = page.locator('.map-overlay[role="dialog"]');
    await expect(mapDialog).not.toBeVisible();
  });

  test('should close map when ESC key is pressed', async ({ page }) => {
    // Open map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    await page.waitForSelector('.map-overlay', { timeout: 2000 });

    // Press ESC key
    await page.keyboard.press('Escape');

    // Verify map dialog is closed
    const mapDialog = page.locator('.map-overlay[role="dialog"]');
    await expect(mapDialog).not.toBeVisible();
  });

  test('should close map when clicking outside modal', async ({ page }) => {
    // Open map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    await page.waitForSelector('.map-overlay', { timeout: 2000 });

    // Click on the overlay (outside the modal)
    await page.locator('.map-overlay').click({ position: { x: 10, y: 10 } });

    // Verify map dialog is closed
    const mapDialog = page.locator('.map-overlay[role="dialog"]');
    await expect(mapDialog).not.toBeVisible();
  });

  test('should show canvas with proper dimensions', async ({ page }) => {
    // Open map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    await page.waitForSelector('.map-canvas', { timeout: 2000 });

    // Check canvas dimensions
    const canvas = page.locator('.map-canvas');
    const box = await canvas.boundingBox();

    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(200);
      expect(box.height).toBeGreaterThan(200);
    }
  });

  test('should update map when visiting new rooms', async ({ page }) => {
    // Open map to see initial state
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    await page.waitForSelector('.map-overlay', { timeout: 2000 });

    // Get initial room count
    const initialRoomsText = await page
      .locator('.map-stat-label')
      .filter({ hasText: 'Rooms:' })
      .locator('..')
      .locator('.map-stat-value')
      .textContent();
    const initialRoomCount = parseInt(initialRoomsText || '0', 10);

    // Close map
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Move to a new room (example: north)
    await commandInput.fill('north');
    await commandInput.press('Enter');
    await page.waitForTimeout(1000);

    // Open map again
    await commandInput.fill('map');
    await commandInput.press('Enter');

    await page.waitForSelector('.map-overlay', { timeout: 2000 });

    // Get updated room count
    const updatedRoomsText = await page
      .locator('.map-stat-label')
      .filter({ hasText: 'Rooms:' })
      .locator('..')
      .locator('.map-stat-value')
      .textContent();
    const updatedRoomCount = parseInt(updatedRoomsText || '0', 10);

    // Room count should have increased or stayed the same (if already visited)
    expect(updatedRoomCount).toBeGreaterThanOrEqual(initialRoomCount);
  });

  test('should have proper ARIA attributes for accessibility', async ({ page }) => {
    // Open map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    await page.waitForSelector('.map-overlay', { timeout: 2000 });

    // Check dialog role and aria-modal
    const mapDialog = page.locator('.map-overlay[role="dialog"]');
    await expect(mapDialog).toHaveAttribute('aria-modal', 'true');

    // Check canvas has aria-label
    const canvas = page.locator('.map-canvas');
    const ariaLabel = await canvas.getAttribute('aria-label');
    expect(ariaLabel).toContain('Isometric map');
    expect(ariaLabel).toContain('room');
  });
});
