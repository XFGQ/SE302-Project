import { expect, test } from "@playwright/test";
import { HomePage } from "../../pages/HomePage_Smoke";

test.describe("OLX.ba - Smoke Testing Suite", () => {
	let homePage: HomePage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		await homePage.navigate();
		await homePage.handleCookies();
	});

	// TC-01: Page Title Verification
	test("Should verify that the home page title contains OLX.ba", async ({
		page,
	}) => {
		await expect(page).toHaveTitle(/OLX.ba/);
	});

	// TC-02: Search Input Presence
	test("Should verify the search input is visible and enabled", async () => {
		await expect(homePage.searchInput).toBeVisible();
		await expect(homePage.searchInput).toBeEnabled();
	});

	// TC-03: Login Button Visibility
	test("Should verify the login button is present", async () => {
		await expect(homePage.loginBtn).toBeVisible();
	});

	// TC-04: Categories Menu Accessibility
	test("Should verify the Categories link is accessible", async () => {
		await expect(homePage.categoriesBtn).toBeVisible();
	});

	// TC-05: Footer Presence
	test("Should verify that the footer is loaded with copyright info", async () => {
		await expect(homePage.footerContainer).toBeVisible();
		// Verify copyright year is current (future-proofing check)
		await expect(homePage.copyrightText).toContainText("2026");
	});
});
