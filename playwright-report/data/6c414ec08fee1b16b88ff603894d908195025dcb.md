# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.ts >> Auth: Re-authentication flow @api @auth >> Re-login after session clear restores API access
- Location: tests\auth-flow.spec.ts:357:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Test source

```ts
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
  302 |     expect(leaveResp.status()).toBe(200);
  303 |     expect(jobResp.status()).toBe(200);
  304 |   });
  305 | });
  306 | 
  307 | // ─── 5. Session invalidation (logout simulation) ─────────────────────────────
  308 | 
  309 | test.describe('Auth: Session invalidation @api @auth', () => {
  310 | 
  311 |   base('Clearing cookies makes protected endpoints return 401', async ({ page, request }) => {
  312 |     // PATTERN: Simulated session expiry.
  313 |     // Real session expiry is time-based and hard to test, but we can simulate
  314 |     // it by clearing cookies — equivalent to the session being invalidated
  315 |     // server-side and the client sending a stale/empty cookie jar.
  316 |     //
  317 |     // Interview answer: "I simulate token/session expiry by clearing the
  318 |     // auth state and asserting the server correctly rejects the next request."
  319 | 
  320 |     // Step 1: Login via browser to establish session
  321 |     await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  322 |     await page.fill('input[name="username"]', credentials.valid.username);
  323 |     await page.fill('input[name="password"]', credentials.valid.password);
  324 |     await page.click('button[type="submit"]');
  325 |     await page.waitForURL('**/dashboard/index', { timeout: 15_000 });
  326 | 
  327 |     // Step 2: Verify session works (sanity check before we invalidate it)
  328 |     const cookiesBeforeClear = await page.context().cookies();
  329 |     const xsrfBefore = cookiesBeforeClear.find(c => c.name === 'XSRF-TOKEN');
  330 |     expect(xsrfBefore).toBeDefined();
  331 | 
  332 |     // Step 3: Clear all cookies (simulate session expiry / logout)
  333 |     await page.context().clearCookies();
  334 | 
  335 |     const cookiesAfterClear = await page.context().cookies();
  336 |     expect(cookiesAfterClear.length).toBe(0);
  337 | 
  338 |     // Step 4: API call with cleared cookies (no auth) → must get 401
  339 |     // We use the raw `request` context here — it was never authenticated
  340 |     const resp = await request.get(`${BASE_URL}/pim/employees?limit=10&offset=0`, {
  341 |       headers: {
  342 |         'Content-Type':    'application/json',
  343 |         'X-Requested-With': 'XMLHttpRequest',
  344 |         // No Cookie header — cleared state
  345 |       },
  346 |     });
  347 | 
  348 |     // Server must reject the request — session is gone
  349 |     expect(resp.status()).toBe(401);
  350 |   });
  351 | });
  352 | 
  353 | // ─── 6. Session refresh (re-login after expiry) ───────────────────────────────
  354 | 
  355 | test.describe('Auth: Re-authentication flow @api @auth', () => {
  356 | 
  357 |   base('Re-login after session clear restores API access', async ({ page, request }) => {
  358 |     // PATTERN: Session refresh / re-authentication.
  359 |     // This is the "token refresh" pattern for cookie-based auth:
  360 |     //  - Session expires (simulated by clearing cookies)
  361 |     //  - Client re-authenticates (new login)
  362 |     //  - Protected endpoints work again with the new session
  363 |     //
  364 |     // For JWT-based systems, this maps to: access token expires →
  365 |     // use refresh token → get new access token → retry original request.
  366 | 
  367 |     // Step 1: First login
  368 |     await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  369 |     await page.fill('input[name="username"]', credentials.valid.username);
  370 |     await page.fill('input[name="password"]', credentials.valid.password);
  371 |     await page.click('button[type="submit"]');
  372 |     await page.waitForURL('**/dashboard/index', { timeout: 15_000 });
  373 | 
  374 |     const session1 = await page.context().cookies();
  375 |     const xsrf1 = session1.find(c => c.name === 'XSRF-TOKEN')?.value ?? '';
> 376 |     expect(xsrf1.length).toBeGreaterThan(0);
      |                          ^ Error: expect(received).toBeGreaterThan(expected)
  377 | 
  378 |     // Step 2: Simulate expiry
  379 |     await page.context().clearCookies();
  380 | 
  381 |     // Step 3: Re-login (session refresh)
  382 |     await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  383 |     await page.fill('input[name="username"]', credentials.valid.username);
  384 |     await page.fill('input[name="password"]', credentials.valid.password);
  385 |     await page.click('button[type="submit"]');
  386 |     await page.waitForURL('**/dashboard/index', { timeout: 15_000 });
  387 | 
  388 |     const session2 = await page.context().cookies();
  389 |     const xsrf2 = session2.find(c => c.name === 'XSRF-TOKEN')?.value ?? '';
  390 |     expect(xsrf2.length).toBeGreaterThan(0);
  391 | 
  392 |     // Step 4: New session tokens work for API calls
  393 |     // Reconstruct OrangeHRMApi with the refreshed session
  394 |     const freshRequest = await baseRequest.newContext();
  395 |     const freshApi = new OrangeHRMApi(freshRequest);
  396 |     await freshApi.loadCookiesFrom(page.context());
  397 | 
  398 |     const resp = await freshApi.getEmployees();
  399 |     expect(resp.status()).toBe(200);
  400 | 
  401 |     await freshRequest.dispose();
  402 |   });
  403 | });
  404 | 
```