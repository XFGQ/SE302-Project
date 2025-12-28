// tests/smoke/smoke.spec.js
const { test, expect } = require('@playwright/test');
const { HomePage } = require('../../pages/home.page');

test.describe('OLX Smoke Testing Suite', () => {
  let homePage;

  // Initialization before each test case to ensure a clean state
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigate();
  });

  // TC-01: Verify site logo visibility
  test('Should verify that the site logo is visible on the home page', async () => {
    await expect(homePage.logo).toBeVisible(); // Assertion for execution evidence [cite: 22]
  });

  // TC-02: Check presence of the search bar
  test('Should verify that the search input field is present', async () => {
    await expect(homePage.searchInput).toBeVisible();
  });

  // TC-03: Validate category menu availability
  test('Should verify that the Categories button is accessible', async () => {
    await expect(homePage.categoriesBtn).toBeVisible();
  });

  // TC-04: Check login button visibility
  test('Should verify that the Login (Prijavi se) button is visible', async () => {
    await expect(homePage.loginBtn).toBeVisible();
  });

  // TC-05: Test navigation to login page
  test('Should navigate to the login page when the login button is clicked', async ({ page }) => {
    await homePage.loginBtn.click();
    // Validating URL redirection as part of functional smoke test [cite: 40]
    await expect(page).toHaveURL(/.*login/);
  });
});