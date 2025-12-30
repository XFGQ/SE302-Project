import { Page, Locator, expect } from '@playwright/test';

export class SearchPage {
    readonly page: Page;
    
    // ... Diğer locatorlar aynı kalabilir ...
    readonly priceMinInput: Locator;
    readonly priceMaxInput: Locator;
    readonly buttonNovo: Locator;
    readonly buttonUsed: Locator;
    readonly locationSelect: Locator;
    readonly nextBtn: Locator;
    
    // GÜNCELLENEN KISIMLAR:
    readonly sortMenuTrigger: Locator; 
    readonly productHeading: Locator;
    readonly productPrice: Locator;
    readonly noResultsMessage: Locator;
    readonly resultCards: Locator;
    readonly locationFilterTrigger: Locator;
    readonly conditionNovoBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        
        // ... Diğer tanımlamalar ...
        this.priceMinInput = page.locator('input[placeholder="od"]');
        this.priceMaxInput = page.locator('input[placeholder="do"]');
        this.buttonNovo = page.locator('#buttonNovo');
        this.buttonUsed = page.locator('#buttonKorišteno');
        this.locationSelect = page.locator('.cities select');
        this.nextBtn = page.locator('button:has(img[src*="chevron-right"])');
        this.locationFilterTrigger = page.locator('div, button').filter({ hasText: /^Lokacija$/ }).first();
        this.conditionNovoBtn = page.locator('label, button, span').filter({ hasText: /^Novo$/ }).first();
        this.resultCards = page.locator('a[href*="/artikal/"]');
        // GÜNCEL LOCATOR (Senin gönderdiğin HTML'e göre):
        // "label-wrap" class'ına sahip ve içinde "Sortiraj" yazan div
        this.sortMenuTrigger = page.locator('div.label-wrap').filter({ hasText: 'Sortiraj' }).first();

        this.productHeading = page.locator('.main-heading');
        this.productPrice = page.locator('.smaller');
        this.noResultsMessage = page.locator('text=Nema rezultata');
        this.resultCards = page.locator('a[href*="/artikal/"]'); 
       }

    async humanDelay(): Promise<void> {
        const delay = Math.floor(Math.random() * 800) + 400;
        await this.page.waitForTimeout(delay);
    }
// pages/SearchPage_Functional.ts

// pages/SearchPage_Functional.ts

// pages/SearchPage_Functional.ts

  // pages/SearchPage_Functional.ts

async filterByNew(): Promise<void> {
    // 1. Filtre menüsünü aç
    const filterMenuTrigger = this.page.locator('div.label-wrap').filter({ hasText: 'Filteri oglasa' }).first();
    await filterMenuTrigger.click();

    // 2. Tıklama ve URL değişimini aynı anda bekle
    // Bu yöntem, tıklama anında sayfanın yenilenmesinden kaynaklanan hataları önler.
    const novoButton = this.page.locator('#buttonNovo');
    
    await Promise.all([
        this.page.waitForURL(/.*state=1.*/, { timeout: 15000 }), // URL değişene kadar bekle
        novoButton.click({ force: true }) // Butona zorla tıkla
    ]);

    // 3. UI'ın stabil hale gelmesi için kısa bir yükleme beklemesi
    await this.page.waitForLoadState('domcontentloaded');
}
   async selectLocation(cityName: string): Promise<void> {
        // Lokasyon seçiciyi metin üzerinden bul (Genelde "Lokacija" yazar)
        const locationTrigger = this.page.getByText('Lokacija', { exact: true });
        await locationTrigger.first().click();

        // Açılan input alanına şehrin ismini yaz (OLX'te genelde arama kutusu açılır)
        const citySearchInput = this.page.locator('input[placeholder*="Pretraži"], input[placeholder*="Lokacija"]');
        
        if (await citySearchInput.isVisible()) {
            await citySearchInput.fill(cityName);
            await this.page.keyboard.press('Enter');
        } else {
            // Eğer input yoksa, listeden direkt şehre tıkla
            await this.page.getByText(cityName, { exact: true }).first().click();
        }

        await this.page.waitForLoadState('networkidle');
    }
    // ... Diğer metodlar (setPriceRange, selectLocation vb.) aynı kalacak ...

    // GÜNCELLENEN SORT METODU
// GÜNCELLENEN SORT METODU
    async selectSortOption(optionType: 'jeftinije' | 'skuplje'): Promise<void> {
        // Mevcut URL'i al (Değişimi kontrol etmek için)
        const oldUrl = this.page.url();

        // 1. "Sortiraj" menüsüne tıkla
        await this.sortMenuTrigger.click();
        await this.page.waitForTimeout(500);

        // 2. Seçeneğe tıkla
        if (optionType === 'jeftinije') {
            await this.page.getByText('Najniža', { exact: false }).click();
        } else {
            await this.page.getByText('Najviša', { exact: false }).click();
        }

        /**
         * KRİTİK DEĞİŞİKLİK: 
         * 'networkidle' yerine URL'in değişmesini bekliyoruz.
         * Çünkü sıralama değiştiğinde URL'e "sort_order=asc" gibi parametreler eklenir.
         */
        await this.page.waitForURL((url) => url.href !== oldUrl, { timeout: 10000 });
        
        // Opsiyonel: İlk sonucun tekrar görünür olmasını bekle (UI render için)
        await this.resultCards.first().waitFor({ state: 'visible' });
    }
    
   async verifyResultsExist(): Promise<void> {
        // İlanların yüklenmesi bazen uzun sürebilir, timeout süresini biraz artırabiliriz
        await expect(this.resultCards.first()).toBeVisible({ timeout: 15000 });
        
        const count = await this.resultCards.count();
        console.log(`Bulunan ilan sayısı: ${count}`); // Debug için konsola yazdıralım
        expect(count).toBeGreaterThan(0);
    }
}