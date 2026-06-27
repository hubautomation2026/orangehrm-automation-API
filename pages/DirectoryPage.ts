import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DirectoryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get searchBtn()              { return this.page.locator('button[type="submit"]:has-text("Search")'); }
  get resetBtn()               { return this.page.locator('button[type="reset"]:has-text("Reset")'); }
  get employeeNameInput()      { return this.page.locator('.oxd-autocomplete-text-input input'); }
  get jobTitleDropdown()       { return this.page.locator('.oxd-select-text').first(); }
  get locationDropdown()       { return this.page.locator('.oxd-select-text').nth(1); }
  get employeeCards()          { return this.page.locator('.orangehrm-directory-card'); }
  get noRecordsText()          { return this.page.locator('.orangehrm-horizontal-padding'); }

  async goto() {
    await this.navigate('/web/index.php/directory/viewDirectory');
    await this.waitForPageLoad();
  }

  async searchByName(name: string) {
    await this.goto();
    await this.selectAutoCompleteOption(this.employeeNameInput, name);
    await this.clickElement(this.searchBtn);
    await this.waitForPageLoad();
  }

  async searchByJobTitle(jobTitle: string) {
    await this.goto();
    await this.selectDropdownOption(this.jobTitleDropdown, jobTitle);
    await this.clickElement(this.searchBtn);
    await this.waitForPageLoad();
  }

  async assertEmployeeCardsVisible() {
    await expect(this.employeeCards.first()).toBeVisible({ timeout: 8000 });
  }

  async getEmployeeCardCount(): Promise<number> {
    return this.employeeCards.count();
  }

  async assertSearchFormVisible() {
    await expect(this.searchBtn).toBeVisible();
    await expect(this.resetBtn).toBeVisible();
  }
}
