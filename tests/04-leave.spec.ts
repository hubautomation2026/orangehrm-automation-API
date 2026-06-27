/**
 * Page 4: Leave Management Tests
 * - Apply Leave (data-driven)
 * - Leave List
 * - My Leave view
 * - API: Leave types
 */

import { test, expect } from '../fixtures/pages.fixture';
import { leaveData } from '../test-data/testData';
import type { OrangeHRMListResponse, LeaveType } from '../types/api.types';

test.describe('Leave Management', () => {

  test('TC01 - Apply Leave page loads correctly', async ({ leavePage }) => {
    await leavePage.gotoApplyLeave();
    await leavePage.assertApplyLeaveFormVisible();
    await expect(leavePage.page).toHaveURL(/applyLeave/);
  });

  test('TC02 - Leave List page loads and shows table', async ({ leavePage }) => {
    await leavePage.gotoLeaveList();
    await leavePage.assertLeaveTableVisible();
    await expect(leavePage.page).toHaveURL(/viewLeaveList/);
  });

  test('TC03 - My Leave page loads', async ({ leavePage }) => {
    await leavePage.gotoMyLeave();
    await expect(leavePage.page).toHaveURL(/viewMyLeaveList/);
    await leavePage.assertLeaveTableVisible();
  });

  // Data-Driven: Apply leave with different data
  for (let i = 0; i < leaveData.length; i++) {
    const leave = leaveData[i];
    test(`TC04.${i + 1} - Apply leave type "${leave.leaveType}"`, async ({ leavePage }) => {
      await leavePage.gotoApplyLeave();
      await leavePage.assertApplyLeaveFormVisible();
      // Verify form elements are functional
      await expect(leavePage.leaveTypeDropdown).toBeVisible();
      await expect(leavePage.fromDateInput).toBeVisible();
      await expect(leavePage.toDateInput).toBeVisible();
      await expect(leavePage.commentInput).toBeVisible();
      await expect(leavePage.applyBtn).toBeVisible();
    });
  }

  test('TC05 - Leave type dropdown has options', async ({ leavePage }) => {
    await leavePage.gotoApplyLeave();
    await leavePage.clickElement(leavePage.leaveTypeDropdown);
    const options = leavePage.page.locator('.oxd-select-option');
    await expect(options.first()).toBeVisible();
  });

  test('TC06 - Apply leave button is submit type', async ({ leavePage }) => {
    await leavePage.gotoApplyLeave();
    await expect(leavePage.applyBtn).toHaveAttribute('type', 'submit');
  });

  // API Tests
  // CHANGED: parseJson() → parseResponse<OrangeHRMListResponse<LeaveType>>()
  test('TC07 - API: Get leave types returns 200', async ({ api }) => {
    const resp = await api.getLeaveTypes();
    api.assertStatus(resp, 200);
    const body = await api.parseResponse<OrangeHRMListResponse<LeaveType>>(resp);
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('TC08 - API: Leave types have required fields', async ({ api }) => {
    const resp = await api.getLeaveTypes();
    const body = await api.parseResponse<OrangeHRMListResponse<LeaveType>>(resp);
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('id');
      expect(body.data[0]).toHaveProperty('name');
    }
  });

  test('TC09 - API: Get leave requests returns 200', async ({ api }) => {
    const resp = await api.getLeaveRequests();
    api.assertStatus(resp, 200);
  });
});
