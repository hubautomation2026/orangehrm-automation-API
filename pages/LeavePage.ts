import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeavePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get applyLeaveLink()    { return this.page.locator('a:has-text("Apply")'); }
  get myLeaveLink()       { return this.page.locator('a:has-text("My Leave")'); }
  get leaveListLink()     { return this.page.locator('a:has-text("Leave List")'); }
  get entitlementLink()   { return this.page.locator('a:has-text("Entitlements")'); }

  // Apply Leave form
  get leaveTypeDropdown() { return this.page.locator('.oxd-select-text').first(); }
  get fromDateInput()     { return this.page.locator('.oxd-date-input input').first(); }
  get toDateInput()       { return this.page.locator('.oxd-date-input input').last(); }
  get commentInput()      { return this.page.locator('textarea.oxd-textarea'); }
  get applyBtn()          { return this.page.locator('button[type="submit"]:has-text("Apply")'); }
  get leaveTableRows()    { return this.page.locator('.oxd-table-body .oxd-table-row'); }

  async gotoApplyLeave() {
    await this.navigate('/web/index.php/leave/applyLeave');
    await this.waitForPageLoad();
  }

  async gotoLeaveList() {
    await this.navigate('/web/index.php/leave/viewLeaveList');
    await this.waitForPageLoad();
  }

  async gotoMyLeave() {
    await this.navigate('/web/index.php/leave/viewMyLeaveList');
    await this.waitForPageLoad();
  }

  async applyLeave(leaveType: string, fromDate: string, toDate: string, comment: string) {
    await this.gotoApplyLeave();
    await this.selectDropdownOption(this.leaveTypeDropdown, leaveType);
    await this.fillInput(this.fromDateInput, fromDate);
    await this.page.keyboard.press('Tab');
    await this.fillInput(this.toDateInput, toDate);
    await this.page.keyboard.press('Tab');
    await this.fillInput(this.commentInput, comment);
    await this.clickElement(this.applyBtn);
    await this.waitForPageLoad();
  }

  async assertLeaveTableVisible() {
    const table = this.page.locator('.oxd-table');
    await expect(table).toBeVisible({ timeout: 8000 });
  }

  async assertApplyLeaveFormVisible() {
    await expect(this.leaveTypeDropdown).toBeVisible();
    await expect(this.fromDateInput).toBeVisible();
    await expect(this.toDateInput).toBeVisible();
  }
}
