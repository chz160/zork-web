import { test, expect } from '@playwright/test';

test.describe('Terminal Input Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200');
    // Wait for the game to initialize
    await page.waitForSelector('.console-container');
  });

  test('should display integrated input within terminal', async ({ page }) => {
    // Verify there's no separate input panel border
    const inputLine = page.locator('.console-line--input');
    await expect(inputLine).toBeVisible();

    // Verify input is inside the console output container
    const consoleOutput = page.locator('.console-output');
    const inputInConsole = consoleOutput.locator('.command-input');
    await expect(inputInConsole).toBeVisible();
  });

  test('should show prompt only on active input line', async ({ page }) => {
    // Check that output lines don't have prompts
    const outputLines = page.locator('.console-line:not(.console-line--input)');
    const count = await outputLines.count();

    for (let i = 0; i < count; i++) {
      const line = outputLines.nth(i);
      const prompt = line.locator('.console-prompt');
      await expect(prompt).not.toBeVisible();
    }

    // Check that input line has the prompt
    const inputLine = page.locator('.console-line--input');
    const inputPrompt = inputLine.locator('.console-prompt');
    await expect(inputPrompt).toBeVisible();
    await expect(inputPrompt).toHaveText('>');
  });

  test('should focus input when clicking anywhere in terminal', async ({ page }) => {
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });

    // Click on a game output line
    await page.locator('.console-output').first().click();

    // Verify input is focused
    await expect(commandInput).toBeFocused();
  });

  test('should allow typing and submitting commands', async ({ page }) => {
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });

    // Type a command
    await commandInput.fill('look');
    await commandInput.press('Enter');

    // Wait for output to update
    await page.waitForTimeout(500);

    // Verify command was processed (output should increase)
    const outputLines = page.locator('.console-line:not(.console-line--input)');
    const count = await outputLines.count();
    expect(count).toBeGreaterThan(4); // Initial game has 4 lines

    // Verify input was cleared
    await expect(commandInput).toHaveValue('');
  });

  test('should maintain focus after command submission', async ({ page }) => {
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });

    await commandInput.fill('look');
    await commandInput.press('Enter');

    // Wait a bit for command processing
    await page.waitForTimeout(100);

    // Input should still be focused
    await expect(commandInput).toBeFocused();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });

    // Check ARIA attributes
    await expect(commandInput).toHaveAttribute('aria-label', 'Game command input');
    await expect(commandInput).toHaveAttribute('aria-describedby', 'input-instructions');

    // Check for screen reader instructions
    const instructions = page.locator('#input-instructions');
    await expect(instructions).toBeAttached();
    await expect(instructions).toHaveClass(/sr-only/);
  });

  test('should navigate command history with arrow keys', async ({ page }) => {
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });

    // Submit a command
    await commandInput.fill('look');
    await commandInput.press('Enter');
    await page.waitForTimeout(200);

    // Submit another command
    await commandInput.fill('north');
    await commandInput.press('Enter');
    await page.waitForTimeout(200);

    // Press up arrow to get last command
    await commandInput.press('ArrowUp');
    await expect(commandInput).toHaveValue('north');

    // Press up arrow again to get previous command
    await commandInput.press('ArrowUp');
    await expect(commandInput).toHaveValue('look');

    // Press down arrow to navigate forward
    await commandInput.press('ArrowDown');
    await expect(commandInput).toHaveValue('north');
  });

  test('should clear input on Escape key', async ({ page }) => {
    const commandInput = page.getByRole('textbox', { name: 'Game command input' });

    await commandInput.fill('test command');
    await commandInput.press('Escape');

    await expect(commandInput).toHaveValue('');
  });

  test('should have no visible border around input area', async ({ page }) => {
    // The input should be seamlessly integrated without a separate bordered container
    const inputLine = page.locator('.console-line--input');

    // Check that input line doesn't have a border styling
    const border = await inputLine.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.border;
    });

    // Should not have a prominent border (just inherits from parent console)
    expect(border).not.toContain('2px');
  });
});
