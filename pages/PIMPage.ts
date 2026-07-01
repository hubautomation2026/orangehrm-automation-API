import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PIMPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Employee List
  get addEmployeeBtn()     { return this.page.locator('button').filter({ hasText: 'Add' }); }
  get searchBtn()          { return this.page.locator('button[type="submit"]').filter({ hasText: 'Search' }); }
  get resetBtn()           { return this.page.locator('button[type="reset"]').filter({ hasText: 'Reset' }); }
  get employeeNameSearch() { return this.page.locator('.oxd-input').nth(0); }
  get employeeIdSearch()   { return this.page.locator('.oxd-input').nth(1); }
  get tableRows()          { return this.page.locator('.oxd-table-body .oxd-table-row'); }
  get recordCount()        { return this.page.locator('.oxd-text--span').filter({ hasText: 'Record' }); }

  // Add Employee Form
  get firstNameInput()    { return this.page.locator('input[name="firstName"]'); }
  get middleNameInput()   { return this.page.locator('input[name="middleName"]'); }
  get lastNameInput()     { return this.page.locator('input[name="lastName"]'); }
  get employeeIdInput()   { return this.page.locator('.oxd-input').filter({ hasText: '' }).nth(0); }
  get saveBtn()           { return this.page.locator('button[type="submit"]').filter({ hasText: 'Save' }); }
  get createLoginToggle() { return this.page.locator('.oxd-switch-input'); }
  get profilePicUpload()  { return this.page.locator('input[type="file"]'); }

  // FIX TC04: The PIM search form has TWO oxd-autocomplete-text-input fields
  // (Employee Name and Supervisor Name). Passing the bare class to
  // selectAutoCompleteOption() hits both — strict mode violation.
  // Scope with :first-of-type equivalent by using .first() on the container,
  // then descending into the input inside that specific container only.
  get employeeNameAutocomplete() {
    return this.page
      .locator('.oxd-autocomplete-text-input')
      .first()
      .locator('input');
  }

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
    // FIX (TC03 flakiness): after Save, OrangeHRM does a client-side route
    // change to /pim/viewPersonalDetails/empNumber/{id}. waitForPageLoad()
    // alone isn't a reliable signal that this navigation has completed —
    // the test was asserting the URL while still on /pim/addEmployee.
    // Wait for the URL pattern explicitly; this is the actual condition the
    // test cares about, not a proxy for it.
    await this.page.waitForURL(/viewPersonalDetails/, { timeout: 15000 });
    await this.waitForPageLoad();
  }

  async searchEmployee(name: string, empId: string = '') {
    await this.goto();
    if (name) {
      // FIX: use the scoped getter instead of the bare page-wide locator
      await this.selectAutoCompleteOption(this.employeeNameAutocomplete, name);
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
    return this.page
      .locator('.oxd-table-body .oxd-table-row')
      .first()
      .locator('button.oxd-icon-button')
      .first();
  }
}