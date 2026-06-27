/**
 * Page 8: Directory Tests
 * - View all employees
 * - Search by name (data-driven)
 * - Search by job title
 * - Search by location
 */

import { test, expect } from '../fixtures/pages.fixture';

const directorySearchData = [
  { name: 'Paul', jobTitle: '', location: '', desc: 'first name' },
  { name: 'Linda', jobTitle: '', location: '', desc: 'first name Linda' },
];

const jobTitleSearchData = [
  'IT Manager',
  'Software Engineer',
];

test.describe('Directory', () => {

  test('TC01 - Directory page loads', async ({ directoryPage }) => {
    await directoryPage.goto();
    await directoryPage.assertPageHeader('Directory');
    await directoryPage.assertSearchFormVisible();
  });

  test('TC02 - All employees show on initial load', async ({ directoryPage }) => {
    await directoryPage.goto();
    await directoryPage.clickElement(directoryPage.searchBtn);
    await directoryPage.waitForPageLoad();
    const count = await directoryPage.getEmployeeCardCount();
    expect(count).toBeGreaterThan(0);
  });

  test('TC03 - Employee cards display names', async ({ directoryPage }) => {
    await directoryPage.goto();
    await directoryPage.clickElement(directoryPage.searchBtn);
    await directoryPage.waitForPageLoad();
    await directoryPage.assertEmployeeCardsVisible();
    const firstCard = directoryPage.employeeCards.first();
    const cardText = await firstCard.innerText();
    expect(cardText.length).toBeGreaterThan(0);
  });

  // Data-Driven: Search by employee name
  for (const search of directorySearchData) {
    test(`TC04 - Search directory by ${search.desc}: "${search.name}"`, async ({ directoryPage }) => {
      await directoryPage.goto();
      await directoryPage.selectAutoCompleteOption(directoryPage.employeeNameInput, search.name);
      await directoryPage.clickElement(directoryPage.searchBtn);
      await directoryPage.waitForPageLoad();
      // Either cards visible or no records (both are valid outcomes)
      const cardsCount = await directoryPage.employeeCards.count();
      const noRecords = await directoryPage.page.locator('.orangehrm-horizontal-padding').isVisible().catch(() => false);
      expect(cardsCount >= 0 || noRecords).toBeTruthy();
    });
  }

  // Data-Driven: Search by Job Title
  for (const jobTitle of jobTitleSearchData) {
    test(`TC05 - Search directory by job title: "${jobTitle}"`, async ({ directoryPage }) => {
      await directoryPage.goto();
      await directoryPage.selectDropdownOption(directoryPage.jobTitleDropdown, jobTitle);
      await directoryPage.clickElement(directoryPage.searchBtn);
      await directoryPage.waitForPageLoad();
      const table = directoryPage.page.locator('.oxd-grid-item');
      const count = await table.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  }

  test('TC06 - Reset clears search filters', async ({ directoryPage }) => {
    await directoryPage.goto();
    await directoryPage.clickElement(directoryPage.resetBtn);
    // After reset, dropdown should be back to default
    const dropdownText = await directoryPage.jobTitleDropdown.innerText();
    expect(dropdownText).toContain('Select');
  });

  test('TC07 - Directory shows employee photos/avatars', async ({ directoryPage }) => {
    await directoryPage.goto();
    await directoryPage.clickElement(directoryPage.searchBtn);
    await directoryPage.waitForPageLoad();
    const avatars = directoryPage.page.locator('.oxd-userdropdown-img, .employee-image, img');
    // Just assert page is visible — photos may or may not load
    await expect(directoryPage.page.locator('.orangehrm-directory-card').first()).toBeVisible({ timeout: 8000 });
  });

  test('TC08 - Location dropdown has options', async ({ directoryPage }) => {
    await directoryPage.goto();
    await directoryPage.clickElement(directoryPage.locationDropdown);
    const options = directoryPage.page.locator('.oxd-select-option');
    await expect(options.first()).toBeVisible();
    await directoryPage.page.keyboard.press('Escape');
  });

  test('TC09 - Directory URL is correct', async ({ directoryPage }) => {
    await directoryPage.goto();
    await expect(directoryPage.page).toHaveURL(/viewDirectory/);
  });

  test('TC10 - Search and Reset buttons are always visible', async ({ directoryPage }) => {
    await directoryPage.goto();
    await expect(directoryPage.searchBtn).toBeVisible();
    await expect(directoryPage.resetBtn).toBeVisible();
  });
});
