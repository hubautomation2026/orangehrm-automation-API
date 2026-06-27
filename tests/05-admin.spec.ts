/**
 * Page 5: Admin User Management Tests
 * - Add System User (data-driven)
 * - Search Users
 * - Job Titles CRUD
 * - Work Shifts
 * - API: CRUD operations
 */

import { test, expect } from '../fixtures/pages.fixture';
import { adminUserData, jobTitleData, workShiftData } from '../test-data/testData';
import type { OrangeHRMListResponse, SystemUser, JobTitle } from '../types/api.types';

test.describe('Admin - User Management', () => {

  test('TC01 - Admin User Management page loads', async ({ adminPage }) => {
    await adminPage.gotoUserManagement();
    await adminPage.assertPageHeader('System Users');
    await expect(adminPage.addBtn).toBeVisible();
    await expect(adminPage.searchBtn).toBeVisible();
  });

  test('TC02 - Add User form displays all fields', async ({ adminPage }) => {
    await adminPage.gotoAddUser();
    await expect(adminPage.userRoleFormDropdown).toBeVisible();
    await expect(adminPage.employeeNameInput).toBeVisible();
    await expect(adminPage.statusFormDropdown).toBeVisible();
    await expect(adminPage.usernameInput).toBeVisible();
    await expect(adminPage.passwordInput).toBeVisible();
    await expect(adminPage.confirmPasswordInput).toBeVisible();
    await expect(adminPage.saveBtn).toBeVisible();
  });

  // Data-Driven: Search with different filters
  test('TC03 - Search system users by role "Admin"', async ({ adminPage }) => {
    await adminPage.searchUser('', 'Admin', '');
    await adminPage.assertRecordsFound();
  });

  test('TC04 - Search system users by status "Enabled"', async ({ adminPage }) => {
    await adminPage.searchUser('', '', 'Enabled');
    await adminPage.assertRecordsFound();
  });

  test('TC05 - Search user "Admin" by username', async ({ adminPage }) => {
    await adminPage.searchUser('Admin');
    await adminPage.assertUserInTable('Admin');
  });

  test('TC06 - Reset search clears all fields', async ({ adminPage }) => {
    await adminPage.gotoUserManagement();
    await adminPage.fillInput(adminPage.usernameSearch, 'TestUser');
    await adminPage.clickElement(adminPage.resetBtn);
    await expect(adminPage.usernameSearch).toHaveValue('');
  });

  // Job Titles - Data-Driven
  test('TC07 - Job Titles page loads', async ({ adminPage }) => {
    await adminPage.gotoJobTitles();
    await adminPage.assertPageHeader('Job Titles');
  });

  for (const job of jobTitleData) {
    test(`TC08 - Add Job Title: "${job.jobTitle}"`, async ({ adminPage }) => {
      await adminPage.addJobTitle(job.jobTitle, job.jobDescription, job.note);
      // Check for toast success or existing page with job title
      const titleInTable = adminPage.page.locator('.oxd-table-row').filter({ hasText: job.jobTitle });
      await adminPage.waitForPageLoad();
      // Success means either toast or record in table
      const toastVisible = await adminPage.page.locator('.oxd-toast').isVisible().catch(() => false);
      const rowVisible = await titleInTable.first().isVisible().catch(() => false);
      expect(toastVisible || rowVisible).toBeTruthy();
    });
  }

  // Work Shifts
  test('TC09 - Work Shifts page loads', async ({ adminPage }) => {
    await adminPage.gotoWorkShifts();
    await adminPage.assertPageHeader('Work Shifts');
    await expect(adminPage.addBtn).toBeVisible();
  });

  // API Tests
  //
  // CHANGED: These two tests used to call `api.parseJson(resp)`, which
  // returns `Promise<any>`. `any` disables type checking entirely — TypeScript
  // would never have caught a typo like `body.dat` or `user.userNmae`.
  //
  // Now `parseResponse<OrangeHRMListResponse<SystemUser>>(resp)` tells
  // TypeScript exactly what shape to expect. body.data is SystemUser[],
  // not unknown — every property access below is checked at compile time.
  //
  // Also: `assertStatus` is no longer awaited — it's synchronous now
  // (see api/OrangeHRMApi.ts for why).

  test('TC10 - API: Get system users returns 200', async ({ api }) => {
    const resp = await api.getSystemUsers();
    api.assertStatus(resp, 200);

    const body = await api.parseResponse<OrangeHRMListResponse<SystemUser>>(resp);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('TC11 - API: System users have required properties', async ({ api }) => {
    const resp = await api.getSystemUsers();
    const body = await api.parseResponse<OrangeHRMListResponse<SystemUser>>(resp);

    if (body.data.length > 0) {
      const user = body.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('userName');
      expect(user).toHaveProperty('status');
    }
  });

  test('TC12 - API: Get job titles returns 200', async ({ api }) => {
    const resp = await api.getJobTitles();
    api.assertStatus(resp, 200);
    const body = await api.parseResponse<OrangeHRMListResponse<JobTitle>>(resp);
    expect(body).toHaveProperty('data');
  });
});
