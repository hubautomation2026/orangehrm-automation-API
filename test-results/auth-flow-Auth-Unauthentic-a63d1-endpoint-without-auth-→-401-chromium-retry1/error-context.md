# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.ts >> Auth: Unauthenticated access returns 401 @api @auth >> No cookies — raw request context >> DELETE endpoint without auth → 401
- Location: tests\auth-flow.spec.ts:194:9

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 405
Received array: [401, 403]
```

# Test source

```ts
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
  173 |     });
  174 | 
  175 |     base('POST /pim/employees without auth → 401', async ({ request }) => {
  176 |       // Mutation endpoints are even more critical — a 200 here would mean
  177 |       // anyone can create employees without authentication.
  178 |       const resp = await request.post(`${BASE_URL}/pim/employees`, {
  179 |         headers: {
  180 |           'Content-Type':    'application/json',
  181 |           'X-Requested-With': 'XMLHttpRequest',
  182 |         },
  183 |         data: {
  184 |           firstName:  'NoAuth',
  185 |           middleName: '',
  186 |           lastName:   'Test',
  187 |           employeeId: 'NOAUTH001',
  188 |         },
  189 |       });
  190 |       // Must reject unauthenticated POSTs
  191 |       expect([401, 403]).toContain(resp.status());
  192 |     });
  193 | 
  194 |     base('DELETE endpoint without auth → 401', async ({ request }) => {
  195 |       const resp = await request.delete(`${BASE_URL}/admin/users/1`, {
  196 |         headers: {
  197 |           'Content-Type':    'application/json',
  198 |           'X-Requested-With': 'XMLHttpRequest',
  199 |         },
  200 |       });
> 201 |       expect([401, 403]).toContain(resp.status());
      |                          ^ Error: expect(received).toContain(expected) // indexOf
  202 |     });
  203 |   });
  204 | });
  205 | 
  206 | // ─── 3. Invalid credentials at login ─────────────────────────────────────────
  207 | 
  208 | test.describe('Auth: Invalid credential scenarios @api @auth', () => {
  209 | 
  210 |   base('Wrong username + wrong password → login fails', async ({ page }) => {
  211 |     // PATTERN: End-to-end auth failure test.
  212 |     // We don't just call the API — we test the full login flow fails correctly.
  213 | 
  214 |     await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  215 |     await page.fill('input[name="username"]', credentials.invalid.username);
  216 |     await page.fill('input[name="password"]', credentials.invalid.password);
  217 |     await page.click('button[type="submit"]');
  218 | 
  219 |     // Should NOT navigate to dashboard
  220 |     await page.waitForTimeout(2_000);
  221 |     expect(page.url()).not.toContain('/dashboard');
  222 | 
  223 |     // Should show error message
  224 |     const errorMsg = page.locator('.oxd-alert-content-text, .orangehrm-login-error');
  225 |     const genericError = page.locator('text=Invalid credentials');
  226 |     const hasError = (await errorMsg.count()) > 0 || (await genericError.count()) > 0;
  227 | 
  228 |     // URL still on login page confirms authentication was rejected
  229 |     expect(page.url()).toContain('/auth/login');
  230 |   });
  231 | 
  232 |   base('Correct username + wrong password → login fails', async ({ page }) => {
  233 |     await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  234 |     await page.fill('input[name="username"]', credentials.invalidpassword.username);
  235 |     await page.fill('input[name="password"]', credentials.invalidpassword.password);
  236 |     await page.click('button[type="submit"]');
  237 | 
  238 |     await page.waitForTimeout(2_000);
  239 |     expect(page.url()).not.toContain('/dashboard');
  240 |     expect(page.url()).toContain('/auth/login');
  241 |   });
  242 | 
  243 |   base('Empty credentials → login fails', async ({ page }) => {
  244 |     await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  245 |     await page.click('button[type="submit"]');
  246 | 
  247 |     // With empty inputs, the page should stay on login
  248 |     await page.waitForTimeout(1_000);
  249 |     expect(page.url()).not.toContain('/dashboard');
  250 | 
  251 |     // Validation messages should appear for required fields
  252 |     const requiredMsg = page.locator('text=Required');
  253 |     const hasRequired = (await requiredMsg.count()) > 0;
  254 |     // Even if validation message doesn't appear, we're still on login page
  255 |     expect(page.url()).toContain('/auth/login');
  256 |   });
  257 | });
  258 | 
  259 | // ─── 4. Concurrent authenticated requests ────────────────────────────────────
  260 | 
  261 | test.describe('Auth: Concurrent session stability @api @auth', () => {
  262 | 
  263 |   test('5 parallel requests with same session all succeed', async ({ api }) => {
  264 |     // PATTERN: Concurrent auth test.
  265 |     // Interview question: "How do you verify a session handles concurrent requests?"
  266 |     // Answer: fire multiple requests simultaneously and assert all succeed.
  267 |     //
  268 |     // This catches race conditions in session validation middleware —
  269 |     // some servers accidentally invalidate sessions under concurrent load.
  270 | 
  271 |     const requests = Array.from({ length: 5 }, () => api.getEmployees());
  272 |     const responses = await Promise.all(requests);
  273 | 
  274 |     for (const resp of responses) {
  275 |       expect(resp.status()).toBe(200);
  276 |     }
  277 | 
  278 |     // Parse all responses — each must be well-formed
  279 |     const bodies = await Promise.all(
  280 |       responses.map(r => api.parseResponse<OrangeHRMListResponse<Employee>>(r))
  281 |     );
  282 | 
  283 |     for (const body of bodies) {
  284 |       expect(Array.isArray(body.data)).toBe(true);
  285 |       expect(body.meta.total).toBeGreaterThan(0);
  286 |     }
  287 |   });
  288 | 
  289 |   test('Mixed endpoint parallel requests all succeed', async ({ api }) => {
  290 |     // Realistic scenario: a dashboard loads employees, users, and leave types
  291 |     // simultaneously. The session must be valid for all three at once.
  292 | 
  293 |     const [empResp, userResp, leaveResp, jobResp] = await Promise.all([
  294 |       api.getEmployees(),
  295 |       api.getSystemUsers(),
  296 |       api.getLeaveTypes(),
  297 |       api.getJobTitles(),
  298 |     ]);
  299 | 
  300 |     expect(empResp.status()).toBe(200);
  301 |     expect(userResp.status()).toBe(200);
```