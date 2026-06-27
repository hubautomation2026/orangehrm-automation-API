import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyInfoPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get personalDetailsTab()   { return this.page.locator('a:has-text("Personal Details")'); }
  get contactDetailsTab()    { return this.page.locator('a:has-text("Contact Details")'); }
  get dependentsTab()        { return this.page.locator('a:has-text("Dependents")'); }
  get qualificationsTab()    { return this.page.locator('a:has-text("Qualifications")'); }

  // Personal Details
  get firstNameInput()       { return this.page.locator('input[name="firstName"]'); }
  get lastNameInput()        { return this.page.locator('input[name="lastName"]'); }
  get nicInput()             { return this.page.locator('.oxd-input').nth(4); }
  get genderRadioMale()      { return this.page.locator('input[type="radio"]').nth(0); }
  get genderRadioFemale()    { return this.page.locator('input[type="radio"]').nth(1); }
  get maritalStatusDropdown(){ return this.page.locator('.oxd-select-text').first(); }
  get nationalityDropdown()  { return this.page.locator('.oxd-select-text').nth(1); }
  get dobInput()             { return this.page.locator('.oxd-date-input input'); }
  get savePersonalBtn()      { return this.page.locator('button[type="submit"]:has-text("Save")').first(); }

  // Contact Details
  get streetInput()          { return this.page.locator('.oxd-input').nth(0); }
  get cityInput()            { return this.page.locator('.oxd-input').nth(2); }
  get mobileInput()          { return this.page.locator('.oxd-input').nth(5); }
  get workEmailInput()       { return this.page.locator('.oxd-input').nth(6); }

  async goto() {
    await this.navigate('/web/index.php/pim/viewMyDetails');
    await this.waitForPageLoad();
  }

  async updatePersonalDetails(maritalStatus: string, nationality: string) {
    await this.goto();
    await this.selectDropdownOption(this.maritalStatusDropdown, maritalStatus);
    await this.selectDropdownOption(this.nationalityDropdown, nationality);
    await this.clickElement(this.savePersonalBtn);
    await this.waitForPageLoad();
  }

  async assertPersonalDetailsVisible() {
    await expect(this.firstNameInput).toBeVisible({ timeout: 8000 });
    await expect(this.lastNameInput).toBeVisible();
  }

  async gotoContactDetails() {
    await this.goto();
    await this.clickElement(this.contactDetailsTab);
    await this.waitForPageLoad();
  }

  async gotoQualifications() {
    await this.goto();
    await this.clickElement(this.qualificationsTab);
    await this.waitForPageLoad();
  }
}
