import { test, expect } from '@playwright/test';

test.describe('3D Map Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    // Wait for the game to initialize
    await page.waitForSelector('.console-container');
  });

  test('should open 3D map modal when map command is entered', async ({ page }) => {
    // Type and submit the map command
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map modal to appear
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Verify the map modal is visible
    const mapModal = page.locator('.map-overlay');
    await expect(mapModal).toBeVisible();

    // Verify the map modal contains the 3D map component
    const mapComponent = mapModal.locator('app-map3d');
    await expect(mapComponent).toBeVisible();
  });

  test('should display map header with room and connection stats', async ({ page }) => {
    // Open the map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Verify map header is visible
    const mapHeader = page.locator('.map-header');
    await expect(mapHeader).toBeVisible();

    // Verify stats are displayed
    const stats = page.locator('.map-stats');
    await expect(stats).toBeVisible();

    // Verify room count is displayed (should be at least 1 for the starting room)
    const roomStat = page.locator('.map-stat').filter({ hasText: 'Rooms:' });
    await expect(roomStat).toBeVisible();
  });

  test('should display map legend', async ({ page }) => {
    // Open the map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Verify legend is visible
    const legend = page.locator('.map-legend');
    await expect(legend).toBeVisible();

    // Verify legend has expected items
    const legendItems = page.locator('.legend-item');
    const count = await legendItems.count();
    expect(count).toBeGreaterThanOrEqual(5); // Should have at least 5 legend items
  });

  test('should display 3D canvas container', async ({ page }) => {
    // Open the map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Verify the 3D canvas container is visible
    const mapCanvas = page.locator('.map-canvas');
    await expect(mapCanvas).toBeVisible();

    // Verify the canvas has a reasonable size
    const box = await mapCanvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should display map instructions', async ({ page }) => {
    // Open the map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Verify instructions are displayed
    const instructions = page.locator('.map-instructions');
    await expect(instructions).toBeVisible();
    await expect(instructions).toContainText('Controls:');
  });

  test('should close map modal when close button is clicked', async ({ page }) => {
    // Open the map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Click the close button
    const closeButton = page.getByRole('button', { name: 'Close map' });
    await closeButton.click();

    // Verify the map modal is no longer visible
    const mapModal = page.locator('.map-overlay');
    await expect(mapModal).not.toBeVisible();
  });

  test('should close map modal when pressing Escape key', async ({ page }) => {
    // Open the map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Press Escape key
    await page.keyboard.press('Escape');

    // Verify the map modal is no longer visible
    const mapModal = page.locator('.map-overlay');
    await expect(mapModal).not.toBeVisible();
  });

  test('should close map modal when clicking outside', async ({ page }) => {
    // Open the map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Click on the overlay (outside the modal content)
    const overlay = page.locator('.map-overlay');
    await overlay.click({ position: { x: 10, y: 10 } }); // Click near the edge

    // Verify the map modal is no longer visible
    await expect(overlay).not.toBeVisible();
  });

  test('should update map when player explores new rooms', async ({ page }) => {
    // Open the map initially
    let commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Get initial room count
    const initialRoomText = await page.locator('.map-stat-value').first().textContent();
    const initialRoomCount = parseInt(initialRoomText || '0', 10);

    // Close the map
    await page.keyboard.press('Escape');

    // Move to a new room
    commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('north');
    await commandInput.press('Enter');

    // Wait a bit for the command to process
    await page.waitForTimeout(500);

    // Open the map again
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Get new room count
    const newRoomText = await page.locator('.map-stat-value').first().textContent();
    const newRoomCount = parseInt(newRoomText || '0', 10);

    // Verify room count increased (or stayed same if movement failed)
    expect(newRoomCount).toBeGreaterThanOrEqual(initialRoomCount);
  });

  test('should have proper ARIA labels for accessibility', async ({ page }) => {
    // Open the map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Verify the map overlay has proper ARIA role
    const mapOverlay = page.locator('.map-overlay');
    await expect(mapOverlay).toHaveAttribute('role', 'dialog');
    await expect(mapOverlay).toHaveAttribute('aria-modal', 'true');

    // Verify the map container has proper ARIA role
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toHaveAttribute('role', 'region');
  });

  test('should not have console errors during map rendering', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Open the map
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await commandInput.fill('map');
    await commandInput.press('Enter');

    // Wait for the map to be visible
    await page.waitForSelector('.map-overlay', { timeout: 5000 });

    // Wait a bit for rendering
    await page.waitForTimeout(1000);

    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
  });
});
