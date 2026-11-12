import { test, expect } from '@playwright/test';

import { ChargesHoursPage } from '../../../src/pages/superadmin/people/ChargesHoursPage';

test('validate charges hours page', async ({ page }) => {

  const chargesHoursPage =
    new ChargesHoursPage(page);

  await page.goto('/', {
    waitUntil: 'domcontentloaded'
  });

  await chargesHoursPage
    .navigateToChargesHoursPage();

  expect(
    await chargesHoursPage
      .isChargesHoursHeaderVisible()
  ).toBeTruthy();
});
