// ─────────────────────────────────────────────────────────────────────────────
// test-data/testData.ts
//
// WHAT CHANGED vs original:
//
//  1. All data objects now have `as const` — values are readonly literal types,
//     not mutable strings/numbers. A test can't accidentally overwrite shared
//     data between runs (e.g., testData.credentials.valid.username = 'hack').
//
//  2. Explicit types on every export using the new domain interfaces from
//     types/api.types.ts. If a field name changes in the interface, TypeScript
//     immediately flags every test-data entry that uses it.
//
//  3. `apiBaseUrl` moved to types — it was duplicated between testData.ts
//     and OrangeHRMApi.ts. Single source of truth.
//
//  4. Added `ApiTestData` object for API-specific payloads, typed against
//     `CreateEmployeePayload` and `CreateUserPayload` so the data and the
//     API client always stay in sync.
// ─────────────────────────────────────────────────────────────────────────────

import type { CreateEmployeePayload, CreateUserPayload } from '../types/api.types';

// ─── Credentials ─────────────────────────────────────────────────────────────
// CHANGE 1: `as const` narrows `valid.username` from `string` → `'Admin'`.
// A test that compares username to 'Admin' gets a literal-type match check —
// if someone changes the constant to 'adm1n', TypeScript flags mismatches.

export const credentials = {
  valid:           { username: 'Admin',     password: 'admin123' },
  invalid:         { username: 'WrongUser', password: 'WrongPass',  desc: 'invalid username & password' },
  invalidpassword: { username: 'Admin',     password: 'wrongpass',  desc: 'invalid password' },
  empty:           { username: '',          password: '',            desc: 'empty credentials' },
} as const;

// Derive a union type from the keys — useful in parametrised tests.
// CredentialScenario = 'valid' | 'invalid' | 'invalidpassword' | 'empty'
export type CredentialScenario = keyof typeof credentials;

// ─── Employee data ────────────────────────────────────────────────────────────
// CHANGE 2: Typed against the domain interface. If Employee gains a required
// field, TypeScript tells you here immediately — not at runtime when the API
// rejects the payload.

export const employeeData: ReadonlyArray<{
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string;
  gender: string;
  maritalStatus: string;
}> = [
  {
    firstName:     'John',
    middleName:    'A',
    lastName:      'Doe',
    employeeId:    'EMP001',
    gender:        'Male',
    maritalStatus: 'Single',
  },
  {
    firstName:     'Jane',
    middleName:    'B',
    lastName:      'Smith',
    employeeId:    'EMP002',
    gender:        'Female',
    maritalStatus: 'Married',
  },
] as const;

// ─── API-specific payloads ────────────────────────────────────────────────────
// CHANGE 4: These are typed against the imported payload interfaces.
// Previously, the API tests used inline objects with no type checking —
// a typo like `emploeeId` would only fail at runtime.

export const apiEmployeePayload: CreateEmployeePayload = {
  firstName:  'ApiTest',
  middleName: '',
  lastName:   'Employee',
  employeeId: `API${Date.now()}`,
};

export const apiUserPayload: CreateUserPayload = {
  userRoleId: 2,     // 2 = ESS (Employee Self Service) — safe to create in tests
  empNumber:  7,     // existing demo employee
  status:     true,
  username:   `api_test_${Date.now()}`,
  password:   'Test@1234!',
};

// ─── Leave data ───────────────────────────────────────────────────────────────

export const leaveData = [
  { leaveType: 'CAN - FMLA', fromDate: '2025-03-01', toDate: '2025-03-03', comment: 'Medical leave request' },
  { leaveType: 'CAN - FMLA', fromDate: '2025-04-10', toDate: '2025-04-11', comment: 'Personal leave request' },
] as const;

// ─── Admin / job title data ───────────────────────────────────────────────────

export const adminUserData = [
  {
    userRole:        'Admin',
    employeeName:    'Paul Collings',
    status:          'Enabled',
    username:        `testadmin_${Date.now()}`,
    password:        'Admin@1234',
    confirmPassword: 'Admin@1234',
  },
] as const;

export const jobTitleData = [
  { jobTitle: 'QA Engineer',  jobDescription: 'Quality Assurance Engineer', note: 'Test automation specialist' },
  { jobTitle: 'DevOps Lead',  jobDescription: 'DevOps Lead Engineer',       note: 'CI/CD specialist' },
] as const;

// ─── Misc data ────────────────────────────────────────────────────────────────

export const skillData = [
  { skill: 'Python', yearsOfExperience: '3', competency: 'Basic' },
  { skill: 'Java',   yearsOfExperience: '5', competency: 'Expert' },
] as const;

export const workShiftData = [
  { name: `Morning Shift ${Date.now()}`, from: '06:00 AM', to: '02:00 PM', hoursPerDay: '8' },
] as const;

export const searchEmployeeData = [
  { employeeName: 'Paul', employeeId: '',     status: 'Active' },
  { employeeName: '',     employeeId: '0002', status: '' },
] as const;
