import { test, expect } from '@playwright/test';

import { BillRatePage } from '../../../src/pages/superadmin/people/BillRatePage';

test('validate bill rate page', async ({ page }) => {

  const billRatePage =
    new BillRatePage(page);

  await page.goto('/', {
    waitUntil: 'domcontentloaded'
  });

  await billRatePage
    .navigateToBillRatePage();

  expect(
    await billRatePage
      .isBillRateHeaderVisible()
  ).toBeTruthy();
});
