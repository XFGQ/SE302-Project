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

		// 1. Arama kutusuna tıkla ve yazmaya başla
		// pressSequentially kullanıyoruz çünkü gerçek kullanıcı gibi harf harf yazar,
		// bu da önerilerin tetiklenmesini sağlar.
		await homePage.searchInput.click();
		await homePage.searchInput.pressSequentially(partialKeyword, {
			delay: 150,
		});

		// 2. "Prijedlozi pretrage" (Arama Önerileri) başlığının görünmesini bekle
		await expect(homePage.suggestionsTitle).toBeVisible({ timeout: 10000 });

		// 3. Listelenen önerilerin sayısını kontrol et
		const suggestionCount = await homePage.searchSuggestionsList.count();
		expect(suggestionCount).toBeGreaterThan(0);

		// 4. İlk önerinin bizim yazdığımız kelimeyi içerdiğini doğrula
		const firstSuggestionText = await homePage.searchSuggestionsList
			.first()
			.textContent();
		expect(firstSuggestionText?.toLowerCase()).toContain(partialKeyword);

		// 5. Ekstra: Önerilerden birine tıklanabiliyor mu? (Opsiyonel)
		// await homePage.searchSuggestionsList.first().click();
		// await expect(page).toHaveURL(/.*pretraga.*/);
	});

	test("TC02: Verify search functionality returns results", async ({
		page,
	}) => {
		// "searchFor" metodu delay kullandığı için Cloudflare'e takılmaz
		await homePage.searchFor("PlayStation 5");

		// URL doğrulama
		await expect(page).toHaveURL(/.*pretraga.*/);

		// SearchPage metodunu kullanarak sonuçları doğrula
		await searchPage.verifyResultsExist();
	});

	test("TC03: Verify category navigation works correctly", async ({ page }) => {
		const categoryName = "Vozila";

		// Kategoriye tıkla
		await homePage.selectCategory(categoryName);

		// Sayfanın değiştiğini URL ve Başlık ile doğrula
		await expect(page).toHaveURL(/.*vozila.*/i);
		// H1 başlığının kategori ismini içerdiğini kontrol et
		await expect(page.locator("h1").first()).toContainText(categoryName, {
			ignoreCase: true,
		});
	});

	test("TC04: Verify successful user login", async ({ page }) => {
		// 1. Sayfaya git
		await homePage.goto();

		await homePage.login("furkandmn35@gmail.com", "Furkan35!");

		await expect(page).toHaveURL("https://olx.ba/");

		const loginBtn = page.getByRole("link", { name: "prijava" });
		await expect(loginBtn).not.toBeVisible();
	});

	test("TC05: Verify sorting functionality (Price: Low to High)", async ({
		page,
	}) => {
		await homePage.searchFor("Laptop");
		await searchPage.verifyResultsExist();

		// Sıralamayı değiştir
		await searchPage.selectSortOption("jeftinije");

		// URL'in sıralama parametrelerini içerdiğini doğrula
		// Gönderdiğin örnek URL yapısına göre:
		await expect(page).toHaveURL(/.*sort_by=price.*/);
		await expect(page).toHaveURL(/.*sort_order=asc.*/);

		// Sonuçların mevcut olduğunu doğrula
		await searchPage.verifyResultsExist();
	});

	// --- BU TEST CASE DEĞİŞTİRİLMEDİ ---
	test("TC06: Verify keyword search returns relevant results", async ({
		page,
	}) => {
		const searchKeyword = "Audi A6";

		await homePage.searchFor(searchKeyword);

		await searchPage.productHeading
			.first()
			.waitFor({ state: "visible", timeout: 10000 });

		await expect(page).toHaveURL(/pretraga/);

		await expect(searchPage.productHeading.first()).toContainText(
			searchKeyword,
			{ ignoreCase: true },
		);
	});
	// -----------------------------------
	test("TC07: Verify login page navigation and form visibility", async ({
		page,
	}) => {
		// 1. Ana sayfaya git
		await homePage.navigate();

		// 2. Login sayfasını aç
		await homePage.navigateToLogin();

		// 3. DOĞRULAMA: URL'in login içerdiğini bekle (Basit regex)
		await expect(page).toHaveURL(/.*(login|prijava).*/, { timeout: 10000 });

		// 4. Formun geldiğini en basit input locator'ı ile doğrula
		// OLX'teki email alanı genellikle 'username' name'ine sahiptir
		const emailField = page.locator('input[name="username"]');
		await expect(emailField).toBeVisible({ timeout: 5000 });
	});

	test('TC08: Verify "Post Ad" button redirects guest user to login page', async ({
		page,
	}) => {
		// 1. Butonun görünür olduğunu doğrula
		await expect(homePage.postAdButton).toBeVisible({ timeout: 10000 });

		// 2. Buton metnini doğrula (Görselin yanındaki p etiketindeki metin)
		const buttonText = await homePage.postAdButton.textContent();
		expect(buttonText).toContain("Objavi oglas");

		// 3. Butona tıkla
		await homePage.postAdButton.click();

		// 4. Guest user olduğumuz için login sayfasına (prijava/login) yönlendirmeli
		// OLX genellikle bu durumda URL'i /prijava veya /login olarak değiştirir
		await page.waitForURL(/.*(prijava|login).*/, { timeout: 10000 });

		// 5. Login formunun geldiğini doğrula
		const loginHeader = page
			.locator("h1, h2")
			.filter({ hasText: /prijavite se|prijava/i })
			.first();
		await expect(loginHeader).toBeVisible();
	});

	test("TC09: Verify clicking a featured product opens its detail page", async ({
		page,
	}) => {
		// Ana sayfadaki ilk ilan kartını bul (Arama yapmadan, ana sayfadaki vitrin ilanları)
		const featuredItem = page.locator('a[href*="/artikal/"]').first();
		const itemName = await featuredItem.textContent();
		expect(itemName).toBeTruthy();

		await featuredItem.click();

		// Detay sayfasında olduğumuzu doğrula
		await expect(page).toHaveURL(/.*artikal.*/);

		// İlan başlığı veya fiyatı görünür mü?
		const detailHeading = page.locator("h1, .item-title").first();
		await expect(detailHeading).toBeVisible();
	});

	test("TC10: Verify advanced filtering (Condition: Novo)", async ({
		page,
	}) => {
		// 1. Arama yap
		await homePage.searchFor("iPhone");

		// 2. Arama sonuçlarının ilk halini gör (bu adım sayfanın hazır olduğunu kanıtlar)
		await searchPage.verifyResultsExist();

		// 3. Filtreleme metodunu çağır (Yeni yazdığımız Promise.all yapılı olan)
		await searchPage.filterByNew();

		// 4. Nihai doğrulama: URL state=1 içermeli
		await expect(page).toHaveURL(/.*state=1.*/);

		// 5. Sonuçların filtrelenmiş şekilde geldiğini doğrula
		await searchPage.verifyResultsExist();
	});
});
