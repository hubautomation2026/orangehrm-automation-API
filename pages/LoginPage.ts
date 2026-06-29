// pages/LoginPage.ts
// ─────────────────────────────────────────────────────────────────────────────
// WHAT CHANGED vs current broken version:
//
//  FIX (line 43): DashboardHeader was `page.getByText('Dashboard', { exact: true })`
//  This is a page-wide text search and resolves to 2 elements:
//    1. <span class="oxd-main-menu-item--name">Dashboard</span>  ← sidebar nav item
//    2. <h6 class="oxd-text--h6 oxd-topbar-header-breadcrumb-module">Dashboard</h6>  ← breadcrumb
//  Playwright strict mode throws "resolved to 2 elements" immediately — no timeout needed.
//
//  The fix scopes the locator to ONLY the breadcrumb h6 using its unique class:
//    page.locator('h6.oxd-topbar-header-breadcrumb-module')
//  This class is on the breadcrumb h6 ONLY — the sidebar span never has it.
//  No hasText filter needed because the class already uniquely identifies it.
// ─────────────────────────────────────────────────────────────────────────────

import { Page, Locator, expect } from '@playwright/test';

export interface LoginCredentials {
  username: string;
  password: string;
}

export class LoginPage {
  readonly page: Page;

  readonly UsernameField:  Locator;
  readonly PasswordField:  Locator;
  readonly LoginButton:    Locator;
  readonly ForgotPassword: Locator;
  readonly DashboardHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.UsernameField   = page.getByRole('textbox', { name: 'Username' });
    this.PasswordField   = page.getByRole('textbox', { name: 'Password' });
    this.LoginButton     = page.getByRole('button',  { name: 'Login' });
    this.ForgotPassword  = page.getByText('Forgot your password?');

    // FIX: was `page.getByText('Dashboard', { exact: true })` which matches
    // BOTH the sidebar nav span AND the breadcrumb h6 — strict mode violation.
    //
    // The breadcrumb h6 has a unique class `oxd-topbar-header-breadcrumb-module`
    // that the sidebar span never has. Scoping to that class gives exactly 1 match.
    //
    // Confirmed from the error message itself:
    //   <h6 class="oxd-text oxd-text--h6 oxd-topbar-header-breadcrumb-module">Dashboard</h6>
  this.DashboardHeader = page.locator('h6.oxd-topbar-header-breadcrumb-module');
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

  async login(username: string, password: string): Promise<void> {
    await this.FillLoginForm({ username, password });
  }

  async assertLoggedIn(): Promise<void> {
    // DashboardHeader now resolves to exactly 1 element — the breadcrumb h6.
    // Strict mode is satisfied; the 10s timeout is plenty for Vue to mount.
    await expect(this.DashboardHeader).toBeVisible({ timeout: 10000 });
  }
}