import { test, expect } from '@playwright/test';

// increase timeout for this suite 
test.setTimeout(120000);

test('dashboard loads successfully', async ({ page }) => {

    await page.goto('/', {
        waitUntil: 'commit'
    });

    await expect(
        page.locator('.sidebar').first()
    ).toBeVisible({
        timeout: 20000
    });
});