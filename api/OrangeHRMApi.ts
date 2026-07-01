// ─────────────────────────────────────────────────────────────────────────────
// api/OrangeHRMApi.ts
//
// FINAL FIX — approach change, not another header tweak.
//
// Every previous attempt tried to reimplement OrangeHRM's login (CSRF token,
// Set-Cookie parsing, XSRF header) using raw HTTP calls via APIRequestContext.
// Each attempt hit a different Playwright internal quirk (redirect-following,
// maxRedirects mapping, cookie-header injection rules) because we were
// fighting the framework instead of using the part of it that already works.
//
// We KNOW the real browser login works — TC01, TC02, TC03 pass every run
// using LoginPage.login() through an actual Chromium page. That flow handles
// CSRF tokens, redirects, and session cookies correctly because it's a real
// browser doing what browsers do.
//
// THE FIX: stop reimplementing login over raw HTTP. Instead, accept the
// cookies from an already-authenticated BrowserContext (captured via
// `context.storageState()` after a real UI login) and reuse them for API
// calls. No CSRF parsing, no manual cookie-jar logic, no guessing at
// Laravel's XSRF header requirements — the browser already solved all of
// that correctly.
//
// login() is replaced with loadCookiesFrom(context), called from the fixture
// AFTER a real UI login has happened.
// ─────────────────────────────────────────────────────────────────────────────

import { APIRequestContext, APIResponse, BrowserContext, expect } from '@playwright/test';
import type {
  OrangeHRMListResponse,
  OrangeHRMSingleResponse,
  Employee,
  SystemUser,
  LeaveType,
  JobTitle,
  CreateEmployeePayload,
  CreateUserPayload,
} from '../types/api.types';

const BASE_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/api/v2' as const;

export class OrangeHRMApi {
  private readonly request: APIRequestContext;
  private cookies: string = '';
  private xsrfToken: string = '';

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  // ─── Authentication ──────────────────────────────────────────────────────────
  //
  // Pulls cookies from an already-authenticated BrowserContext (real UI login
  // already happened via LoginPage.login() + assertLoggedIn()). This is the
  // exact set of cookies a real browser sends, including the authenticated
  // session and any XSRF-TOKEN cookie Laravel issued — no manual parsing needed.
  //
  // Usage (from a fixture):
  //   const api = new OrangeHRMApi(request);
  //   await api.loadCookiesFrom(context);   // context is already logged in

  async loadCookiesFrom(context: BrowserContext): Promise<void> {
    const cookies = await context.cookies();

    this.cookies = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Laravel SPA endpoints require X-XSRF-TOKEN on top of the cookie itself.
    // The cookie value is URL-encoded; the header must be decoded.
    const xsrfCookie = cookies.find(
      c => c.name === 'XSRF-TOKEN' || c.name.toLowerCase() === 'xsrf-token'
    );
    this.xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie.value) : '';
  }

  // ─── Request headers ─────────────────────────────────────────────────────────

  private defaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (this.cookies) headers['Cookie'] = this.cookies;
    if (this.xsrfToken) headers['X-XSRF-TOKEN'] = this.xsrfToken;

    return headers;
  }

  // ─── Generic response parser ──────────────────────────────────────────────────

  async parseResponse<T>(response: APIResponse): Promise<T> {
    return response.json() as T;
  }

  // ─── Employees ────────────────────────────────────────────────────────────────

  async getEmployees(params: Record<string, string> = {}): Promise<APIResponse> {
    const allParams = { limit: '50', offset: '0', ...params };
    const query = new URLSearchParams(allParams).toString();
    return this.request.get(`${BASE_URL}/pim/employees?${query}`, {
      headers: this.defaultHeaders(),
    });
  }

  async getEmployeeById(empNumber: number): Promise<APIResponse> {
    return this.request.get(`${BASE_URL}/pim/employees/${empNumber}`, {
      headers: this.defaultHeaders(),
    });
  }

  async createEmployee(payload: CreateEmployeePayload): Promise<APIResponse> {
    return this.request.post(`${BASE_URL}/pim/employees`, {
      headers: this.defaultHeaders(),
      data: payload,
    });
  }

  // ─── Leave ────────────────────────────────────────────────────────────────────

  async getLeaveTypes(): Promise<APIResponse> {
    return this.request.get(`${BASE_URL}/leave/leave-types?limit=50&offset=0`, {
      headers: this.defaultHeaders(),
    });
  }

  async getLeaveRequests(): Promise<APIResponse> {
    return this.request.get(`${BASE_URL}/leave/leave-requests?limit=50&offset=0`, {
      headers: this.defaultHeaders(),
    });
  }

  // ─── Admin / Users ────────────────────────────────────────────────────────────

  async getSystemUsers(): Promise<APIResponse> {
    return this.request.get(`${BASE_URL}/admin/users?limit=50&offset=0`, {
      headers: this.defaultHeaders(),
    });
  }

  async createSystemUser(payload: CreateUserPayload): Promise<APIResponse> {
    return this.request.post(`${BASE_URL}/admin/users`, {
      headers: this.defaultHeaders(),
      data: payload,
    });
  }

  async deleteSystemUser(userId: number): Promise<APIResponse> {
    return this.request.delete(`${BASE_URL}/admin/users/${userId}`, {
      headers: this.defaultHeaders(),
    });
  }

  // ─── Job Titles ───────────────────────────────────────────────────────────────

  async getJobTitles(): Promise<APIResponse> {
    return this.request.get(`${BASE_URL}/admin/job-titles?limit=50&offset=0`, {
      headers: this.defaultHeaders(),
    });
  }

  async createJobTitle(title: string, description: string): Promise<APIResponse> {
    return this.request.post(`${BASE_URL}/admin/job-titles`, {
      headers: this.defaultHeaders(),
      data: { title, description, note: '' },
    });
  }

  // ─── Response helpers ─────────────────────────────────────────────────────────

  assertStatus(response: APIResponse, expectedStatus: number): void {
    expect(response.status()).toBe(expectedStatus);
  }

  async parseJson(response: APIResponse): Promise<unknown> {
    return response.json();
  }
}