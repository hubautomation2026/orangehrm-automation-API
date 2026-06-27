// ─────────────────────────────────────────────────────────────────────────────
// fixtures/pages.fixture.ts
//
// WHAT CHANGED vs original:
//
// The original project had TWO fixture files with overlapping responsibility:
//   - fixtures/pages.fixture.ts   (authenticatedPage used FillLoginForm, no assertion)
//   - fixtures/fixtureshhh.ts     (authenticatedPage used goto+login+assertLoggedIn)
//
// Different test files imported from different ones:
//   - tests/01-login.spec.ts and 03-pim.spec.ts → '../fixtures/pages.fixture'
//   - tests/05-admin.spec.ts                     → '../fixtures/fixtureshhh'
//
// This is a real risk for a senior SDET interview to be asked about: two
// fixture files mean two different authentication flows for the same suite,
// and changing one doesn't change the other — tests can silently diverge.
// fixtureshhh.ts also called the missing `assertLoggedIn()` (now fixed in
// LoginPage.ts) — so it was actively broken.
//
// THE FIX: delete fixtureshhh.ts entirely. This file is the single source
// of truth. All test files should import from '../fixtures/pages.fixture'.
//
// Additional changes in this file specifically:
//  1. Removed Windows line endings (\r\n) — the original had CRLF line endings
//     mixed into a TS file, which causes diff noise in git and occasional
//     parser issues on Linux CI runners.
//  2. `api` fixture now returns the upgraded `OrangeHRMApi` with generic
//     `parseResponse<T>()` instead of `parseJson(): Promise<any>`.
//  3. `authenticatedPage` now calls the real `assertLoggedIn()` — login
//     failures fail fast with a clear error instead of silently continuing
//     into a test that will fail later for a confusing reason.
// ─────────────────────────────────────────────────────────────────────────────

import { test as base, Page } from '@playwright/test';
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

type PageFixtures = {
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

export const test = base.extend<PageFixtures>({

  // Raw page object, no pre-login — used by login-flow tests themselves
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },

  // CHANGE 3: now asserts successful login before handing off the page.
  // If credentials.valid ever breaks (e.g. demo site resets), every test
  // using authenticatedPage fails immediately with "Dashboard not visible"
  // instead of failing later with a confusing locator-not-found error.
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

  // CHANGE 2: api fixture now provides the upgraded, fully-typed OrangeHRMApi
  api: async ({ request }, use) => {
    const api = new OrangeHRMApi(request);
    await api.login();
    await use(api);
  },
});

export { expect } from '@playwright/test';
