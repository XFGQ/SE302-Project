import type { Locator, Page } from "@playwright/test";

export class HomePage {
	readonly page: Page;
	readonly acceptCookiesBtn: Locator;
	readonly logo: Locator;
	readonly searchInput: Locator;
	readonly categoriesBtn: Locator;
	readonly footerContainer: Locator;
	readonly copyrightText: Locator;
	readonly postAdButton: Locator;
	readonly searchSuggestions: Locator;
	readonly searchSuggestionsList: Locator;
	readonly suggestionsTitle: Locator;
	readonly loginButton: Locator;
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly submitLogin: Locator;
	readonly userMenu: Locator;
	constructor(page: Page) {
		this.page = page;
		this.logo = page.locator('header a.logo, img[alt*="olx"]').first();
		this.acceptCookiesBtn = page.locator("#accept-btn");
		this.logo = page.getByAltText("olx-logo");
		this.searchInput = page.locator('input[name="notASearchField"]');
		this.categoriesBtn = page.getByRole("link", {
			name: "Kategorije",
			exact: true,
		});
		this.footerContainer = page.locator("#olx-home-footer");
		this.copyrightText = page.locator(".footer-copyright p");
		this.postAdButton = page
			.locator("button")
			.filter({ hasText: /Objavi oglas/i })
			.first();
		this.searchSuggestions = page.locator(
			'.suggestions, .search-suggestions, [class*="suggestion"]',
		);
		this.searchSuggestionsList = page.locator(".lin-list .lin-row-text");
		this.suggestionsTitle = page.locator("text=Prijedlozi pretrage");
		this.loginButton = page
			.locator('a[href*="/login"], a[href*="/prijava"]')
			.first();
		this.emailInput = page.locator('input[name="username"]');

		this.passwordInput = page.locator('input[name="password"]');
		this.submitLogin = page.locator('button[type="submit"]');
		this.userMenu = page.locator(".user-menu-label");
	}

	/**
	 * Logs in with provided credentials and waits for successful redirect.
	 * @param email - User email address
	 * @param pass - User password
	 */
	async login(email: string, pass: string): Promise<void> {
		const loginLink = this.page.getByRole("link", { name: "prijava" });
		await loginLink.click({ force: true });
		await this.page.waitForURL(/.*login.*/);

		const emailInput = this.page.locator('input[name="username"]');
		const passwordInput = this.page.locator('input[name="password"]');

		await emailInput.fill(email);
		await passwordInput.fill(pass);

		// Find submit button by text content since standard selector is unreliable
		const submitBtn = this.page
			.locator("button")
			.filter({ has: this.page.locator('p:text("Prijavi se")') });

		await submitBtn.waitFor({ state: "visible", timeout: 5000 });

		// Wait for redirect and click simultaneously to avoid race conditions
		await Promise.all([
			this.page.waitForURL("https://olx.ba/", { timeout: 20000 }),
			submitBtn.click({ force: true }),
		]);
	}

	/**
	 * Navigates to the login page.
	 */
	async openLoginPage(): Promise<void> {
		const loginLink = this.page.getByRole("link", { name: "prijava" });

		await loginLink.waitFor({ state: "visible", timeout: 5000 });
		await loginLink.click({ force: true });

		await this.page.waitForURL(/.*login.*/, { timeout: 10000 });
	}

	/**
	 * Navigates to OLX homepage and waits for network idle.
	 */
	async goto(): Promise<void> {
		await this.page.goto("https://olx.ba/");
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * Navigates to OLX homepage with network idle wait.
	 */
	async navigate(): Promise<void> {
		await this.page.goto("https://olx.ba", { waitUntil: "networkidle" });
	}

	/**
	 * Performs a quick search without human-like typing.
	 * @param searchTerm - Product to search for
	 */
	async searchForItem(searchTerm: string) {
		await this.searchInput.fill(searchTerm);
		await this.searchInput.press("Enter");
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * Clicks on a category link to filter products.
	 * @param categoryName - Name of the category to select
	 */
	async selectCategory(categoryName: string) {
		const category = this.page.locator(`a:has-text("${categoryName}")`).first();
		await category.click();
	}

	/**
	 * Accepts cookie consent if modal appears.
	 */
	async handleCookies(): Promise<void> {
		try {
			await this.acceptCookiesBtn.waitFor({ state: "visible", timeout: 10000 });
			await this.acceptCookiesBtn.click();

			// Wait for overlay to disappear to prevent element-intercepted errors
			await this.acceptCookiesBtn.waitFor({ state: "hidden", timeout: 7000 });
			await this.page.waitForTimeout(1000);
		} catch (error) {
			console.log(
				`Cookie consent modal did not appear this time.\n[ERROR]: ${error}`,
			);
		}
	}

	/**
	 * Navigates to login page using the main login button.
	 */
	async navigateToLogin() {
		await this.loginButton.waitFor({ state: "visible", timeout: 5000 });
		await this.loginButton.click();
	}

	/**
	 * Searches for products using human-like typing to bypass bot detection.
	 * @param keyword - Search term to type in the search bar
	 */
	async searchFor(keyword: string): Promise<void> {
		await this.searchInput.waitFor({ state: "visible" });
		await this.searchInput.click();

		// Typing with delay to bypass Cloudflare
		await this.searchInput.pressSequentially(keyword, { delay: 150 });
		await this.page.keyboard.press("Enter");

		// Ensure network is idle so results are fully rendered
		await this.page.waitForURL(/.(q=|pretraga)./, { timeout: 15000 });
	}
}
