// ─────────────────────────────────────────────────────────────────────────────
// tests/api/orangehrm.api.spec.ts
//
// WHAT'S NEW: This file didn't exist. The original project had API calls
// scattered inside UI spec files (TC07, TC08 in 03-pim.spec.ts etc.) but
// no dedicated API test suite.
//
// This file demonstrates:
//  - Typed response parsing with parseResponse<T>()
//  - Schema validation using isEmployee() / isSystemUser() type guards
//  - Discriminated union for ApiResult (success vs failure)
//  - Parallel API calls with Promise.all()
//  - API setup → assertion pattern (no UI needed)
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '../../fixtures/pages.fixture';
import { apiEmployeePayload, apiUserPayload } from '../../test-data/testData';
import { isEmployee, isSystemUser } from '../../types/api.types';
import type {
  OrangeHRMListResponse,
  OrangeHRMSingleResponse,
  Employee,
  SystemUser,
  LeaveType,
  JobTitle,
} from '../../types/api.types';

// ─── Employees ────────────────────────────────────────────────────────────────

test.describe('Employees API @api @smoke', () => {

  test('GET /pim/employees — returns 200 with data array', async ({ api }) => {
    const resp = await api.getEmployees();

    // PATTERN: assertStatus is now synchronous — no `await` needed.
    // If you see `await api.assertStatus()` in old code it still works,
    // but the await is unnecessary. New code omits it.
    api.assertStatus(resp, 200);

    // PATTERN: parseResponse<T>() — T tells TypeScript the expected shape.
    // body.data is Employee[], body.meta.total is number.
    // Without the generic, you'd get `any` and lose all type checking.
    const body = await api.parseResponse<OrangeHRMListResponse<Employee>>(resp);

    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.meta.total).toBe('number');
    expect(body.meta.total).toBeGreaterThan(0);
  });

  test('GET /pim/employees — each employee has required fields', async ({ api }) => {
    const resp = await api.getEmployees();
    const body = await api.parseResponse<OrangeHRMListResponse<Employee>>(resp);

    // PATTERN: Schema validation with type guard.
    // isEmployee() is a type predicate — inside this block TypeScript knows
    // emp is Employee, so emp.firstName, emp.empNumber etc. are all safe.
    for (const emp of body.data) {
      expect(isEmployee(emp)).toBe(true);

      if (isEmployee(emp)) {
        expect(typeof emp.empNumber).toBe('number');
        expect(typeof emp.firstName).toBe('string');
        expect(typeof emp.lastName).toBe('string');
        expect(emp.firstName.length).toBeGreaterThan(0);
      }
    }
  });

  test('GET /pim/employees/:id — returns single employee', async ({ api }) => {
    // First get the list to find a valid empNumber
    const listResp = await api.getEmployees();
    const listBody = await api.parseResponse<OrangeHRMListResponse<Employee>>(listResp);

    expect(listBody.data.length).toBeGreaterThan(0);

    const firstEmpNumber = listBody.data[0].empNumber;
    const singleResp = await api.getEmployeeById(firstEmpNumber);

    api.assertStatus(singleResp, 200);

    const singleBody = await api.parseResponse<OrangeHRMSingleResponse<Employee>>(singleResp);
    expect(singleBody.data.empNumber).toBe(firstEmpNumber);
    expect(typeof singleBody.data.firstName).toBe('string');
  });

  test('POST /pim/employees — creates employee with typed payload', async ({ api }) => {
    // PATTERN: apiEmployeePayload is typed as CreateEmployeePayload.
    // TypeScript catches wrong field names at compile time, not at runtime.
    const resp = await api.createEmployee(apiEmployeePayload);

    // OrangeHRM demo returns 200 for creates (not 201)
    expect([200, 201]).toContain(resp.status());

    const body = await api.parseResponse<OrangeHRMSingleResponse<Employee>>(resp);
    expect(body.data.firstName).toBe(apiEmployeePayload.firstName);
    expect(body.data.lastName).toBe(apiEmployeePayload.lastName);
    expect(typeof body.data.empNumber).toBe('number');
  });
});

// ─── System Users ─────────────────────────────────────────────────────────────

test.describe('System Users API @api', () => {

  test('GET /admin/users — returns 200 with typed users', async ({ api }) => {
    const resp = await api.getSystemUsers();

    api.assertStatus(resp, 200);

    const body = await api.parseResponse<OrangeHRMListResponse<SystemUser>>(resp);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('GET /admin/users — validates schema with type guard', async ({ api }) => {
    const resp = await api.getSystemUsers();
    const body = await api.parseResponse<OrangeHRMListResponse<SystemUser>>(resp);

    // PATTERN: Type guard narrows `unknown` → `SystemUser` safely.
    // This is the correct answer when asked "how do you validate API response shape"
    // in an interview: type guards, not casting with `as`.
    for (const user of body.data) {
      expect(isSystemUser(user)).toBe(true);

      if (isSystemUser(user)) {
        expect(typeof user.id).toBe('number');
        expect(typeof user.userName).toBe('string');
        expect(typeof user.status).toBe('boolean');
      }
    }
  });

  test('Admin user exists in system users', async ({ api }) => {
    const resp = await api.getSystemUsers();
    const body = await api.parseResponse<OrangeHRMListResponse<SystemUser>>(resp);

    // Find admin — TypeScript knows user is SystemUser here, so user.userName is safe
    const adminUser = body.data.find(user => user.userName === 'Admin');
    expect(adminUser).toBeDefined();
    expect(adminUser?.status).toBe(true);
  });
});

// ─── Leave Types ──────────────────────────────────────────────────────────────

test.describe('Leave Types API @api @smoke', () => {

  test('GET /leave/leave-types — returns data array', async ({ api }) => {
    const resp = await api.getLeaveTypes();

    api.assertStatus(resp, 200);

    const body = await api.parseResponse<OrangeHRMListResponse<LeaveType>>(resp);
    expect(Array.isArray(body.data)).toBe(true);

    if (body.data.length > 0) {
      const first = body.data[0];
      expect(typeof first.id).toBe('number');
      expect(typeof first.name).toBe('string');
      expect(typeof first.situational).toBe('boolean');
    }
  });
});

// ─── Job Titles ───────────────────────────────────────────────────────────────

test.describe('Job Titles API @api', () => {

  test('GET /admin/job-titles — returns 200 with typed data', async ({ api }) => {
    const resp = await api.getJobTitles();

    api.assertStatus(resp, 200);

    const body = await api.parseResponse<OrangeHRMListResponse<JobTitle>>(resp);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

// ─── Parallel requests ────────────────────────────────────────────────────────

test.describe('Parallel API calls @api', () => {

  test('Fetch employees and users simultaneously', async ({ api }) => {
    // PATTERN: Promise.all() runs both requests at the same time — ~2x faster
    // than sequential. Both are typed correctly: [employees, users] are
    // inferred from what you pass to parseResponse<T>() on each.
    const [empResp, userResp] = await Promise.all([
      api.getEmployees(),
      api.getSystemUsers(),
    ]);

    api.assertStatus(empResp,  200);
    api.assertStatus(userResp, 200);

    const [employees, users] = await Promise.all([
      api.parseResponse<OrangeHRMListResponse<Employee>>(empResp),
      api.parseResponse<OrangeHRMListResponse<SystemUser>>(userResp),
    ]);

    expect(employees.data.length).toBeGreaterThan(0);
    expect(users.data.length).toBeGreaterThan(0);

    // Cross-validate: every system user's empNumber should map to a real employee
    // (This is the kind of backend validation assertion interviewers love to see)
    const empNumbers = new Set(employees.data.map(e => e.empNumber));
    for (const user of users.data) {
      if (user.employee !== null) {
        expect(empNumbers.has(user.employee.empNumber)).toBe(true);
      }
    }
  });
});

// ─── Discriminated union result pattern ───────────────────────────────────────

test.describe('Error handling pattern @api', () => {

  test('GET non-existent employee returns 404', async ({ api }) => {
    // PATTERN: discriminated union + narrowing.
    // ApiResult is either { success: true, data: Employee }
    //                  or { success: false, error: string }
    // TypeScript knows which branch you're in based on the `success` flag.

    type ApiResult =
      | { success: true;  data: Employee }
      | { success: false; error: string  };

    async function safeGetEmployee(empNumber: number): Promise<ApiResult> {
      const resp = await api.getEmployeeById(empNumber);
      if (resp.status() === 200) {
        const body = await api.parseResponse<OrangeHRMSingleResponse<Employee>>(resp);
        return { success: true, data: body.data };
      }
      return { success: false, error: `HTTP ${resp.status()}` };
    }

    const result = await safeGetEmployee(999999);

    // TypeScript knows: if !result.success then result.error exists
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('404');
    }
  });
});
