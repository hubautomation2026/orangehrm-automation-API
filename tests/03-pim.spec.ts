/**
 * Page 3: PIM (Employee Management) Tests
 */

import { test, expect } from '../fixtures/pages.fixture';
import { employeeData, searchEmployeeData } from '../test-data/testData';
import type { OrangeHRMListResponse, Employee } from '../types/api.types';

test.describe('PIM - Employee Management', () => {

  test('TC01 - Employee List page loads', async ({ pimPage }) => {
    await pimPage.goto();
   // await pimPage.assertPageHeader('Employee Information');
    await expect(pimPage.addEmployeeBtn).toBeVisible();
    await expect(pimPage.searchBtn).toBeVisible();
  });

  test('TC02 - Add Employee button navigates to form', async ({ pimPage }) => {
    await pimPage.goto();
    await pimPage.clickElement(pimPage.addEmployeeBtn);
    await expect(pimPage.page).toHaveURL(/addEmployee/);
    await expect(pimPage.firstNameInput).toBeVisible();
  });

  for (const emp of employeeData) {
    test(`TC03 - Add employee: ${emp.firstName} ${emp.lastName}`, async ({ pimPage }) => {
      await pimPage.addEmployee(emp.firstName, emp.middleName, emp.lastName);
      await expect(pimPage.page).toHaveURL(/viewPersonalDetails/);
      await expect(pimPage.firstNameInput).toHaveValue(emp.firstName);
    });
  }
 /*for (const scenario of employeeScenarios) {
    test(`TC03 - Add employee: ${scenario.label}`, async ({ pimPage }) => {
      const emp = makeEmployeeData({
        gender: scenario.gender,
        maritalStatus: scenario.maritalStatus,
      });

      await pimPage.addEmployee(emp.firstName, emp.middleName, emp.lastName);
      await expect(pimPage.page).toHaveURL(/viewPersonalDetails/);
      await expect(pimPage.firstNameInput).toHaveValue(emp.firstName);
    });
  }*/

  for (const search of searchEmployeeData) {
    test(`TC04 - Search employee by name="${search.employeeName}" id="${search.employeeId}"`, async ({ pimPage }) => {
      await pimPage.searchEmployee(search.employeeName, search.employeeId);
      
    });
  }

 /* test('TC05 - Reset search clears filters', async ({ pimPage }) => {
    await pimPage.goto();
    await pimPage.clickElement(pimPage.resetBtn);
    await expect(pimPage.employeeIdSearch).toHaveValue('');
  });

  test('TC06 - Employee table has expected columns', async ({ pimPage }) => {
    await pimPage.goto();
    await pimPage.clickElement(pimPage.searchBtn);
    await pimPage.waitForPageLoad();

    // FIX 1: The count was 41 — an obvious typo (comment said 7 columns, reality is 6).
    // OrangeHRM's employee table renders: checkbox | Id | First Name | Last Name |
    // Job Title | Employment Status | Actions = 7 visible cells in the header row.
    // FIX 2: .oxd-table-header .oxd-table-cell resolves to 0 because OrangeHRM
    // uses oxd-table-head (not oxd-table-header) for the header container,
    // and the cells inside it use the role="columnheader" attribute.
    // Use the role-based locator which matches the actual rendered structure.
    const headers = pimPage.page.locator('.oxd-table-head .oxd-table-cell');
    await expect(headers).toHaveCount(7, { timeout: 8000 });
  });*/

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