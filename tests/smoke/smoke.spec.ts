import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';

test.describe('OLX.ba - Mandatory Smoke Testing Suite', () => {
    let homePage: HomePage;

    // Hook: Setup before each of the 5 smoke tests 
    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.navigate();
        await homePage.handleCookies(); // Always clear cookie overlay first
    });

    // TC-01: Verify Page Title
    test('Should verify the home page title contains OLX.ba', async ({ page }) => {
        await expect(page).toHaveTitle(/OLX.ba/);
    });

    // TC-02: Search Input Interactivity
    test('Should verify that the search input is visible and enabled', async () => {
        await expect(homePage.searchInput).toBeVisible();
        await expect(homePage.searchInput).toBeEnabled();
    });

    // TC-03: Login Link Presence
    test('Should verify the presence of the Login (Prijava) link', async () => {
        await expect(homePage.loginBtn).toBeVisible();
    });

    // TC-04: Categories Menu Availability
    test('Should verify the Categories (Kategorije) menu is accessible', async () => {
        await expect(homePage.categoriesBtn).toBeAttached();
    });

    // TC-05: Footer/Page Completion Check
    test('Should verify that the footer is loaded at the bottom of the page', async () => {
        await expect(homePage.footer).toBeVisible();
    });
});