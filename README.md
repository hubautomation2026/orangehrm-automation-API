# OrangeHRM Playwright Test Automation

> Full automation framework for [OrangeHRM Demo](https://opensource-demo.orangehrmlive.com) using **Playwright + TypeScript** with **POM**, **API Testing**, and **Data-Driven** approach.

---

## 🏗️ Project Structure

```
orangehrm-automation/
├── api/
│   └── OrangeHRMApi.ts          # API helper (REST calls to /api/v2)
├── fixtures/
│   └── fixtures.ts              # Playwright custom fixtures (shared login state)
├── pages/                       # Page Object Models (POM)
│   ├── BasePage.ts              # Base class with shared utilities
│   ├── LoginPage.ts             # Page 1: Login
│   ├── DashboardPage.ts         # Page 2: Dashboard
│   ├── PIMPage.ts               # Page 3: Employee Management
│   ├── LeavePage.ts             # Page 4: Leave Management
│   ├── AdminPage.ts             # Page 5: Admin / User Management
│   ├── MyInfoPage.ts            # Page 6: My Info
│   ├── RecruitmentPage.ts       # Page 7: Recruitment
│   └── DirectoryPage.ts         # Page 8: Directory
├── test-data/
│   └── testData.ts              # All test data (data-driven)
├── tests/
│   ├── 01-login.spec.ts         # Login page tests
│   ├── 02-dashboard.spec.ts     # Dashboard tests
│   ├── 03-pim.spec.ts           # PIM tests
│   ├── 04-leave.spec.ts         # Leave tests
│   ├── 05-admin.spec.ts         # Admin tests
│   ├── 06-myinfo.spec.ts        # My Info tests
│   ├── 07-recruitment.spec.ts   # Recruitment tests
│   └── 08-directory.spec.ts     # Directory tests
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+

### Install

```bash
npm install
npx playwright install chromium
```

### Run All Tests

```bash
npm test
```

### Run Individual Pages

```bash
npm run test:login
npm run test:dashboard
npm run test:pim
npm run test:leave
npm run test:admin
npm run test:myinfo
npm run test:recruitment
npm run test:directory
```

### View HTML Report

```bash
npm run test:report
```

---

## 🏛️ Architecture

### 1. Page Object Model (POM)

Each page extends `BasePage` which provides shared utilities:
- `fillInput()`, `clickElement()`, `selectDropdownOption()`, `selectAutoCompleteOption()`
- `assertToastMessage()`, `assertPageHeader()`
- `waitForPageLoad()`, `navigate()`

```typescript
// Usage example
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login('Admin', 'admin123');
await loginPage.assertLoggedIn();
```

### 2. Custom Fixtures (`fixtures/fixtures.ts`)

Provides pre-authenticated page objects to every test — no repeated login boilerplate:

```typescript
test('Dashboard loads', async ({ dashboardPage }) => {
  // dashboardPage is already logged in!
  await dashboardPage.assertDashboardLoaded();
});
```

### 3. Data-Driven Testing (`test-data/testData.ts`)

All test data is centralized and used in loops:

```typescript
for (const emp of employeeData) {
  test(`Add employee: ${emp.firstName}`, async ({ pimPage }) => {
    await pimPage.addEmployee(emp.firstName, emp.middleName, emp.lastName);
  });
}
```

### 4. API Testing (`api/OrangeHRMApi.ts`)

Direct REST API calls via Playwright's `APIRequestContext`:

```typescript
test('API: Get employees', async ({ api }) => {
  const resp = await api.getEmployees();
  await api.assertStatus(resp, 200);
  const body = await api.parseJson(resp);
  expect(body.data).toBeDefined();
});
```

---

## 📋 Test Coverage

| # | Page              | UI Tests | API Tests | Data-Driven |
|---|-------------------|----------|-----------|-------------|
| 1 | Login             | 6        | -         | ✅ (3 invalid cred sets)  |
| 2 | Dashboard         | 8        | -         | -           |
| 3 | PIM (Employees)   | 6        | 2         | ✅ (employees + search)   |
| 4 | Leave             | 6        | 3         | ✅ (leave data)           |
| 5 | Admin             | 9        | 3         | ✅ (job titles + users)   |
| 6 | My Info           | 9        | -         | ✅ (skills)               |
| 7 | Recruitment       | 10       | -         | ✅ (vacancy data)         |
| 8 | Directory         | 10       | -         | ✅ (name + job title)     |

---

## 🔐 Credentials

| Field    | Value      |
|----------|------------|
| Username | `Admin`    |
| Password | `admin123` |
| URL      | https://opensource-demo.orangehrmlive.com/web/index.php/auth/login |
