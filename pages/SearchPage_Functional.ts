import { expect, type Locator, type Page } from "@playwright/test";

export class SearchPage {
	readonly page: Page;

	readonly priceMinInput: Locator;
	readonly priceMaxInput: Locator;
	readonly buttonNovo: Locator;
	readonly buttonUsed: Locator;
	readonly locationSelect: Locator;
	readonly nextBtn: Locator;

	readonly sortMenuTrigger: Locator;
	readonly productHeading: Locator;
	readonly productPrice: Locator;
	readonly noResultsMessage: Locator;
	readonly resultCards: Locator;
	readonly locationFilterTrigger: Locator;
	readonly conditionNovoBtn: Locator;

	constructor(page: Page) {
		this.page = page;

		this.priceMinInput = page.locator('input[placeholder="od"]');
		this.priceMaxInput = page.locator('input[placeholder="do"]');
		this.buttonNovo = page.locator("#buttonNovo");
		this.buttonUsed = page.locator("#buttonKorišteno");
		this.locationSelect = page.locator(".cities select");
		this.nextBtn = page.locator('button:has(img[src*="chevron-right"])');
		this.locationFilterTrigger = page
			.locator("div, button")
			.filter({ hasText: /^Lokacija$/ })
			.first();
		this.conditionNovoBtn = page
			.locator("label, button, span")
			.filter({ hasText: /^Novo$/ })
			.first();
		this.resultCards = page.locator('a[href*="/artikal/"]');

		this.sortMenuTrigger = page
			.locator("div.label-wrap")
			.filter({ hasText: "Sortiraj" })
			.first();

		this.productHeading = page.locator(".main-heading");
		this.productPrice = page.locator(".smaller");
		this.noResultsMessage = page.locator("text=Nema rezultata");
		this.resultCards = page.locator('a[href*="/artikal/"]');
	}

	/**
	 * Waits for a random delay to simulate human behavior.
	 */
	async humanDelay(): Promise<void> {
		const delay = Math.floor(Math.random() * 800) + 400;
		await this.page.waitForTimeout(delay);
	}

	/**
	 * Filters results by price range.
	 * @param min - Minimum price value
	 * @param max - Maximum price value
	 */
	async setPriceRange(min: string, max: string): Promise<void> {
		const priceDropdown = this.page
			.locator("div.label-wrap")
			.filter({ hasText: "Cijena" })
			.first();
		await priceDropdown.click();

		const minInput = this.page.locator('input[placeholder="od"]').first();
		const maxInput = this.page.locator('input[placeholder="do"]').first();

		await minInput.waitFor({ state: "visible" });

		await minInput.fill(min);
		await maxInput.fill(max);

		// Wait for system to register input values
		await this.page.waitForTimeout(15000);

		const refreshButton = this.page
			.locator("button.refresh")
			.filter({ hasText: "Osvježi rezultate" });
		await Promise.all([
			this.page.waitForURL((url) => url.href.includes(min), { timeout: 15000 }),
			refreshButton.click({ force: true }),
		]);
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * Filters results to show only new items (condition: Novo).
	 */
	async filterByNew(): Promise<void> {
		const filterMenuTrigger = this.page
			.locator("div.label-wrap")
			.filter({ hasText: "Filteri oglasa" })
			.first();
		await filterMenuTrigger.click();

		const novoButton = this.page.locator("#buttonNovo");

		// Wait for URL change and click simultaneously to avoid race conditions
		await Promise.all([
			this.page.waitForURL(/.*state=1.*/, { timeout: 15000 }),
			novoButton.click({ force: true }),
		]);

		await this.page.waitForLoadState("domcontentloaded");
	}

	/**
	 * Filters results by location.
	 * @param cityName - Name of the city to filter by
	 */
	async selectLocation(cityName: string): Promise<void> {
		const locationTrigger = this.page.getByText("Lokacija", { exact: true });
		await locationTrigger.first().click();

		const citySearchInput = this.page.locator(
			'input[placeholder*="Pretraži"], input[placeholder*="Lokacija"]',
		);

		// Handle both search input and direct selection scenarios
		if (await citySearchInput.isVisible()) {
			await citySearchInput.fill(cityName);
			await this.page.keyboard.press("Enter");
		} else {
			await this.page.getByText(cityName, { exact: true }).first().click();
		}

		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * Changes result sorting order.
	 * @param optionType - "jeftinije" for lowest first, "skuplje" for highest first
	 */
	async selectSortOption(optionType: "jeftinije" | "skuplje"): Promise<void> {
		const oldUrl = this.page.url();

		await this.sortMenuTrigger.click();
		await this.page.waitForTimeout(500);

		if (optionType === "jeftinije") {
			await this.page.getByText("Najniža", { exact: false }).click();
		} else {
			await this.page.getByText("Najviša", { exact: false }).click();
		}

		// Wait for URL to update with sorting parameters
		await this.page.waitForURL((url) => url.href !== oldUrl, {
			timeout: 10000,
		});

		// Ensure results are re-rendered
		await this.resultCards.first().waitFor({ state: "visible" });
	}

	/**
	 * Verifies that search results exist on the page.
	 * @throws Error if no results are found
	 */
	async verifyResultsExist(): Promise<void> {
		await expect(this.resultCards.first()).toBeVisible({ timeout: 15000 });

		const count = await this.resultCards.count();
		expect(count).toBeGreaterThan(0);
	}
}
