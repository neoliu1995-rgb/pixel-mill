import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("User can navigate to sign-in page", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page).toHaveTitle(/pixelmill/i);
    await expect(page.locator("h1")).toContainText("Welcome Back");
  });

  test("Sign-in page has email and password fields", async ({ page }) => {
    await page.goto("/auth/signin");
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("Sign-in page shows error with invalid credentials", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.locator('input[type="email"]').fill("invalid@test.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 10000 });
  });

  test("User can navigate to registration", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("text=PixelMill")).toBeVisible();
    const registerButton = page.locator("button", { hasText: /register|sign.?up/i });
    await registerButton.click();
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });
});
