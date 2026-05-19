import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("Homepage loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/pixelmill/i);
  });

  test("Homepage has the main generator UI elements", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("textarea").first()).toBeVisible();
    await expect(page.locator('button:has-text("Generate")').first()).toBeVisible();
  });

  test("Homepage has navigation header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator('header a[href="/"]')).toBeVisible();
    await expect(page.locator("header").getByText("PixelMill")).toBeVisible();
  });
});
