import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get dashboardHeader()     { return this.page.locator('h6:has-text("Dashboard")'); }
  get sidebarMenu()         { return this.page.locator('.oxd-main-menu'); }
  get userDropdown()        { return this.page.locator('.oxd-userdropdown-tab'); }
  get logoutOption()        { return this.page.locator('a:has-text("Logout")'); }
  get quickLaunchSection()  { return this.page.locator('.orangehrm-dashboard-grid'); }
  get timeAtWork()          { return this.page.locator('.orangehrm-attendance-card'); }

  navItem(name: string)     { return this.page.locator(`.oxd-main-menu-item:has-text("${name}")`); }

  async assertDashboardLoaded() {
    await expect(this.dashboardHeader).toBeVisible({ timeout: 10000 });
    await expect(this.sidebarMenu).toBeVisible();
  }

  async navigateTo(menuItem: string) {
    await this.clickElement(this.navItem(menuItem));
    await this.waitForPageLoad();
  }

  async logout() {
    await this.clickElement(this.userDropdown);
    await this.clickElement(this.logoutOption);
    await this.waitForPageLoad();
  }

  async assertMenuItemsVisible() {
    const menuItems = ['Admin', 'PIM', 'Leave', 'Time', 'Recruitment', 'My Info', 'Performance', 'Dashboard', 'Directory', 'Maintenance', 'Buzz'];
    for (const item of menuItems) {
      await expect(this.navItem(item)).toBeVisible();
    }
  }
}
