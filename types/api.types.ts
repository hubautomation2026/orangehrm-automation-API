// ─────────────────────────────────────────────────────────────────────────────
// types/api.types.ts
//
// WHAT CHANGED: This file is NEW. The original project had no types at all —
// every response was typed as `any` via parseJson(). Now every API response
// and payload has an explicit shape that TypeScript enforces at compile time.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Generic API envelope ────────────────────────────────────────────────────
// OrangeHRM wraps all list responses in { data: T[], meta: Meta }.
// The generic <T> means one type works for employees, users, leave types, etc.
// Without this you'd write a separate type for every endpoint — or use `any`.

export interface OrangeHRMListResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit:  number;
    offset: number;
  };
}

// Single-resource responses wrap in { data: T } without meta.
export interface OrangeHRMSingleResponse<T> {
  data: T;
}

// ─── Domain interfaces ────────────────────────────────────────────────────────

export interface Employee {
  empNumber:   number;
  firstName:   string;
  middleName:  string;
  lastName:    string;
  employeeId:  string;
  terminationId: number | null;
}

export interface SystemUser {
  id:         number;
  userName:   string;
  status:     boolean;
  role: {
    id:          number;
    displayName: string;
  };
  employee: {
    empNumber: number;
    firstName: string;
    lastName:  string;
  } | null;
}

export interface LeaveType {
  id:           number;
  name:         string;
  situational:  boolean;
}

export interface JobTitle {
  id:          number;
  title:       string;
  description: string | null;
  isDeleted:   boolean;
}

// ─── Request payload types ────────────────────────────────────────────────────
// Omit<Employee, 'empNumber' | 'terminationId'> means "all Employee fields
// except the ones the server generates". TypeScript prevents you from sending
// empNumber in a POST body by mistake.

export type CreateEmployeePayload = Omit<Employee, 'empNumber' | 'terminationId'>;

export interface CreateUserPayload {
  userRoleId: number;
  empNumber:  number;
  status:     boolean;
  username:   string;
  password:   string;
}

// Partial<CreateUserPayload> means every field is optional — correct for PATCH.
export type UpdateUserPayload = Partial<CreateUserPayload>;

// ─── HTTP method union ────────────────────────────────────────────────────────
// Instead of loose strings, every method call is constrained to valid values.
// Passing 'GETT' anywhere this type is used is a compile-time error.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// ─── Type guard ───────────────────────────────────────────────────────────────
// Used in tests to safely narrow `unknown` JSON to a typed shape.
// "val is Employee" is a type predicate — TypeScript trusts the narrowing
// inside any if-block that calls isEmployee(val).

export function isEmployee(val: unknown): val is Employee {
  return (
    typeof val === 'object' &&
    val !== null &&
    'empNumber'  in val &&
    'firstName'  in val &&
    'lastName'   in val &&
    'employeeId' in val
  );
}

export function isSystemUser(val: unknown): val is SystemUser {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id'       in val &&
    'userName' in val &&
    'status'   in val
  );
}
