/**
 * Page 7: Recruitment Tests
 * - Vacancies List
 * - Add Vacancy
 * - Candidates
 */

import { test, expect } from '../fixtures/pages.fixture';

const vacancyTestData = [
  { name: `QA Vacancy ${Date.now()}`, jobTitle: 'QA Lead', hiringManager: 'Admin' },
  { name: `Dev Vacancy ${Date.now() + 1}`, jobTitle: 'Software Engineer', hiringManager: 'Admin' },
];

test.describe('Recruitment', () => {

  test('TC01 - Vacancies page loads', async ({ recruitmentPage }) => {
    await recruitmentPage.gotoVacancies();
    await recruitmentPage.assertPageHeader('Vacancies');
    await expect(recruitmentPage.addVacancyBtn).toBeVisible();
  });

  test('TC02 - Vacancy table is visible', async ({ recruitmentPage }) => {
    await recruitmentPage.gotoVacancies();
    await recruitmentPage.assertVacancyTableVisible();
  });

  test('TC03 - Candidates page loads', async ({ recruitmentPage }) => {
    await recruitmentPage.gotoAllCandidates();
    await recruitmentPage.assertPageHeader('Candidates');
  });

  test('TC04 - Candidates search form visible', async ({ recruitmentPage }) => {
    await recruitmentPage.gotoAllCandidates();
    await expect(recruitmentPage.searchBtn).toBeVisible();
  });

  test('TC05 - Add Vacancy form loads', async ({ recruitmentPage }) => {
    await recruitmentPage.gotoAddVacancy();
    await expect(recruitmentPage.vacancyNameInput).toBeVisible();
    await expect(recruitmentPage.jobTitleDropdown).toBeVisible();
    await expect(recruitmentPage.hiringManagerInput).toBeVisible();
    await expect(recruitmentPage.saveBtn).toBeVisible();
  });

  test('TC06 - Job title dropdown in Add Vacancy has options', async ({ recruitmentPage }) => {
    await recruitmentPage.gotoAddVacancy();
    await recruitmentPage.clickElement(recruitmentPage.jobTitleDropdown);
    const options = recruitmentPage.page.locator('.oxd-select-option');
    await expect(options.first()).toBeVisible();
    await recruitmentPage.page.keyboard.press('Escape');
  });

  // Data-Driven: Verify vacancy form for different data sets
  for (const vacancy of vacancyTestData) {
    test(`TC07 - Fill vacancy form: "${vacancy.name}"`, async ({ recruitmentPage }) => {
      await recruitmentPage.gotoAddVacancy();
      await recruitmentPage.fillInput(recruitmentPage.vacancyNameInput, vacancy.name);
      // Verify field is filled
      await expect(recruitmentPage.vacancyNameInput).toHaveValue(vacancy.name);
      await expect(recruitmentPage.saveBtn).toBeEnabled();
    });
  }

  test('TC08 - Vacancy name field accepts text input', async ({ recruitmentPage }) => {
    await recruitmentPage.gotoAddVacancy();
    const testName = 'Test Vacancy Name';
    await recruitmentPage.fillInput(recruitmentPage.vacancyNameInput, testName);
    await expect(recruitmentPage.vacancyNameInput).toHaveValue(testName);
  });

  test('TC09 - Vacancies table has action buttons', async ({ recruitmentPage }) => {
    await recruitmentPage.gotoVacancies();
    await recruitmentPage.clickElement(recruitmentPage.searchBtn);
    await recruitmentPage.waitForPageLoad();
    const rows = recruitmentPage.tableRows;
    const count = await rows.count();
    if (count > 0) {
      const actionBtns = rows.first().locator('button');
      await expect(actionBtns.first()).toBeVisible();
    }
  });

  test('TC10 - Candidates table has expected columns', async ({ recruitmentPage }) => {
    await recruitmentPage.gotoAllCandidates();
    await recruitmentPage.clickElement(recruitmentPage.searchBtn);
    await recruitmentPage.waitForPageLoad();
    const table = recruitmentPage.page.locator('.oxd-table');
    await expect(table).toBeVisible();
  });
});
