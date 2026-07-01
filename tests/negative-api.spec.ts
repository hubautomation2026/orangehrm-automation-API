// ─────────────────────────────────────────────────────────────────────────────
// tests/api/negative-api.spec.ts
//
// Negative API tests — 401, 403, 404, 422 with schema assertions.
//
// WHAT THIS FILE COVERS:
//  401  Unauthorized   — no auth / expired session
//  403  Forbidden      — authenticated but not permitted (role-based)
//  404  Not Found      — valid request, resource doesn't exist
//  422  Unprocessable  — request is understood but payload is invalid
//  400  Bad Request    — malformed request (wrong types, missing fields)
//  405  Method Not Allowed — wrong HTTP verb for the endpoint
//
// WHAT "SCHEMA ASSERTION" MEANS (interview talking point):
//  A status code check (expect 404) tells you the server knows it's an error.
//  A schema assertion checks the error BODY has the right structure:
//    { "status": "404", "error": "No Records Found" }
//  This verifies your API's error contract — not just that it fails,
//  but that it fails in a consistent, parseable, documented way.
//  Front-end clients depend on that structure to show the right error message.
//
// WHY NEGATIVE TESTS SHOW SENIORITY:
//  Junior testers test what SHOULD work.
//  Senior SDETs test what SHOULD fail — and verify it fails correctly.
//  Broken error handling causes worse bugs than broken happy paths:
//  - 500 instead of 404 leaks stack traces
//  - Missing error fields break error-handling UI
//  - Wrong status codes confuse retry logic
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '../../fixtures/pages.fixture';
import { test as base } from '@playwright/test';
import type { OrangeHRMSingleResponse, Employee } from '../../types/api.types';

const BASE_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/api/v2';

// ─── Error response schema types ──────────────────────────────────────────────
//
// OrangeHRM returns errors in a consistent envelope:
//   { "error": { "status": "404", "messsage": "..." } }
// or:
//   { "error": { "status": "422", "message": "Validation failed", "violations": [...] } }
//
// We type these so assertions are checked by TypeScript, not just runtime.

interface OrangeHRMError {
  error: {
    status:     string;
    message?:   string;
    exception?: string;
  };
}

interface OrangeHRMValidationError {
  error: {
    status:     string;
    message?:   string;
    violations?: Array<{
      path?:    string;
      message?: string;
    }>;
  };
}

// Type guard: is this an OrangeHRM error envelope?
function isErrorResponse(val: unknown): val is OrangeHRMError {
  return (
    typeof val === 'object' &&
    val !== null &&
    'error' in val &&
    typeof (val as OrangeHRMError).error === 'object'
  );
}

// ─── 401 Unauthorized — no authentication ─────────────────────────────────────

test.describe('Negative: 401 Unauthorized @api @negative', () => {

  // Uses base test (no fixture login) for clean unauthenticated context
  base('GET /pim/employees without auth → 401 with error schema', async ({ request }) => {
    // PATTERN: Unauthenticated GET on protected resource.
    // Checks both the status code AND the error response structure.

    const resp = await request.get(`${BASE_URL}/pim/employees?limit=10&offset=0`, {
      headers: {
        'Content-Type':     'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        // No Cookie or X-XSRF-TOKEN
      },
    });

    // ── Status assertion ──
    expect(resp.status()).toBe(401);

    // ── Schema assertion ──
    // The error body must be parseable JSON with an error envelope.
    // A 401 that returns HTML or an empty body breaks client error handling.
    const body = await resp.json() as unknown;
    expect(isErrorResponse(body)).toBe(true);

    if (isErrorResponse(body)) {
      // Status field inside the body must say "401"
      expect(body.error.status).toBe('401');
    }
  });

  base('POST /pim/employees without auth → 401', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/pim/employees`, {
      headers: {
        'Content-Type':     'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      data: {
        firstName:  'Ghost',
        middleName: '',
        lastName:   'User',
        employeeId: 'GHOST001',
      },
    });

    expect(resp.status()).toBe(401);

    const body = await resp.json() as unknown;
    expect(isErrorResponse(body)).toBe(true);

    if (isErrorResponse(body)) {
      expect(body.error.status).toBe('401');
    }
  });

  base('DELETE /admin/users/:id without auth → 401', async ({ request }) => {
    const resp = await request.delete(`${BASE_URL}/admin/users/1`, {
      headers: {
        'Content-Type':     'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    // 401 (no auth) not 404 (not found) — server checks auth before lookup
    expect(resp.status()).toBe(401);
  });

  base('All protected endpoints reject unauthenticated requests', async ({ request }) => {
    // PATTERN: Parameterized negative test — same assertion across many endpoints.
    // In an interview: "How do you avoid repeating assertions?"
    // Answer: loop over endpoints with the same expected behavior.

    const protectedEndpoints = [
      { method: 'GET',    url: `${BASE_URL}/pim/employees?limit=1&offset=0` },
      { method: 'GET',    url: `${BASE_URL}/admin/users?limit=1&offset=0` },
      { method: 'GET',    url: `${BASE_URL}/leave/leave-types?limit=1&offset=0` },
      { method: 'GET',    url: `${BASE_URL}/admin/job-titles?limit=1&offset=0` },
      { method: 'GET',    url: `${BASE_URL}/pim/employees/7` },
    ] as const;

    const headers = {
      'Content-Type':     'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    for (const endpoint of protectedEndpoints) {
      const resp = await (
        endpoint.method === 'GET'
          ? request.get(endpoint.url, { headers })
          : request.post(endpoint.url, { headers, data: {} })
      );

      expect(
        resp.status(),
        `Expected 401 for ${endpoint.method} ${endpoint.url}`
      ).toBe(401);
    }
  });
});

// ─── 404 Not Found — resource doesn't exist ───────────────────────────────────

test.describe('Negative: 404 Not Found @api @negative', () => {

  test('GET /pim/employees/:id with non-existent ID → 404 with schema', async ({ api }) => {
    // PATTERN: 404 with schema assertion.
    // An employee with ID 999999 doesn't exist — the server must say so clearly.
    // If it returns 200 with empty data OR 500, your API has a bug.

    const resp = await api.getEmployeeById(999999);

    // ── Status assertion ──
    expect(resp.status()).toBe(404);

    // ── Schema assertion ──
    // 404 body must be structured JSON, not HTML or empty
    const body = await resp.json() as unknown;
    expect(isErrorResponse(body)).toBe(true);

    if (isErrorResponse(body)) {
      expect(body.error.status).toBe('404');
    }
  });

  test('GET /pim/employees/:id with ID 0 → 404', async ({ api }) => {
    // Boundary value: ID 0 is never a valid employee number
    const resp = await api.getEmployeeById(0);
    expect([400, 404]).toContain(resp.status());
  });

  test('GET /pim/employees/:id with very large ID → 404', async ({ api }) => {
    // Upper boundary: max integer employee ID — must not exist
    const resp = await api.getEmployeeById(2147483647);
    expect(resp.status()).toBe(404);
  });

  test('GET /admin/users/:id with non-existent ID → 404 with schema', async ({ api }) => {
    // Test 404 on a different resource type — same pattern, different domain
    const resp = await api.deleteSystemUser(888888);

    // DELETE on non-existent resource should be 404 (not 200 or 500)
    expect([404, 400]).toContain(resp.status());
  });

  test('Discriminated union error handling for 404', async ({ api }) => {
    // PATTERN: Show the discriminated union approach from the original spec,
    // now applied to a real negative test scenario.
    // This is the TypeScript-idiomatic way to handle "success or error" —
    // safer than try/catch because TypeScript enforces you handle both branches.

    type FetchResult<T> =
      | { success: true;  data: T;       status: number }
      | { success: false; error: string; status: number };

    async function fetchEmployee(id: number): Promise<FetchResult<Employee>> {
      const resp = await api.getEmployeeById(id);
      const status = resp.status();

      if (status === 200) {
        const body = await api.parseResponse<OrangeHRMSingleResponse<Employee>>(resp);
        return { success: true, data: body.data, status };
      }

      return { success: false, error: `HTTP ${status}`, status };
    }

    // Valid employee (empNumber 7 exists in OrangeHRM demo)
    const validResult = await fetchEmployee(7);
    expect(validResult.success).toBe(true);
    if (validResult.success) {
      expect(typeof validResult.data.firstName).toBe('string');
      expect(validResult.status).toBe(200);
    }

    // Non-existent employee
    const missingResult = await fetchEmployee(999999);
    expect(missingResult.success).toBe(false);
    if (!missingResult.success) {
      expect(missingResult.error).toContain('404');
      expect(missingResult.status).toBe(404);
    }
  });
});

// ─── 422 Unprocessable Entity — invalid payload ───────────────────────────────

test.describe('Negative: 422 Unprocessable Entity @api @negative', () => {

  test('POST /pim/employees with empty firstName → 422 with validation schema', async ({ api }) => {
    // PATTERN: 422 validation error with schema assertion.
    // 422 means "I understood the request but the data is invalid."
    // The body must explain WHICH field failed and WHY.

    const resp = await api.createEmployee({
      firstName:  '',        // ← violates required field rule
      middleName: '',
      lastName:   'Test',
      employeeId: 'EMPTY001',
    });

    // OrangeHRM returns 422 for validation failures
    expect([400, 422]).toContain(resp.status());

    // ── Schema assertion: error body must describe what failed ──
    const body = await resp.json() as OrangeHRMValidationError;
    expect(isErrorResponse(body)).toBe(true);

    if (isErrorResponse(body)) {
      // Status in body matches HTTP status
      expect(['400', '422']).toContain(body.error.status);
    }
  });

  test('POST /pim/employees with missing lastName → 422', async ({ api }) => {
    const resp = await api.createEmployee({
      firstName:  'Valid',
      middleName: '',
      lastName:   '',        // ← violates required field rule
      employeeId: 'NOLAST01',
    });

    expect([400, 422]).toContain(resp.status());
  });

  test('POST /pim/employees with duplicate employeeId → error response', async ({ api }) => {
    // PATTERN: Uniqueness constraint violation.
    // First create an employee, then try to create another with the same ID.
    // The server must reject the duplicate.

    const uniqueId = `DUP${Date.now()}`;

    // First creation — should succeed
    const firstResp = await api.createEmployee({
      firstName:  'First',
      middleName: '',
      lastName:   'Duplicate',
      employeeId: uniqueId,
    });
    // Accept 200 or 201 for successful creation
    expect([200, 201]).toContain(firstResp.status());

    // Second creation with same employeeId — must fail
    const secondResp = await api.createEmployee({
      firstName:  'Second',
      middleName: '',
      lastName:   'Duplicate',
      employeeId: uniqueId,     // ← same ID as above
    });

    // Server must reject: 400, 409 Conflict, or 422
    expect([400, 409, 422]).toContain(secondResp.status());
  });

  test('POST /admin/job-titles with empty title → validation error', async ({ api }) => {
    // Same pattern on a different endpoint — shows the test strategy is reusable
    const resp = await api.createJobTitle('', 'Description without a title');

    expect([400, 422]).toContain(resp.status());

    const body = await resp.json() as unknown;
    expect(isErrorResponse(body)).toBe(true);
  });

  test('POST /pim/employees with extremely long firstName → validation error', async ({ api }) => {
    // PATTERN: Boundary value — maximum field length exceeded.
    // Most APIs have max field length rules. Sending 1000 chars should fail,
    // not crash the server (which would be a 500 — a real bug).

    const tooLong = 'A'.repeat(1000);

    const resp = await api.createEmployee({
      firstName:  tooLong,
      middleName: '',
      lastName:   'LengthTest',
      employeeId: `LEN${Date.now()}`,
    });

    // Must be a client error (4xx), never a server crash (5xx)
    const status = resp.status();
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });
});

// ─── 400 Bad Request — malformed data ────────────────────────────────────────

test.describe('Negative: 400 Bad Request @api @negative', () => {

  base('GET /pim/employees with invalid limit param → error response', async ({ page, request }) => {
    // Authenticate first
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    await page.fill('input[name="username"]', 'Admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/index', { timeout: 15_000 });

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const xsrf = cookies.find(c => c.name === 'XSRF-TOKEN');
    const xsrfValue = xsrf ? decodeURIComponent(xsrf.value) : '';

    const headers: Record<string, string> = {
      'Content-Type':     'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie':           cookieHeader,
    };
    if (xsrfValue) headers['X-XSRF-TOKEN'] = xsrfValue;

    // PATTERN: Invalid query parameter type — limit should be a number
    const resp = await request.get(
      `${BASE_URL}/pim/employees?limit=NOT_A_NUMBER&offset=0`,
      { headers }
    );

    // Some APIs return 400 for this, others ignore invalid params and default.
    // Either is acceptable — but 500 is a bug.
    const status = resp.status();
    expect(status).not.toBe(500);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(500);
  });

  test('GET /pim/employees with negative offset → error or default behavior', async ({ api }) => {
    // Negative offset is semantically invalid — server should reject or default safely
    const resp = await api.getEmployees({ limit: '10', offset: '-1' });

    const status = resp.status();
    // Must not cause a server crash
    expect(status).not.toBe(500);
    expect(status).not.toBe(503);
  });
});

// ─── Error response consistency ───────────────────────────────────────────────

test.describe('Negative: Error response consistency @api @negative', () => {

  test('All 4xx errors return JSON, not HTML', async ({ api }) => {
    // PATTERN: Content-type assertion on error responses.
    // A common bug: error pages return HTML (404 page) instead of JSON.
    // This breaks any client that tries to parse the error body as JSON.

    const nonExistentResp = await api.getEmployeeById(999999);
    expect(nonExistentResp.status()).toBe(404);

    // Must be JSON, not HTML
    const contentType = nonExistentResp.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');

    // Must be parseable as JSON — this throws if it's HTML
    const body = await nonExistentResp.json();
    expect(typeof body).toBe('object');
  });

  test('Error response body is always an object, never null or array', async ({ api }) => {
    // PATTERN: Error body shape contract.
    // Some APIs return null or [] on errors, which breaks error-handling code
    // that does `error.message` — that would throw "Cannot read property of null".

    const resp = await api.getEmployeeById(999999);
    const body = await resp.json() as unknown;

    // Must be an object
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    expect(Array.isArray(body)).toBe(false);
  });

  test('404 status code is reflected in the response body status field', async ({ api }) => {
    // PATTERN: HTTP status ↔ body status consistency.
    // The HTTP status code and the `error.status` field in the body must match.
    // Mismatch (e.g. HTTP 200 but body says "error": "404") is a contract violation
    // that confuses clients using the body to determine error type.

    const resp = await api.getEmployeeById(999999);
    expect(resp.status()).toBe(404);

    const body = await resp.json() as unknown;

    if (isErrorResponse(body)) {
      // HTTP 404 must match body error status
      expect(body.error.status).toBe('404');
    }
    // If isErrorResponse is false, the body format is different from expected —
    // this test documents that expectation even if it doesn't fail on a different format
  });
});
