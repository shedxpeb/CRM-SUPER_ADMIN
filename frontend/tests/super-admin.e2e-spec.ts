import { test, expect } from '@playwright/test';

const UI = 'http://localhost:3001';
const EMAIL = 'admin@pebcrm.com';
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
if (!PASSWORD) throw new Error('SUPER_ADMIN_PASSWORD env is required for e2e tests');

test.describe('SUPER-ADMIN Real User Flow', () => {

  // ── 1. REDIRECT TO LOGIN ────────────────────────────
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto(`${UI}/super-admin`);
    await page.waitForURL('**/login');
    await expect(page.locator('h2, h1').first()).toBeVisible();
  });

  // ── 2. LOGIN PAGE LOADS ─────────────────────────────
  test('login page shows email and password fields', async ({ page }) => {
    await page.goto(`${UI}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  // ── 3. LOGIN WITH WRONG CREDENTIALS ─────────────────
  test('wrong credentials show error message', async ({ page }) => {
    await page.goto(`${UI}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid|error|failed|incorrect/i')).toBeVisible({ timeout: 10000 });
  });

  // ── 4. LOGIN SUCCESSFULLY ───────────────────────────
  test('real user can login and see the super admin dashboard', async ({ page }) => {
    await page.goto(`${UI}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // After login user should land on /super-admin
    await page.waitForURL('**/super-admin', { timeout: 15000 });
    await expect(page.locator('body')).toBeVisible();
  });

  // ── 5. DASHBOARD HAS KEY SECTIONS ───────────────────
  test('dashboard shows stats and charts', async ({ page }) => {
    await page.goto(`${UI}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/super-admin', { timeout: 15000 });

    // Dashboard should show summary cards
    await expect(page.locator('text=/total|companies|users|revenue|active/i').first()).toBeVisible({ timeout: 10000 });
  });

  // ── 6. NAVIGATE TO TENANTS ─────────────────────────
  test('navigate to Tenants page', async ({ page }) => {
    await page.goto(`${UI}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/super-admin', { timeout: 15000 });

    // Click on Tenants in sidebar
    await page.click('text=/tenants|companies|organizations/i');
    await page.waitForURL('**/tenants', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  // ── 7. NAVIGATE TO USERS ────────────────────────────
  test('navigate to Users management page', async ({ page }) => {
    await page.goto(`${UI}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/super-admin', { timeout: 15000 });

    await page.click('text=/users|team/i');
    await page.waitForURL('**/users', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  // ── 8. NAVIGATE TO AUDIT LOGS ───────────────────────
  test('navigate to Audit Logs page', async ({ page }) => {
    await page.goto(`${UI}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/super-admin', { timeout: 15000 });

    await page.click('text=/audit|logs|activity/i');
    await page.waitForURL('**/audit-logs', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  // ── 9. NAVIGATE TO SETTINGS ─────────────────────────
  test('navigate to Settings page', async ({ page }) => {
    await page.goto(`${UI}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/super-admin', { timeout: 15000 });

    await page.click('text=/settings|configuration/i');
    await page.waitForURL('**/settings', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
  });

  // ── 10. LOGOUT ──────────────────────────────────────
  test('real user can logout', async ({ page }) => {
    await page.goto(`${UI}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/super-admin', { timeout: 15000 });

    // Click logout button
    await page.click('text=/logout|log out|sign out/i');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  // ── 11. PROTECTED ROUTE AFTER LOGOUT ────────────────
  test('after logout, user is redirected to login', async ({ page }) => {
    // Clear session and try accessing protected page
    await page.goto(`${UI}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/super-admin', { timeout: 15000 });

    await page.click('text=/logout|log out|sign out/i');
    await page.waitForURL('**/login', { timeout: 10000 });

    // Try accessing protected route
    await page.goto(`${UI}/super-admin`);
    await page.waitForURL('**/login', { timeout: 10000 });
  });

});
