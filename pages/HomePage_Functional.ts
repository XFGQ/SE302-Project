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
		// pages/HomePage_Functional.ts içine constructor'a ekleyin
		this.searchSuggestionsList = page.locator(".lin-list .lin-row-text");
		this.suggestionsTitle = page.locator("text=Prijedlozi pretrage");
		// pages/HomePage_Functional.ts constructor içine:
		this.loginButton = page
			.locator('a[href*="/login"], a[href*="/prijava"]')
			.first();
		this.emailInput = page.locator('input[name="username"]'); // Kullanıcı adı/Email alanı

		this.passwordInput = page.locator('input[name="password"]');
		this.submitLogin = page.locator('button[type="submit"]');
		this.userMenu = page.locator(".user-menu-label"); // Giriş sonrası çıkan kullanıcı ikonu/ismi
	}

	async login(email: string, pass: string): Promise<void> {
		// 1. Login sayfasını aç
		const loginLink = this.page.getByRole("link", { name: "prijava" });
		await loginLink.click({ force: true });
		await this.page.waitForURL(/.*login.*/);

		// 2. Form alanlarını doldur
		const emailInput = this.page.locator('input[name="username"]');
		const passwordInput = this.page.locator('input[name="password"]');

		await emailInput.fill(email);
		await passwordInput.fill(pass);

		// 3. SUBMIT BUTONU ÇÖZÜMÜ
		// Klasik locator çalışmıyorsa, CSS üzerinden 'Prijavi se' içeren butonu zorla buluyoruz
		const submitBtn = this.page
			.locator("button")
			.filter({ has: this.page.locator('p:text("Prijavi se")') });

		// Eğer buton hala bulunamıyorsa alternatif (en kaba ama çalışan) yol:
		// const submitBtn = this.page.locator('button.my-lg');

		await submitBtn.waitFor({ state: "visible", timeout: 5000 });

		// Tıklama işlemini yap ve ana sayfaya yönlenmeyi bekle
		await Promise.all([
			this.page.waitForURL("https://olx.ba/", { timeout: 20000 }),
			submitBtn.click({ force: true }),
		]);
	}
	// pages/HomePage_Functional.ts
	async openLoginPage(): Promise<void> {
		// 1. "Prijavi se" butonunu aria-label üzerinden bul ve tıkla
		const loginLink = this.page.getByRole("link", { name: "prijava" });

		// Butonun görünür olmasını bekle ve zorla tıkla
		await loginLink.waitFor({ state: "visible", timeout: 5000 });
		await loginLink.click({ force: true });

		// 2. Login sayfasının yüklendiğini (URL'in değiştiğini) doğrula
		await this.page.waitForURL(/.*login.*/, { timeout: 10000 });
	}
	async goto(): Promise<void> {
		await this.page.goto("https://olx.ba/");
		await this.page.waitForLoadState("networkidle");
	}
	async navigate(): Promise<void> {
		// 'networkidle' kullanarak sayfanın tüm arka plan yüklemelerinin bitmesini bekliyoruz
		await this.page.goto("https://olx.ba", { waitUntil: "networkidle" });
	}

	async searchForItem(searchTerm: string) {
		await this.searchInput.fill(searchTerm);
		await this.searchInput.press("Enter");
		await this.page.waitForLoadState("networkidle");
	}

	async selectCategory(categoryName: string) {
		const category = this.page.locator(`a:has-text("${categoryName}")`).first();
		await category.click();
	}

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
				`Cookie consent modal did not appear this time.\n[ERROR]: ${error}`,
			);
		}
	}

	// pages/HomePage_Functional.ts içine:
	async navigateToLogin() {
		// Butonun hazır olmasını bekle ve tıkla
		await this.loginButton.waitFor({ state: "visible", timeout: 5000 });
		await this.loginButton.click();
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
