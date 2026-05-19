import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("Header navigation links work", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await header.locator('a[href="/pricing"]').click();
    await expect(page).toHaveURL(/\/pricing/);
    await page.goBack();
    await header.locator('a[href="/effects"]').click();
    await expect(page).toHaveURL(/\/effects/);
  });

  test("Mobile navigation is visible on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const mobileNav = page.locator("nav.fixed.bottom-0");
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.locator("a").first()).toBeVisible();
  });
});
