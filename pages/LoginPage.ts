// ─────────────────────────────────────────────────────────────────────────────
// pages/LoginPage.ts
//
// WHAT CHANGED vs original:
//
//  1. Added the missing `assertLoggedIn()` method. The duplicate fixture file
//     `fixtureshhh.ts` called `await loginPage.assertLoggedIn()` but this
//     method never existed on LoginPage — that fixture would crash at runtime
//     the moment any test used it. This is now fixed by adding the method.
//
//  2. `FillLoginForm` and `EmptyLoginForm` took an inline anonymous type
//     `{ username: string; password: string }` — now both use the shared
//     `LoginCredentials` type imported from test-data, so the page object
//     and the test data are always in sync.
//
//  3. Added explicit `Promise<void>` return types to every method — the
//     original relied entirely on inference.
// ─────────────────────────────────────────────────────────────────────────────

import { Page, Locator, expect } from '@playwright/test';

// CHANGE 2: shared type instead of inline anonymous object type
export interface LoginCredentials {
  username: string;
  password: string;
}

export class LoginPage {
  readonly page: Page;

  // ── Locators ──────────────────────────────────────────────────────────────
  readonly UsernameField: Locator;
  readonly PasswordField: Locator;
  readonly LoginButton: Locator;
  readonly ForgotPassword: Locator;
  readonly DashboardHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.UsernameField   = page.getByRole('textbox', { name: 'Username' });
    this.PasswordField   = page.getByRole('textbox', { name: 'Password' });
    this.LoginButton     = page.getByRole('button',  { name: 'Login' });
    this.ForgotPassword  = page.getByText('Forgot your password?');
    this.DashboardHeader = page.getByText('Dashboard', { exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/web/index.php/auth/login');
    await this.page.waitForLoadState('networkidle');
  }

  async FillUsername(username: string): Promise<void> {
    await this.UsernameField.clear();
    await this.UsernameField.fill(username);
  }

  async FillPassword(password: string): Promise<void> {
    await this.PasswordField.clear();
    await this.PasswordField.fill(password);
  }

  async ClickLoignButton(): Promise<void> {
    await this.LoginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // CHANGE 2: now typed against LoginCredentials instead of an inline type
  async FillLoginForm(data: LoginCredentials): Promise<void> {
    await this.FillUsername(data.username);
    await this.FillPassword(data.password);
    await this.ClickLoignButton();
  }

  async EmptyLoginForm(data: LoginCredentials): Promise<void> {
    await this.FillUsername(data.username);
    await this.FillPassword(data.password);
  }

  async ForgetPasswordlink(): Promise<void> {
    await this.ForgotPassword.click();
  }

  // ── Convenience method used by login() + assertLoggedIn() together ────────
  async login(username: string, password: string): Promise<void> {
    await this.FillLoginForm({ username, password });
  }

  // CHANGE 1: THIS METHOD DID NOT EXIST IN THE ORIGINAL PROJECT.
  // fixtures/fixtureshhh.ts calls `await loginPage.assertLoggedIn()` —
  // without this method, every test using that fixture throws:
  //   TypeError: loginPage.assertLoggedIn is not a function
  // This is exactly the kind of bug that's invisible until someone runs
  // the suite — TypeScript can't catch it across files unless the method
  // is declared, which is now done here.
  async assertLoggedIn(): Promise<void> {
    await expect(this.DashboardHeader).toBeVisible({ timeout: 10000 });
  }
}
