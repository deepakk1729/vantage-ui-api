import { test, expect } from '@playwright/test';

import { BillabilityPage } from '../../../src/pages/superadmin/people/BillabilityPage';

test('validate billability page', async ({ page }) => {

  const billabilityPage =
    new BillabilityPage(page);

  await page.goto('/', {
    waitUntil: 'domcontentloaded'
  });

  await billabilityPage
    .navigateToBillabilityPage();

  expect(
    await billabilityPage
      .isBillabilityHeaderVisible()
  ).toBeTruthy();
});