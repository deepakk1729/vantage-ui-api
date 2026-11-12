import { test, expect } from '@playwright/test';

import { TimesheetsPage } from '../../../src/pages/superadmin/people/TimesheetsPage';

test.setTimeout(90000);

test('validate timesheets page', async ({ page }) => {

  const timesheetsPage = new TimesheetsPage(page);

  await page.goto('/', {
    waitUntil: 'domcontentloaded'
  });

  await timesheetsPage
    .navigateToTimesheetsPage();

  expect(
    await timesheetsPage
      .isTimesheetsHeaderVisible()
  ).toBeTruthy();

  expect(
    await timesheetsPage
      .openSubmissionStatus()
  ).toBeTruthy();

  expect(
    await timesheetsPage
      .openHoursSubmitted()
  ).toBeTruthy();
});
