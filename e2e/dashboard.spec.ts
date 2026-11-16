import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("demo dashboard exposes synthetic evidence and usable delivery search", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("DEMO · SYNTHETIC DATA")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Good morning, Alex" }),
  ).toBeVisible();
  await page
    .getByPlaceholder("Search receipts, clients, projects…")
    .fill("Northstar");
  await expect(
    page.getByText("October platform release", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: "Billing workflow improvements" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "New delivery" }).click();
  await page.getByLabel("Delivery title").fill("November API release");
  await page.getByLabel("Client").fill("Northstar Health");
  await page.getByLabel("Project").fill("Patient portal");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Draft delivery batch created.",
  );
  await expect(
    page.getByText("November API release", { exact: true }),
  ).toBeVisible();
});

test("demo dashboard has no serious axe violations", async ({ page }) => {
  const response = await page.goto("/");
  const csp = response?.headers()["content-security-policy"] ?? "";
  const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
  expect(nonce).toBeTruthy();
  const scripts = await page
    .locator("script")
    .evaluateAll((items) =>
      items.map((item) => (item as HTMLScriptElement).nonce),
    );
  expect(scripts.length).toBeGreaterThan(0);
  const nonceScripts = scripts.filter(Boolean);
  expect(nonceScripts.length).toBeGreaterThan(0);
  expect(nonceScripts.every((value) => value === nonce)).toBe(true);
  expect(csp).not.toContain("unsafe-inline");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((item) =>
      ["critical", "serious"].includes(item.impact ?? ""),
    ),
  ).toEqual([]);
});
