import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async clickElement(locator: Locator) {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  async fillInput(locator: Locator, value: string) {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
  }

  async selectDropdownOption(locator: Locator, value: string) {
    await locator.click();
    const option = this.page.locator(`.oxd-select-option span:text-is("${value}")`);
    await option.first().click();
  }

  async selectAutoCompleteOption(inputLocator: Locator, value: string) {
    await inputLocator.fill(value);
    await this.page.waitForTimeout(800);
    const option = this.page.locator('.oxd-autocomplete-option span').filter({ hasText: value }).first();
    await option.click();
  }

  async assertToastMessage(expectedText: string) {
    const toast = this.page.locator('.oxd-toast-content');
    await expect(toast).toBeVisible({ timeout: 8000 });
    await expect(toast).toContainText(expectedText);
  }

  async assertPageHeader(expectedText: string) {
    const header = this.page.locator('h6.oxd-text--h6');
    await expect(header).toContainText(expectedText);
  }

  async dismissToast() {
    const toast = this.page.locator('.oxd-toast');
    if (await toast.isVisible()) {
      await this.page.locator('.oxd-toast-close').click().catch(() => {});
    }
  }
}
