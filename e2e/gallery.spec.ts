import { test, expect } from "@playwright/test";

test.describe("Gallery page", () => {
  test("Gallery page loads successfully", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Gallery").first()).toBeVisible();
  });
});
