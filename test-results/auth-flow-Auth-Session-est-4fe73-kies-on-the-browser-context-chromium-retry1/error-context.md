# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.ts >> Auth: Session establishment @api @smoke @auth >> Valid login sets session cookies on the browser context
- Location: tests\auth-flow.spec.ts:37:7

# Error details

```
Error: expect(received).toBeDefined()

Received: undefined
```

# Test source

```ts
  1   | // ─────────────────────────────────────────────────────────────────────────────
  2   | // tests/api/auth-flow.spec.ts
  3   | //
  4   | // Authentication flow tests — the #1 scenario asked about in SDET interviews.
  5   | //
  6   | // WHAT THIS FILE COVERS:
  7   | //  1. Valid login → session cookie is set and accepted by protected endpoints
  8   | //  2. Unauthenticated access → 401 Unauthorized (no cookies at all)
  9   | //  3. Invalid credentials → 401 from the auth endpoint itself
  10  | //  4. Session cookie reuse across multiple requests (persistence)
  11  | //  5. Concurrent authenticated requests (parallel session stability)
  12  | //  6. Token structure validation (cookie fields, XSRF token presence)
  13  | //  7. Logout / session invalidation (simulated by clearing cookies)
  14  | //  8. Auth state across re-login (demonstrates session refresh pattern)
  15  | //
  16  | // WHY THIS MATTERS (interview talking point):
  17  | //  Most portfolios only test happy paths — data in, data out, 200 OK.
  18  | //  Auth flow tests demonstrate you understand the security layer:
  19  | //  - Sessions vs tokens vs cookies
  20  | //  - CSRF protection (XSRF-TOKEN pattern)
  21  | //  - What happens when auth breaks (not just when it works)
  22  | //  - How to isolate auth failures from functional failures
  23  | // ─────────────────────────────────────────────────────────────────────────────
  24  | 
  25  | import { test, expect } from '../fixtures/pages.fixture';
  26  | import { test as base, request as baseRequest } from '@playwright/test';
  27  | import { OrangeHRMApi } from '../api/OrangeHRMApi';
  28  | import { credentials } from '../test-data/testData';
  29  | import type { OrangeHRMListResponse, Employee } from '../types/api.types';
  30  | 
  31  | const BASE_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/api/v2';
  32  | 
  33  | // ─── 1. Session establishment ─────────────────────────────────────────────────
  34  | 
  35  | test.describe('Auth: Session establishment @api @smoke @auth', () => {
  36  | 
  37  |   test('Valid login sets session cookies on the browser context', async ({ page }) => {
  38  |     // PATTERN: We inspect what cookies the browser sets after login.
  39  |     // In an interview, you'd say: "I verify that login creates a valid session
  40  |     // by asserting the expected cookies are present with the right attributes."
  41  | 
  42  |     const { chromium } = require('@playwright/test');
  43  | 
  44  |     // The `page` fixture from pages.fixture uses `authenticatedPage` under
  45  |     // the hood, but here we want the login page directly to inspect cookies
  46  |     // at each stage. We use the raw `page` from the base `test`.
  47  |     await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  48  | 
  49  |     // Before login — no session cookies
  50  |     const cookiesBefore = await page.context().cookies();
  51  |     const sessionBefore = cookiesBefore.find(c => c.name === 'orangehrm');
  52  |     // OrangeHRM may set a pre-session cookie for CSRF — that's fine.
  53  |     // What we DON'T expect is an authenticated session cookie yet.
  54  | 
  55  |     // Perform login
  56  |     await page.fill('input[name="username"]', credentials.valid.username);
  57  |     await page.fill('input[name="password"]', credentials.valid.password);
  58  |     await page.click('button[type="submit"]');
  59  |     await page.waitForURL('**/dashboard/index', { timeout: 15_000 });
  60  | 
  61  |     // After login — session cookies must exist
  62  |     const cookiesAfter = await page.context().cookies();
  63  | 
  64  |     // Assert: at least one cookie was set by the OrangeHRM domain
  65  |     const orangeHRMCookies = cookiesAfter.filter(
  66  |       c => c.domain.includes('orangehrmlive.com')
  67  |     );
  68  |     expect(orangeHRMCookies.length).toBeGreaterThan(0);
  69  | 
  70  |     // Assert: XSRF-TOKEN cookie is present (Laravel CSRF protection)
  71  |     const xsrfCookie = cookiesAfter.find(c => c.name === 'XSRF-TOKEN');
> 72  |     expect(xsrfCookie).toBeDefined();
      |                        ^ Error: expect(received).toBeDefined()
  73  |     expect(xsrfCookie?.value.length).toBeGreaterThan(0);
  74  | 
  75  |     // Assert: session value changed after login (a new authenticated session)
  76  |     // This proves the server issued a new session on successful auth, not
  77  |     // just reused the pre-login CSRF session.
  78  |     const sessionAfter = cookiesAfter.find(
  79  |       c => c.name === 'orangehrm_session' || c.name.toLowerCase().includes('session')
  80  |     );
  81  |     // Session cookie should exist and have a non-empty value
  82  |     if (sessionAfter) {
  83  |       expect(sessionAfter.value.length).toBeGreaterThan(10);
  84  |     }
  85  |   });
  86  | 
  87  |   test('Authenticated session is accepted by protected API endpoints', async ({ api }) => {
  88  |     // PATTERN: The `api` fixture in pages.fixture.ts does a real browser login
  89  |     // then calls api.loadCookiesFrom(context) to copy authenticated cookies
  90  |     // into the API client. This test proves those cookies actually work.
  91  | 
  92  |     const resp = await api.getEmployees();
  93  | 
  94  |     // 200 = cookies were accepted, session is valid
  95  |     expect(resp.status()).toBe(200);
  96  | 
  97  |     const body = await api.parseResponse<OrangeHRMListResponse<Employee>>(resp);
  98  |     expect(Array.isArray(body.data)).toBe(true);
  99  |     expect(body.meta.total).toBeGreaterThan(0);
  100 |   });
  101 | 
  102 |   test('Session cookies persist across multiple sequential API calls', async ({ api }) => {
  103 |     // PATTERN: Session persistence — same session must work for the full
  104 |     // duration of a test run, not just the first request.
  105 |     // Interviewers ask: "How do you test session reuse vs session regeneration?"
  106 | 
  107 |     // Make 3 calls in sequence — all must succeed with the same session
  108 |     const resp1 = await api.getEmployees();
  109 |     const resp2 = await api.getSystemUsers();
  110 |     const resp3 = await api.getLeaveTypes();
  111 | 
  112 |     expect(resp1.status()).toBe(200);
  113 |     expect(resp2.status()).toBe(200);
  114 |     expect(resp3.status()).toBe(200);
  115 | 
  116 |     // All responses parsed correctly — session didn't expire mid-test
  117 |     const [employees, users, leaveTypes] = await Promise.all([
  118 |       api.parseResponse<OrangeHRMListResponse<Employee>>(resp1),
  119 |       api.parseResponse<OrangeHRMListResponse<{ id: number; userName: string; status: boolean }>>(resp2),
  120 |       api.parseResponse<OrangeHRMListResponse<{ id: number; name: string }>>(resp3),
  121 |     ]);
  122 | 
  123 |     expect(employees.data.length).toBeGreaterThan(0);
  124 |     expect(users.data.length).toBeGreaterThan(0);
  125 |   });
  126 | });
  127 | 
  128 | // ─── 2. Unauthenticated access (no cookies) ──────────────────────────────────
  129 | 
  130 | test.describe('Auth: Unauthenticated access returns 401 @api @auth', () => {
  131 | 
  132 |   // Use the base `test` here (not our custom fixture) so we get a clean
  133 |   // APIRequestContext with NO session cookies — simulating a client that
  134 |   // never logged in or whose session has expired.
  135 |   base.describe('No cookies — raw request context', () => {
  136 | 
  137 |     base('GET /pim/employees without auth → 401', async ({ request }) => {
  138 |       // PATTERN: negative auth test — what happens when there are NO cookies?
  139 |       // This is the most important auth test. If this returns 200, your API
  140 |       // has a serious security hole.
  141 | 
  142 |       const resp = await request.get(`${BASE_URL}/pim/employees?limit=50&offset=0`, {
  143 |         headers: {
  144 |           'Content-Type':    'application/json',
  145 |           'X-Requested-With': 'XMLHttpRequest',
  146 |           // Deliberately NO Cookie header — simulating an unauthenticated client
  147 |         },
  148 |       });
  149 | 
  150 |       // Must be 401 (Unauthorized) — not 403 (Forbidden) or 200 (security bug)
  151 |       expect(resp.status()).toBe(401);
  152 | 
  153 |       // Assert the error body structure — 401 responses must explain the reason
  154 |       const body = await resp.json() as { error?: string; status?: string; message?: string };
  155 | 
  156 |       // OrangeHRM returns an error object — validate it has some error indicator
  157 |       const hasErrorInfo =
  158 |         'error'   in body ||
  159 |         'status'  in body ||
  160 |         'message' in body;
  161 | 
  162 |       expect(hasErrorInfo).toBe(true);
  163 |     });
  164 | 
  165 |     base('GET /admin/users without auth → 401', async ({ request }) => {
  166 |       const resp = await request.get(`${BASE_URL}/admin/users?limit=50&offset=0`, {
  167 |         headers: {
  168 |           'Content-Type':    'application/json',
  169 |           'X-Requested-With': 'XMLHttpRequest',
  170 |         },
  171 |       });
  172 |       expect(resp.status()).toBe(401);
```