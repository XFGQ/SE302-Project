import type { Locator, Page } from "@playwright/test";

export class HomePage {
	readonly page: Page;
	readonly acceptCookiesBtn: Locator;
	readonly logo: Locator;
	readonly searchInput: Locator;
	readonly loginBtn: Locator;
	readonly categoriesBtn: Locator;
	readonly footerContainer: Locator;
	readonly copyrightText: Locator;

	constructor(page: Page) {
		this.page = page;
		this.logo = page.locator('header a.logo, img[alt*="olx"]').first();
		this.acceptCookiesBtn = page.locator("#accept-btn");
		this.logo = page.getByAltText("olx-logo");
		this.searchInput = page.locator('input[name="notASearchField"]');
		this.loginBtn = page.locator('a[aria-label="prijava"]');
		this.categoriesBtn = page.getByRole("link", {
			name: "Kategorije",
			exact: true,
		});
		this.footerContainer = page.locator("#olx-home-footer");
		this.copyrightText = page.locator(".footer-copyright p");
	}

	/**
	 * Navigates to the homepage with a buffer for slow network.
	 */
	async navigate(): Promise<void> {
		// 'networkidle' kullanarak sayfanın tüm arka plan yüklemelerinin bitmesini bekliyoruz
		await this.page.goto("https://olx.ba", { waitUntil: "networkidle" });
	}

	/**
	 * Handles cookies with an explicit wait for the overlay to disappear.
	 */
	async handleCookies(): Promise<void> {
		try {
			// Butonun hem görünür hem de tıklanabilir olmasını bekle
			await this.acceptCookiesBtn.waitFor({ state: "visible", timeout: 10000 });
			await this.acceptCookiesBtn.click();

			// KRİTİK: Çerez paneli tamamen kapanana kadar bekle (hidden durumu)
			// Bu yapılmazsa logo testi "element intercepted" hatası verip bozulur.
			await this.acceptCookiesBtn.waitFor({ state: "hidden", timeout: 7000 });

			// Animasyonun bitmesi için çok kısa bir insansı bekleme
			await this.page.waitForTimeout(1000);
		} catch (error) {
			console.log(
				`Cookie consent modal did not appear this time.\n [ERROR]: ${error}`,
			);
		}
	}
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
