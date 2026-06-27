import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PerformancePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get manageReviewsLink()     { return this.page.locator('a:has-text("Manage Reviews")'); }
  get myReviewsLink()         { return this.page.locator('a:has-text("My Reviews")'); }
  get kpisLink()              { return this.page.locator('a:has-text("KPIs")'); }
  get addBtn()                { return this.page.locator('button:has-text("Add")'); }
  get searchBtn()             { return this.page.locator('button[type="submit"]:has-text("Search")'); }
  get performanceTable()      { return this.page.locator('.oxd-table'); }
  get tableRows()             { return this.page.locator('.oxd-table-body .oxd-table-row'); }

  // KPI form
  get kpiIndicatorInput()     { return this.page.locator('.oxd-input').first(); }
  get jobTitleDropdown()      { return this.page.locator('.oxd-select-text').first(); }
  get minRatingInput()        { return this.page.locator('.oxd-input').nth(1); }
  get maxRatingInput()        { return this.page.locator('.oxd-input').nth(2); }
  get saveBtn()               { return this.page.locator('button[type="submit"]:has-text("Save")'); }

  async gotoManageReviews() {
    await this.navigate('/web/index.php/performance/searchPerformanceReview');
    await this.waitForPageLoad();
  }

  async gotoMyReviews() {
    await this.navigate('/web/index.php/performance/myPerformanceReview');
    await this.waitForPageLoad();
  }

  async gotoKPIs() {
    await this.navigate('/web/index.php/performance/searchKpi');
    await this.waitForPageLoad();
  }

  async addKPI(indicator: string, jobTitle: string) {
    await this.gotoKPIs();
    await this.clickElement(this.addBtn);
    await this.waitForPageLoad();
    await this.fillInput(this.kpiIndicatorInput, indicator);
    await this.selectDropdownOption(this.jobTitleDropdown, jobTitle);
    await this.fillInput(this.minRatingInput, '1');
    await this.fillInput(this.maxRatingInput, '5');
    await this.clickElement(this.saveBtn);
    await this.waitForPageLoad();
  }

  async assertPerformanceTableVisible() {
    await expect(this.performanceTable).toBeVisible({ timeout: 8000 });
  }

  async searchReview(employeeName: string) {
    await this.gotoManageReviews();
    if (employeeName) {
      await this.selectAutoCompleteOption(
        this.page.locator('.oxd-autocomplete-text-input input'),
        employeeName
      );
    }
    await this.clickElement(this.searchBtn);
    await this.waitForPageLoad();
  }
}
