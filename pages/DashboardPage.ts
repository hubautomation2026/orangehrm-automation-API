import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // FIX 1: oxd-text renders as <h6 class="oxd-text oxd-text--h6">, not a semantic heading role.
  // getByRole('heading') won't match it. Use the rendered class instead.
  get dashboardHeader() {
    return this.page.getByRole('heading', { name: 'Dashboard' });
  }
//await page.getByRole('heading', { name: 'Dashboard' }).click();
 //
 // await page.getByLabel('Sidepanel').locator('div').filter({ hasText: 'AdminPIMLeaveTimeRecruitmentMy' }).click();
//await page.getByLabel('Sidepanel').locator('div').filter({ hasText: 'AdminPIMLeaveTimeRecruitmentMy' }).click();
  // FIX 2: oxd-main-menu renders as <nav class="oxd-main-menu">, not just a div.
  get sidebarMenu() {
    return this.page.getByLabel('Sidepanel').locator('div').filter({ hasText: 'AdminPIMLeaveTimeRecruitmentMy' });
    //locator('nav.oxd-main-menu');
  }

  // OK: .oxd-userdropdown-tab is a real rendered class — this was already correct.
  get userDropdown() {
    return this.page.getByText('fsa fsa');
    //filter({ hasText: 'manda user' });
    //locator('.oxd-userdropdown-tab');
  }

  // FIX 3: The logout link is inside the dropdown panel. We scope it to the dropdown
  // container so it won't match before the menu is open.
  get logoutOption() {
    return this.page.getByRole('menuitem', { name: 'Logout' });
    //locator('.oxd-userdropdown-menu a', { hasText: 'Logout' });
  }

  // OK: .orangehrm-dashboard-grid is a real rendered class. Add a longer timeout
  // because the dashboard widgets are loaded asynchronously after Vue mounts.
  get quickLaunchSection() {
    return this.page.locator('.orangehrm-dashboard-grid');
  }

  // OK: .orangehrm-attendance-card is rendered directly. No change needed.
  get timeAtWork() {
    return this.page.locator('.orangehrm-attendance-card');
  }

  // FIX 4: The critical fix. `.oxd-main-menu-item:has-text("X")` is invalid because
  // :has-text() is NOT a real CSS pseudo-class — Playwright only supports it in its
  // own selector engine, not inside plain CSS strings passed to .locator().
  // The rendered HTML is: <li class="oxd-main-menu-item"><span class="...">Admin</span>
  // Use .filter({ hasText }) to match on the inner text correctly.
  navItem(name: string) {
    return this.page
    .getByRole('navigation', { name: 'Sidepanel' })
    .getByRole('link')
    .filter({ hasText: name });
  }

 // await page.locator('span').filter({ hasText: 'manda user' }).click();
 // await page.getByRole('menuitem', { name: 'Logout' }).click();
  async assertDashboardLoaded() {
    // Give the Vue app time to mount and render the dashboard header
    await expect(this.dashboardHeader).toBeVisible({ timeout: 15000 });
    //await expect(this.sidebarMenu).toBeVisible();
  }

  
  //await page.getByRole('link', { name: 'Admin' }).click();
  async navigateTo(menuItem: string) {
    await this.navItem(menuItem).click();
    await this.waitForPageLoad();
  }

  async logout() {
    await this.userDropdown.click();
    // Wait for the dropdown panel to appear before clicking Logout
    await expect(this.logoutOption).toBeVisible({ timeout: 5000 });
    await this.logoutOption.click();
    await this.waitForPageLoad();
  }

  async assertMenuItemsVisible() {
    const menuItems = [
      'Admin', 'PIM', 'Leave', 'Time', 'Recruitment',
      'My Info', 'Performance', 'Dashboard', 'Directory', 'Maintenance', 'Buzz'
    ];
    for (const item of menuItems) {
      await expect(this.navItem(item)).toBeVisible({ timeout: 10000 });
    }
  }
}