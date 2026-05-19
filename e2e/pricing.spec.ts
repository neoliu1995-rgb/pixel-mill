import { test, expect } from "@playwright/test";

test.describe("Pricing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("Pricing page loads and shows plan cards", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
    const planCards = page.locator(".rounded-2xl.border, .rounded-2xl.shadow-2xl");
    await expect(planCards.first()).toBeVisible();
  });

  test("Currency toggle works (USD/CNY)", async ({ page }) => {
    const usdButton = page.locator("button", { hasText: "USD" });
    const cnyButton = page.locator("button", { hasText: "CNY" });
    await expect(usdButton).toBeVisible();
    await expect(cnyButton).toBeVisible();
    await cnyButton.click();
    await expect(page.locator("text=¥").first()).toBeVisible();
    await usdButton.click();
    await expect(page.locator("text=$").first()).toBeVisible();
  });

  test("Billing period toggle works (monthly/yearly)", async ({ page }) => {
    const monthlyButton = page.locator("button", { hasText: /月付|monthly/i }).first();
    const yearlyButton = page.locator("button", { hasText: /年付|yearly/i }).first();
    await expect(monthlyButton).toBeVisible();
    await expect(yearlyButton).toBeVisible();
    await yearlyButton.click();
    await expect(page.locator("text=/yr").first()).toBeVisible();
    await monthlyButton.click();
    await expect(page.locator("text=/mo").first()).toBeVisible();
  });

  test("Pro plan shows promotional price with strikethrough original price", async ({ page }) => {
    const strikethroughPrice = page.locator(".line-through");
    await expect(strikethroughPrice.first()).toBeVisible();
  });
});
