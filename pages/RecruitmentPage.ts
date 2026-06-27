import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RecruitmentPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get addVacancyBtn()         { return this.page.locator('button:has-text("Add")'); }
  get vacancyNameInput()      { return this.page.locator('.oxd-input').first(); }
  get jobTitleDropdown()      { return this.page.locator('.oxd-select-text').first(); }
  get hiringManagerInput()    { return this.page.locator('.oxd-autocomplete-text-input input'); }
  get noOfPositionsInput()    { return this.page.locator('.oxd-input').nth(1); }
  get descriptionTextarea()   { return this.page.locator('textarea'); }
  get activeStatusToggle()    { return this.page.locator('.oxd-switch-input'); }
  get saveBtn()               { return this.page.locator('button[type="submit"]:has-text("Save")'); }
  get searchBtn()             { return this.page.locator('button[type="submit"]:has-text("Search")'); }
  get vacancyTable()          { return this.page.locator('.oxd-table'); }
  get tableRows()             { return this.page.locator('.oxd-table-body .oxd-table-row'); }

  async gotoVacancies() {
    await this.navigate('/web/index.php/recruitment/viewJobVacancy');
    await this.waitForPageLoad();
  }

  async gotoAddVacancy() {
    await this.gotoVacancies();
    await this.clickElement(this.addVacancyBtn);
    await this.waitForPageLoad();
  }

  async gotoAllCandidates() {
    await this.navigate('/web/index.php/recruitment/viewCandidates');
    await this.waitForPageLoad();
  }

  async addVacancy(name: string, jobTitle: string, hiringManager: string) {
    await this.gotoAddVacancy();
    await this.fillInput(this.vacancyNameInput, name);
    await this.selectDropdownOption(this.jobTitleDropdown, jobTitle);
    await this.selectAutoCompleteOption(this.hiringManagerInput, hiringManager);
    await this.fillInput(this.noOfPositionsInput, '2');
    await this.clickElement(this.saveBtn);
    await this.waitForPageLoad();
  }

  async assertVacancyTableVisible() {
    await expect(this.vacancyTable).toBeVisible({ timeout: 8000 });
  }

  async assertVacancyInTable(name: string) {
    const row = this.page.locator('.oxd-table-row').filter({ hasText: name });
    await expect(row.first()).toBeVisible({ timeout: 8000 });
  }
}
