import { test as base, Page, APIRequestContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PIMPage } from '../pages/PIMPage';
import { LeavePage } from '../pages/LeavePage';
import { AdminPage } from '../pages/AdminPage';
import { MyInfoPage } from '../pages/MyInfoPage';
import { RecruitmentPage } from '../pages/RecruitmentPage';
import { PerformancePage } from '../pages/PerformancePage';
import { DirectoryPage } from '../pages/DirectoryPage';
import { OrangeHRMApi } from '../api/OrangeHRMApi';
import { credentials } from '../test-data/testData';

// Define fixture types
type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  pimPage: PIMPage;
  leavePage: LeavePage;
  adminPage: AdminPage;
  myInfoPage: MyInfoPage;
  recruitmentPage: RecruitmentPage;
  performancePage: PerformancePage;
  directoryPage: DirectoryPage;
  authenticatedPage: Page;
  api: OrangeHRMApi;
};

export const test = base.extend<Fixtures>({

  // Raw page objects (no pre-login)
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // Authenticated page fixture - logs in once per test
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credentials.valid.username, credentials.valid.password);
    await loginPage.assertLoggedIn();
    await use(page);
  },

  dashboardPage: async ({ authenticatedPage }, use) => {
    await use(new DashboardPage(authenticatedPage));
  },

  pimPage: async ({ authenticatedPage }, use) => {
    await use(new PIMPage(authenticatedPage));
  },

  leavePage: async ({ authenticatedPage }, use) => {
    await use(new LeavePage(authenticatedPage));
  },

  adminPage: async ({ authenticatedPage }, use) => {
    await use(new AdminPage(authenticatedPage));
  },

  myInfoPage: async ({ authenticatedPage }, use) => {
    await use(new MyInfoPage(authenticatedPage));
  },

  recruitmentPage: async ({ authenticatedPage }, use) => {
    await use(new RecruitmentPage(authenticatedPage));
  },

  performancePage: async ({ authenticatedPage }, use) => {
    await use(new PerformancePage(authenticatedPage));
  },

  directoryPage: async ({ authenticatedPage }, use) => {
    await use(new DirectoryPage(authenticatedPage));
  },

  api: async ({ request }, use) => {
    const api = new OrangeHRMApi(request);
    await api.login();
    await use(api);
  },
});

export { expect } from '@playwright/test';
