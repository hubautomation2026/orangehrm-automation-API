// ─────────────────────────────────────────────────────────────────────────────
// api/OrangeHRMApi.ts
//
// WHAT CHANGED vs original:
//
//  1. `parseJson()` was `Promise<any>` → now `parseResponse<T>()` is generic.
//     Every caller tells TypeScript the expected shape at call time.
//
//  2. `defaultHeaders()` returned a plain object → now typed as
//     `Record<string, string>` so TypeScript catches wrong header values.
//
//  3. `createEmployee()` took three loose string args → now takes a typed
//     `CreateEmployeePayload` object. Wrong field names are caught at compile time.
//
//  4. `createSystemUser()` had an inline anonymous type → now uses the
//     imported `CreateUserPayload` interface for consistency and reuse.
//
//  5. `assertStatus()` was async for no reason → now synchronous.
//     Async functions that don't await anything waste a Promise allocation
//     and mislead callers into thinking they need to await them.
//
//  6. Added `readonly` to `BASE_URL` constant to match `as const` discipline.
//
//  7. Return types on every public method are now explicit — the original
//     relied on inference, which breaks when the implementation changes.
// ─────────────────────────────────────────────────────────────────────────────

import { APIRequestContext, APIResponse, expect } from '@playwright/test';
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

// CHANGE 6: `as const` makes BASE_URL a literal type 'https://...' not just string.
// If this value is ever changed elsewhere by mistake, TypeScript flags it.
const BASE_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/api/v2' as const;

export class OrangeHRMApi {
  // CHANGE: `readonly` prevents accidental reassignment of the request context.
  private readonly request: APIRequestContext;
  private cookies: string = '';

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  // ─── Authentication ─────────────────────────────────────────────────────────

  async login(username = 'Admin', password = 'admin123'): Promise<void> {
    const loginPage = await this.request.get(
      'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login'
    );
    const setCookieHeader = loginPage.headers()['set-cookie'] ?? '';
    const sessionCookie = setCookieHeader.split(';')[0];

    const loginResp = await this.request.post(
      'https://opensource-demo.orangehrmlive.com/web/index.php/auth/validate',
      {
        form: { username, password, _token: '' },
        headers: { Cookie: sessionCookie },
      }
    );

    const responseCookies = loginResp.headers()['set-cookie'] ?? sessionCookie;
    this.cookies = responseCookies.split(';')[0];
  }

  // CHANGE 2: Return type is explicit `Record<string, string>` — not inferred.
  // This is important: if you add a header with a non-string value later,
  // TypeScript will flag it immediately rather than silently breaking requests.
  private defaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Cookie: this.cookies,
    };
  }

  // ─── Generic response parser ─────────────────────────────────────────────────
  // CHANGE 1: This replaces `parseJson(resp): Promise<any>`.
  // The generic <T> makes the return type match whatever you pass as T.
  // parseResponse<OrangeHRMListResponse<Employee>>(resp) → body typed as
  // { data: Employee[], meta: { total: number, ... } }
  // The caller decides the type — this method stays generic.

  async parseResponse<T>(response: APIResponse): Promise<T> {
    return response.json() as T;
  }

  // ─── Employees ───────────────────────────────────────────────────────────────

  async getEmployees(
    params: Record<string, string> = {}
  ): Promise<APIResponse> {
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

  // CHANGE 3: Was `createEmployee(firstName: string, lastName: string, employeeId: string)`.
  // Three loose strings — easy to pass them in the wrong order, no compiler warning.
  // Now uses CreateEmployeePayload: a named object where field names are explicit.
  // Wrong field names → TypeScript error at compile time, not a runtime bug.

  async createEmployee(payload: CreateEmployeePayload): Promise<APIResponse> {
    return this.request.post(`${BASE_URL}/pim/employees`, {
      headers: this.defaultHeaders(),
      data: payload,
    });
  }

  // ─── Leave ───────────────────────────────────────────────────────────────────

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

  // ─── Admin / Users ───────────────────────────────────────────────────────────

  async getSystemUsers(): Promise<APIResponse> {
    return this.request.get(`${BASE_URL}/admin/users?limit=50&offset=0`, {
      headers: this.defaultHeaders(),
    });
  }

  // CHANGE 4: Was an inline anonymous type `{ userRoleId: number; empNumber: number; ... }`.
  // Now uses the imported CreateUserPayload — same type shared between
  // the API client, test data, and test assertions. Change the type once, it
  // updates everywhere. With inline types you'd update each call site separately.

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

  // ─── Job Titles ──────────────────────────────────────────────────────────────

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

  // ─── Response helpers ────────────────────────────────────────────────────────

  // CHANGE 5: Was `async assertStatus(...)` — there is no `await` inside,
  // so `async` was misleading. Callers were forced to `await` a function
  // that never actually does anything asynchronous.
  // Rule: never mark a function `async` unless it contains `await`.

  assertStatus(response: APIResponse, expectedStatus: number): void {
    expect(response.status()).toBe(expectedStatus);
  }

  // Kept for backward compat but now typed properly.
  // In new test code, prefer parseResponse<T>() for type-safe access.
  async parseJson(response: APIResponse): Promise<unknown> {
    return response.json();
  }
}
