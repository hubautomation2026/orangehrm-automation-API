import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // User Management
  get addBtn()              { return this.page.locator('button:has-text("Add")'); }
  get searchBtn()           { return this.page.locator('button[type="submit"]:has-text("Search")'); }
  get resetBtn()            { return this.page.locator('button[type="reset"]:has-text("Reset")'); }
  get userRoleDropdown()    { return this.page.locator('.oxd-select-text').first(); }
  get statusDropdown()      { return this.page.locator('.oxd-select-text').nth(1); }
  get usernameSearch()      { return this.page.locator('.oxd-input').first(); }
  get tableRows()           { return this.page.locator('.oxd-table-body .oxd-table-row'); }
  get recordCount()         { return this.page.locator('.oxd-text--span:has-text("Record")'); }

  // Add User Form
  get userRoleFormDropdown()  { return this.page.locator('.oxd-select-text').first(); }
  get employeeNameInput()     { return this.page.locator('.oxd-autocomplete-text-input input'); }
  get statusFormDropdown()    { return this.page.locator('.oxd-select-text').nth(1); }
  get usernameInput()         { return this.page.locator('input[autocomplete="off"]').nth(0); }
  get passwordInput()         { return this.page.locator('input[type="password"]').first(); }
  get confirmPasswordInput()  { return this.page.locator('input[type="password"]').last(); }
  get saveBtn()               { return this.page.locator('button[type="submit"]:has-text("Save")'); }

  // Job Titles
  get jobTitleInput()         { return this.page.locator('.oxd-input').first(); }
  get jobDescTextarea()       { return this.page.locator('textarea').first(); }
  get noteTextarea()          { return this.page.locator('textarea').last(); }

  async gotoUserManagement() {
    await this.navigate('/web/index.php/admin/viewSystemUsers');
    await this.waitForPageLoad();
  }

  async gotoAddUser() {
    await this.gotoUserManagement();
    await this.clickElement(this.addBtn);
    await this.waitForPageLoad();
  }

  async gotoJobTitles() {
    await this.navigate('/web/index.php/admin/viewJobTitleList');
    await this.waitForPageLoad();
  }

  async gotoWorkShifts() {
    await this.navigate('/web/index.php/admin/workShift');
    await this.waitForPageLoad();
  }

  async addSystemUser(userRole: string, employeeName: string, status: string, username: string, password: string, confirmPass: string) {
    await this.gotoAddUser();
    await this.selectDropdownOption(this.userRoleFormDropdown, userRole);
    await this.selectAutoCompleteOption(this.employeeNameInput, employeeName);
    await this.selectDropdownOption(this.statusFormDropdown, status);
    await this.fillInput(this.usernameInput, username);
    await this.fillInput(this.passwordInput, password);
    await this.fillInput(this.confirmPasswordInput, confirmPass);
    await this.clickElement(this.saveBtn);
    await this.waitForPageLoad();
  }

  async searchUser(username: string, role: string = '', status: string = '') {
    await this.gotoUserManagement();
    if (username) await this.fillInput(this.usernameSearch, username);
    if (role) await this.selectDropdownOption(this.userRoleDropdown, role);
    if (status) await this.selectDropdownOption(this.statusDropdown, status);
    await this.clickElement(this.searchBtn);
    await this.waitForPageLoad();
  }

  async addJobTitle(title: string, description: string, note: string) {
    await this.gotoJobTitles();
    await this.clickElement(this.addBtn);
    await this.waitForPageLoad();
    await this.fillInput(this.jobTitleInput, title);
    await this.fillInput(this.jobDescTextarea, description);
    await this.fillInput(this.noteTextarea, note);
    await this.clickElement(this.saveBtn);
    await this.waitForPageLoad();
  }

  async assertUserInTable(username: string) {
    const row = this.page.locator('.oxd-table-row').filter({ hasText: username });
    await expect(row.first()).toBeVisible({ timeout: 8000 });
  }

  async assertRecordsFound() {
    const table = this.page.locator('.oxd-table');
    await expect(table).toBeVisible({ timeout: 8000 });
  }
}
