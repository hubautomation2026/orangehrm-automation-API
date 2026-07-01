import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string) {
    await this.page.goto(path);
  }

  // FIX (TC01/TC03 flakiness): waitForLoadState('networkidle') is the wrong
  // strategy for OrangeHRM's Vue SPA. The app keeps background XHRs alive
  // (polling, analytics-style calls) so "no network activity for 500ms" can
  // legitimately never occur within the 30s test timeout — that's exactly
  // what caused TC01's "Test timeout of 30000ms exceeded" failure.
  //
  // It also caused TC03's failure indirectly: networkidle resolved while the
  // SPA was still mid-client-side-navigation after clicking Save, so the test
  // asserted the URL before the route had actually changed to
  // viewPersonalDetails.
  //
  // FIX: wait for a concrete, page-specific signal instead of a generic
  // network-quiet heuristic. The OrangeHRM loading spinner
  // (.oxd-loading-spinner or .oxd-form-loader) is present during data fetches
  // and removed once the page is interactive — waiting for it to detach is
  // the standard Playwright pattern for SPAs with persistent background
  // network traffic.
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    const spinner = this.page.locator('.oxd-loading-spinner, .oxd-form-loader');
    // Spinner may not appear at all on fast loads — don't fail if it's absent.
    await spinner.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
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
    // OrangeHRM's autocomplete fires an XHR after each keystroke and renders
    // results inside a list of <div class="oxd-autocomplete-option"> items.
    // Each item contains a <span> with the employee name text.
    // We wait for the option list container first, then for the specific item.
    // waitForTimeout is never used — it races against network latency.
    //
    // FIX (TC04 flakiness): the demo site's autocomplete XHR can take longer
    // than 10s under load (public shared demo instance, no SLA). Two changes:
    //   1. Timeout raised 10s → 20s to absorb that latency.
    //   2. Wait for the dropdown CONTAINER to appear first (cheap, fast signal
    //      that the XHR has started rendering results) before filtering for
    //      the specific text match — this avoids the filter+text-match query
    //      re-evaluating against an empty DOM for the entire 20s window.
    const dropdown = this.page.locator('.oxd-autocomplete-dropdown');
    await dropdown.first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});

    const option = this.page
      .locator('.oxd-autocomplete-option')
      .filter({ hasText: value })
      .first();
    await option.waitFor({ state: 'visible', timeout: 20000 });
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