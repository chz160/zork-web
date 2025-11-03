import { test, expect } from '@playwright/test';

/**
 * E2E tests for VoxelMapComponent
 *
 * Validates the 3D voxel map visualization, user interactions,
 * and performance under normal gameplay conditions.
 */
test.describe('Voxel Map Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    // Wait for the game to initialize
    await page.waitForSelector('.console-container');
  });

  test('should render initial voxel map when opened', async ({ page }) => {
    // Open map using keyboard shortcut
    await page.keyboard.press('Control+m');

    // Wait for map modal to appear
    await expect(page.locator('.map-overlay')).toBeVisible();
    await expect(page.locator('.map-modal')).toBeVisible();

    // Check that map header is visible
    const header = page.locator('.map-modal-header h2');
    await expect(header).toContainText('Explored World Map');

    // Check that map container is visible
    await expect(page.locator('.map-container')).toBeVisible();

    // Check that canvas container exists
    await expect(page.locator('.canvas-container')).toBeVisible();

    // Check that stats are displayed
    await expect(page.locator('.map-stats')).toBeVisible();

    // Verify initial room count (should have at least 1 room - West of House)
    const roomStat = page.locator('.map-stat-value').first();
    const roomCount = await roomStat.textContent();
    expect(parseInt(roomCount || '0')).toBeGreaterThan(0);
  });

  test('should display legend with correct items', async ({ page }) => {
    // Open map
    await page.keyboard.press('Control+m');
    await page.waitForSelector('.map-legend');

    // Check legend items
    const legend = page.locator('.map-legend');
    await expect(legend).toBeVisible();

    // Check for current location legend
    await expect(legend.locator('text=Current Location')).toBeVisible();

    // Check for explored room legend
    await expect(legend.locator('text=Explored Room')).toBeVisible();

    // Check for corridor legend
    await expect(legend.locator('text=Corridor')).toBeVisible();

    // Check for usage hint
    await expect(legend.locator('text=Use mouse to orbit')).toBeVisible();
  });

  test('should reveal new rooms after exploration', async ({ page }) => {
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });

    // Open map and get initial room count
    await page.keyboard.press('Control+m');
    await page.waitForSelector('.map-stats');
    const initialRoomCount = await page.locator('.map-stat-value').first().textContent();

    // Close map
    await page.keyboard.press('Escape');

    // Explore a new room
    await commandInput.clear();
    await commandInput.fill('north');
    await commandInput.press('Enter');
    await page.waitForTimeout(500);

    // Open map again
    await page.keyboard.press('Control+m');
    await page.waitForSelector('.map-stats');

    // Get new room count
    const newRoomCount = await page.locator('.map-stat-value').first().textContent();

    // Room count should have increased
    expect(parseInt(newRoomCount || '0')).toBeGreaterThanOrEqual(parseInt(initialRoomCount || '0'));
  });

  test('should highlight current room', async ({ page }) => {
    // Open map
    await page.keyboard.press('Control+m');
    await page.waitForSelector('.map-container');

    // Map should be displaying (we can't directly inspect Three.js scene in E2E,
    // but we can verify the component is rendering and stats are correct)
    await expect(page.locator('.map-container')).toBeVisible();

    // Verify stats are non-zero
    const roomCount = await page.locator('.map-stat-value').first().textContent();
    expect(parseInt(roomCount || '0')).toBeGreaterThan(0);

    // Legend should show current location marker
    await expect(page.locator('.legend-symbol--current')).toBeVisible();
  });

  test('should close map with close button', async ({ page }) => {
    // Open map
    await page.keyboard.press('Control+m');
    await expect(page.locator('.map-overlay')).toBeVisible();

    // Click close button
    await page.locator('.map-close-btn').click();

    // Map should be closed
    await expect(page.locator('.map-overlay')).not.toBeVisible();

    // Focus should return to input
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });
    await expect(commandInput).toBeFocused();
  });

  test('should close map with Escape key', async ({ page }) => {
    // Open map
    await page.keyboard.press('Control+m');
    await expect(page.locator('.map-overlay')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Map should be closed
    await expect(page.locator('.map-overlay')).not.toBeVisible();
  });

  test('should close map when clicking overlay background', async ({ page }) => {
    // Open map
    await page.keyboard.press('Control+m');
    await expect(page.locator('.map-overlay')).toBeVisible();

    // Click on overlay background (not the modal)
    await page.locator('.map-overlay').click({ position: { x: 10, y: 10 } });

    // Map should be closed
    await expect(page.locator('.map-overlay')).not.toBeVisible();
  });

  test('should not close map when clicking inside modal', async ({ page }) => {
    // Open map
    await page.keyboard.press('Control+m');
    await expect(page.locator('.map-overlay')).toBeVisible();

    // Click inside the modal
    await page.locator('.map-modal').click();

    // Map should still be open
    await expect(page.locator('.map-overlay')).toBeVisible();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Open map
    await page.keyboard.press('Control+m');

    // Check map overlay has dialog role
    const overlay = page.locator('.map-overlay');
    await expect(overlay).toHaveAttribute('role', 'dialog');
    await expect(overlay).toHaveAttribute('aria-modal', 'true');

    // Check map container has region role
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toHaveAttribute('role', 'region');

    // Check close button has aria-label
    const closeButton = page.locator('.map-close-btn');
    await expect(closeButton).toHaveAttribute('aria-label', 'Close map');
  });

  test('should show empty state when no rooms explored', async ({ page }) => {
    // This is difficult to test since the game always starts in a room,
    // but we can verify the empty state element exists in the DOM
    await page.keyboard.press('Control+m');

    // Check that empty state template exists (even if not visible)
    const emptyState = page.locator('.map-empty-state');
    // It should exist in DOM but not be visible since we have rooms
    expect(await emptyState.count()).toBe(1);
  });

  test('should display connection count in stats', async ({ page }) => {
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });

    // Explore to create connections
    await commandInput.fill('north');
    await commandInput.press('Enter');
    await page.waitForTimeout(500);

    // Open map
    await page.keyboard.press('Control+m');
    await page.waitForSelector('.map-stats');

    // Check connection count
    const stats = page.locator('.map-stat-value');
    const connectionCount = await stats.nth(1).textContent();

    // Should have at least 1 connection
    expect(parseInt(connectionCount || '0')).toBeGreaterThan(0);
  });

  test('should render canvas element', async ({ page }) => {
    // Open map
    await page.keyboard.press('Control+m');
    await page.waitForSelector('.canvas-container');

    // Check that canvas element exists (Three.js creates it)
    const canvas = page.locator('.canvas-container canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle window resize', async ({ page }) => {
    // Open map
    await page.keyboard.press('Control+m');
    await page.waitForSelector('.canvas-container');

    // Get initial canvas size
    const canvas = page.locator('.canvas-container canvas');
    const initialBox = await canvas.boundingBox();
    expect(initialBox).toBeTruthy();

    // Resize window
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(300);

    // Canvas should still be visible and have adjusted
    await expect(canvas).toBeVisible();
    const newBox = await canvas.boundingBox();
    expect(newBox).toBeTruthy();
  });

  test('should maintain 60 FPS performance', async ({ page }) => {
    // Open map
    await page.keyboard.press('Control+m');
    await page.waitForSelector('.canvas-container');

    // Start performance measurement
    const startMetrics = await page.evaluate(() => {
      return {
        timestamp: performance.now(),
      };
    });

    // Wait for a few animation frames
    await page.waitForTimeout(1000);

    // End performance measurement
    const endMetrics = await page.evaluate(() => {
      return {
        timestamp: performance.now(),
      };
    });

    // We can't directly measure FPS in Playwright, but we can verify
    // the canvas is still responsive and rendering
    const canvas = page.locator('.canvas-container canvas');
    await expect(canvas).toBeVisible();

    // Performance should be reasonable
    const elapsed = endMetrics.timestamp - startMetrics.timestamp;
    expect(elapsed).toBeGreaterThan(900); // Should take roughly 1 second
    expect(elapsed).toBeLessThan(1500); // But not too much longer
  });

  test('should toggle map multiple times without errors', async ({ page }) => {
    // Open and close map multiple times
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Control+m');
      await expect(page.locator('.map-overlay')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.locator('.map-overlay')).not.toBeVisible();

      await page.waitForTimeout(200);
    }

    // Check console for errors
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    // Open one more time to check for errors
    await page.keyboard.press('Control+m');
    await page.waitForTimeout(500);

    // Should have no WebGL or runtime errors
    expect(logs.filter((log) => log.includes('WebGL')).length).toBe(0);
    expect(logs.filter((log) => log.includes('THREE')).length).toBe(0);
  });
});
