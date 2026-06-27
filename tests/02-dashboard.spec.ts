/**
 * Page 2: Dashboard Page Tests
 * - Sidebar navigation
 * - Dashboard widgets
 * - Quick launch links
 */

import { test,expect } from '../fixtures/pages.fixture';

test.describe('Dashboard Page', () => {

  test('TC01 - Dashboard loads with header', async ({ dashboardPage }) => {
    await dashboardPage.page.goto('/web/index.php/dashboard/index');
    await dashboardPage.assertDashboardLoaded();
  });

  test('TC02 - All main menu items are visible', async ({ dashboardPage }) => {
    await dashboardPage.page.goto('/web/index.php/dashboard/index');
    await dashboardPage.assertMenuItemsVisible();
  });

  test('TC03 - Navigate to Admin page from sidebar', async ({ dashboardPage }) => {
    await dashboardPage.page.goto('/web/index.php/dashboard/index');
    await dashboardPage.navigateTo('Admin');
    await expect(dashboardPage.page).toHaveURL(/admin/);
  });

  test('TC04 - Navigate to PIM page from sidebar', async ({ dashboardPage }) => {
    await dashboardPage.page.goto('/web/index.php/dashboard/index');
    await dashboardPage.navigateTo('PIM');
    await expect(dashboardPage.page).toHaveURL(/pim/);
  });

  test('TC05 - Navigate to Leave page from sidebar', async ({ dashboardPage }) => {
    await dashboardPage.page.goto('/web/index.php/dashboard/index');
    await dashboardPage.navigateTo('Leave');
    await expect(dashboardPage.page).toHaveURL(/leave/);
  });

  test('TC06 - User dropdown is clickable', async ({ dashboardPage }) => {
    await dashboardPage.page.goto('/web/index.php/dashboard/index');
    await dashboardPage.clickElement(dashboardPage.userDropdown);
    await expect(dashboardPage.logoutOption).toBeVisible();
  });

  test('TC07 - Dashboard URL is correct after login', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveURL(/dashboard/);
  });

  test('TC08 - Quick launch section visible on dashboard', async ({ dashboardPage }) => {
    await dashboardPage.page.goto('/web/index.php/dashboard/index');
    await expect(dashboardPage.quickLaunchSection).toBeVisible();
  });
});
