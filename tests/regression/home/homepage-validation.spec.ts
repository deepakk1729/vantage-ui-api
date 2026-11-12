import { test, expect } from '@playwright/test';

import { HomePage } from '../../../src/pages/superadmin/home/HomePage';

test('validate homepage widgets', async ({ page }) => {

  const homePage = new HomePage(page);

  await homePage.goto();

  expect(
    await homePage.isBillabilityTrendVisible()
  ).toBeTruthy();

  expect(
    await homePage.isTopProjectsVisible()
  ).toBeTruthy();
});