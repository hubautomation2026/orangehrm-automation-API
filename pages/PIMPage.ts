import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PIMPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Employee List
  get addEmployeeBtn()         { return this.page.locator('button:has-text("Add")'); }
  get searchBtn()              { return this.page.locator('button[type="submit"]:has-text("Search")'); }
  get resetBtn()               { return this.page.locator('button[type="reset"]:has-text("Reset")'); }
  get employeeNameSearch()     { return this.page.locator('.oxd-input').nth(0); }
  get employeeIdSearch()       { return this.page.locator('.oxd-input').nth(1); }
  get tableRows()              { return this.page.locator('.oxd-table-body .oxd-table-row'); }
  get recordCount()            { return this.page.locator('.oxd-text--span:has-text("Record")'); }

  // Add Employee Form
  get firstNameInput()         { return this.page.locator('input[name="firstName"]'); }
  get middleNameInput()        { return this.page.locator('input[name="middleName"]'); }
  get lastNameInput()          { return this.page.locator('input[name="lastName"]'); }
  get employeeIdInput()        { return this.page.locator('.oxd-input').filter({ hasText: '' }).nth(0); }
  get saveBtn()                { return this.page.locator('button[type="submit"]:has-text("Save")'); }
  get createLoginToggle()      { return this.page.locator('.oxd-switch-input'); }
  get profilePicUpload()       { return this.page.locator('input[type="file"]'); }

  async goto() {
    await this.navigate('/web/index.php/pim/viewEmployeeList');
    await this.waitForPageLoad();
  }

  async gotoAddEmployee() {
    await this.navigate('/web/index.php/pim/addEmployee');
    await this.waitForPageLoad();
  }

  async addEmployee(firstName: string, middleName: string, lastName: string) {
    await this.gotoAddEmployee();
    await this.fillInput(this.firstNameInput, firstName);
    await this.fillInput(this.middleNameInput, middleName);
    await this.fillInput(this.lastNameInput, lastName);
    await this.clickElement(this.saveBtn);
    await this.waitForPageLoad();
  }

  async searchEmployee(name: string, empId: string = '') {
    await this.goto();
    if (name) {
      await this.selectAutoCompleteOption(
        this.page.locator('.oxd-autocomplete-text-input input'),
        name
      );
    }
    if (empId) {
      await this.fillInput(this.employeeIdSearch, empId);
    }
    await this.clickElement(this.searchBtn);
    await this.waitForPageLoad();
  }

  async assertEmployeeInTable(name: string) {
    const row = this.page.locator('.oxd-table-row').filter({ hasText: name });
    await expect(row.first()).toBeVisible({ timeout: 8000 });
  }

  async assertRecordsFound() {
    await expect(this.recordCount).toBeVisible();
  }

  async getFirstEmployeeEditBtn() {
    return this.page.locator('.oxd-table-body .oxd-table-row').first().locator('button.oxd-icon-button').first();
  }
}
