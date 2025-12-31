import { expect, test } from "@playwright/test";
import { HomePage } from "../../pages/HomePage_Functional";
import { SearchPage } from "../../pages/SearchPage_Functional";

test.describe("OLX.ba - Functional Test Suite", () => {
	let homePage: HomePage;
	let searchPage: SearchPage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		searchPage = new SearchPage(page);

		await homePage.navigate();
		await homePage.handleCookies();
	});

	test("TC01: Verify search suggestions appear when typing", async () => {
		const partialKeyword = "iphone";

		// Simulate human typing with delay to trigger autocomplete suggestions
		await homePage.searchInput.click();
		await homePage.searchInput.pressSequentially(partialKeyword, {
			delay: 150,
		});

		await expect(homePage.suggestionsTitle).toBeVisible({ timeout: 10000 });

		const suggestionCount = await homePage.searchSuggestionsList.count();
		expect(suggestionCount).toBeGreaterThan(0);

		const firstSuggestionText = await homePage.searchSuggestionsList
			.first()
			.textContent();
		expect(firstSuggestionText?.toLowerCase()).toContain(partialKeyword);
	});

	test("TC02: Verify search functionality returns results", async ({
		page,
	}) => {
		await homePage.searchFor("PlayStation 5");

		await expect(page).toHaveURL(/.*pretraga.*/);

		await searchPage.verifyResultsExist();
	});

	test("TC03: Verify category navigation works correctly", async ({ page }) => {
		const categoryName = "Vozila";

		await homePage.selectCategory(categoryName);

		await expect(page).toHaveURL(/.*vozila.*/i);
		await expect(page.locator("h1").first()).toContainText(categoryName, {
			ignoreCase: true,
		});
	});

	test("TC04: Verify successful user login", async ({ page }) => {
		await homePage.goto();

		await homePage.login("furkandmn35@gmail.com", "Furkan35!");

		await expect(page).toHaveURL("https://olx.ba/");

		// Verify login button is hidden (user is successfully authenticated)
		const loginBtn = page.getByRole("link", { name: "prijava" });
		await expect(loginBtn).not.toBeVisible();
	});

	test("TC05: Verify sorting functionality (Price: Low to High)", async ({
		page,
	}) => {
		await homePage.searchFor("Laptop");
		await searchPage.verifyResultsExist();

		await searchPage.selectSortOption("jeftinije");

		// Verify URL contains sorting parameters (price, ascending order)
		await expect(page).toHaveURL(/.*sort_by=price.*/);
		await expect(page).toHaveURL(/.*sort_order=asc.*/);

		await searchPage.verifyResultsExist();
	});

	test("TC06: Verify keyword search returns relevant results", async ({
		page,
	}) => {
		const searchKeyword = "Audi A6";

		await homePage.searchFor(searchKeyword);

		// Wait for results to load before verifying relevance
		await searchPage.productHeading
			.first()
			.waitFor({ state: "visible", timeout: 10000 });

		await expect(page).toHaveURL(/pretraga/);

		await expect(searchPage.productHeading.first()).toContainText(
			searchKeyword,
			{ ignoreCase: true },
		);
	});
	test("TC07: Verify login page navigation and form visibility", async ({
		page,
	}) => {
		await homePage.navigate();

		await homePage.navigateToLogin();

		await expect(page).toHaveURL(/.*(login|prijava).*/, { timeout: 10000 });

		const emailField = page.locator('input[name="username"]');
		await expect(emailField).toBeVisible({ timeout: 5000 });
	});

	test('TC08: Verify "Post Ad" button redirects guest user to login page', async ({
		page,
	}) => {
		// Verify button is visible and has correct text before interaction
		await expect(homePage.postAdButton).toBeVisible({ timeout: 10000 });

		const buttonText = await homePage.postAdButton.textContent();
		expect(buttonText).toContain("Objavi oglas");

		await homePage.postAdButton.click();

		await page.waitForURL(/.*(prijava|login).*/, { timeout: 10000 });

		// Verify login page header appears (redirect successful)
		const loginHeader = page
			.locator("h1, h2")
			.filter({ hasText: /prijavite se|prijava/i })
			.first();
		await expect(loginHeader).toBeVisible();
	});

	test("TC09: Verify clicking a featured product opens its detail page", async ({
		page,
	}) => {
		// Store item name before navigation to verify we're on the correct detail page
		const featuredItem = page.locator('a[href*="/artikal/"]').first();
		const itemName = await featuredItem.textContent();
		expect(itemName).toBeTruthy();

		await featuredItem.click();

		await expect(page).toHaveURL(/.*artikal.*/);

		const detailHeading = page.locator("h1, .item-title").first();
		await expect(detailHeading).toBeVisible();
	});

	test("TC10: Verify advanced filtering (Condition: Novo)", async ({
		page,
	}) => {
		await homePage.searchFor("iPhone");

		await searchPage.verifyResultsExist();

		await searchPage.filterByNew();

		await expect(page).toHaveURL(/.*state=1.*/);

		await searchPage.verifyResultsExist();
	});
});
