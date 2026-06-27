/**
 * Page 3: PIM (Employee Management) Tests
 * - Add Employee (data-driven)
 * - Search Employee (data-driven)
 * - API integration for verification
 */

import { test, expect } from '../fixtures/pages.fixture';
import { employeeData, searchEmployeeData } from '../test-data/testData';
import type { OrangeHRMListResponse, Employee } from '../types/api.types';

test.describe('PIM - Employee Management', () => {

  test('TC01 - Employee List page loads', async ({ pimPage }) => {
    await pimPage.goto();
    await pimPage.assertPageHeader('Employee Information');
    await expect(pimPage.addEmployeeBtn).toBeVisible();
    await expect(pimPage.searchBtn).toBeVisible();
  });

  test('TC02 - Add Employee button navigates to form', async ({ pimPage }) => {
    await pimPage.goto();
    await pimPage.clickElement(pimPage.addEmployeeBtn);
    await expect(pimPage.page).toHaveURL(/addEmployee/);
    await expect(pimPage.firstNameInput).toBeVisible();
  });

  // Data-Driven: Add employees
  for (const emp of employeeData) {
    test(`TC03 - Add employee: ${emp.firstName} ${emp.lastName}`, async ({ pimPage }) => {
      await pimPage.addEmployee(emp.firstName, emp.middleName, emp.lastName);
      // Should redirect to employee profile
      await expect(pimPage.page).toHaveURL(/viewPersonalDetails/);
      await expect(pimPage.firstNameInput).toHaveValue(emp.firstName);
    });
  }

  // Data-Driven: Search employees
  for (const search of searchEmployeeData) {
    test(`TC04 - Search employee by name="${search.employeeName}" id="${search.employeeId}"`, async ({ pimPage }) => {
      await pimPage.searchEmployee(search.employeeName, search.employeeId);
      await pimPage.assertRecordsFound();
    });
  }

  test('TC05 - Reset search clears filters', async ({ pimPage }) => {
    await pimPage.goto();
    await pimPage.clickElement(pimPage.resetBtn);
    await expect(pimPage.employeeIdSearch).toHaveValue('');
  });

  test('TC06 - Employee table has expected columns', async ({ pimPage }) => {
    await pimPage.goto();
    await pimPage.clickElement(pimPage.searchBtn);
    await pimPage.waitForPageLoad();
    const headers = pimPage.page.locator('.oxd-table-header .oxd-table-cell');
    await expect(headers).toHaveCount(6); // checkbox, id, first name, last name, job title, employment status, actions
  });

  // API Test: Verify employees via API
  // CHANGED: parseJson() → parseResponse<T>() — see api/OrangeHRMApi.ts notes.
  // assertStatus is synchronous now, no await needed.
  test('TC07 - API: Get employee list returns 200', async ({ api }) => {
    const resp = await api.getEmployees();
    api.assertStatus(resp, 200);
    const body = await api.parseResponse<OrangeHRMListResponse<Employee>>(resp);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('TC08 - API: Employee list has meta with total count', async ({ api }) => {
    const resp = await api.getEmployees();
    const body = await api.parseResponse<OrangeHRMListResponse<Employee>>(resp);
    expect(body).toHaveProperty('meta');
    expect(typeof body.meta.total).toBe('number');
  });
});
