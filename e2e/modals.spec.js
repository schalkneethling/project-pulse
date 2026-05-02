import { test, expect } from "@playwright/test";

/**
 * Helper: get all focusable elements currently inside the open <dialog>.
 */
async function getFocusableInDialog(page) {
  return page.$eval("dialog[open]", (dialog) => {
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(dialog.querySelectorAll(selector)).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute("type") || "",
      placeholder: el.getAttribute("placeholder") || "",
      text: el.textContent?.trim().slice(0, 30) || "",
    }));
  });
}

test.describe("NetlifyModal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("focus moves into the dialog on open", async ({ page }) => {
    await page.click('button:has-text("Open Netlify Modal")');

    const focused = await page.evaluate(() => {
      const active = document.activeElement;
      const dialogEl = document.querySelector("dialog[open]");
      return dialogEl?.contains(active) && active?.tagName === "INPUT";
    });
    expect(focused).toBe(true);
  });

  test("focus is trapped – Tab wraps from last to first element", async ({ page }) => {
    await page.click('button:has-text("Open Netlify Modal")');

    const focusable = await getFocusableInDialog(page);
    expect(focusable.length).toBeGreaterThan(0);

    // Tab to the last focusable element.
    for (let i = 0; i < focusable.length - 1; i++) {
      await page.keyboard.press("Tab");
    }

    // One more Tab — the manual trap wraps to the first element.
    await page.keyboard.press("Tab");

    const inside = await page.evaluate(() => {
      const dialogEl = document.querySelector("dialog[open]");
      return dialogEl ? dialogEl.contains(document.activeElement) : false;
    });
    expect(inside).toBe(true);
    await expect(page.locator("dialog[open]")).toBeAttached();
  });

  test("Shift+Tab wraps from first to last focusable element", async ({ page }) => {
    await page.click('button:has-text("Open Netlify Modal")');

    const focusable = await getFocusableInDialog(page);
    expect(focusable.length).toBeGreaterThan(0);

    // From the autofocused first element, Shift+Tab wraps to the last.
    await page.keyboard.press("Shift+Tab");

    const lastItem = focusable[focusable.length - 1];
    const activeInfo = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName?.toLowerCase(),
        text: el?.textContent?.trim().slice(0, 30) || "",
      };
    });
    expect(activeInfo.tag).toBe(lastItem.tag);
    expect(activeInfo.text).toBe(lastItem.text);
  });

  test("Escape key closes the dialog", async ({ page }) => {
    await page.click('button:has-text("Open Netlify Modal")');
    await expect(page.locator("dialog[open]")).toBeAttached();

    await page.keyboard.press("Escape");

    await expect(page.locator("dialog[open]")).not.toBeAttached();
  });

  test("Cancel button closes the dialog", async ({ page }) => {
    await page.click('button:has-text("Open Netlify Modal")');
    await expect(page.locator("dialog[open]")).toBeAttached();

    await page.click("dialog[open] >> button:has-text('Cancel')");

    await expect(page.locator("dialog[open]")).not.toBeAttached();
  });

  test("backdrop is styled", async ({ page }) => {
    await page.click('button:has-text("Open Netlify Modal")');

    const backdropBg = await page.evaluate(() => {
      const dialogEl = document.querySelector("dialog[open]");
      if (!dialogEl) return null;
      return getComputedStyle(dialogEl, "::backdrop").backgroundColor;
    });

    expect(backdropBg).toMatch(/rgba?\(0,\s*0,\s*0/);
  });
});

test.describe("SettingsModal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("focus moves into the dialog on open", async ({ page }) => {
    await page.click('button:has-text("Open Settings Modal")');

    const focused = await page.evaluate(() => {
      const active = document.activeElement;
      const dialogEl = document.querySelector("dialog[open]");
      return dialogEl?.contains(active) && active?.tagName === "INPUT";
    });
    expect(focused).toBe(true);
  });

  test("focus is trapped – Tab wraps from last to first element", async ({ page }) => {
    await page.click('button:has-text("Open Settings Modal")');

    const focusable = await getFocusableInDialog(page);
    expect(focusable.length).toBeGreaterThan(0);

    for (let i = 0; i < focusable.length - 1; i++) {
      await page.keyboard.press("Tab");
    }

    await page.keyboard.press("Tab");

    const inside = await page.evaluate(() => {
      const dialogEl = document.querySelector("dialog[open]");
      return dialogEl ? dialogEl.contains(document.activeElement) : false;
    });
    expect(inside).toBe(true);
    await expect(page.locator("dialog[open]")).toBeAttached();
  });

  test("Escape key closes the dialog", async ({ page }) => {
    await page.click('button:has-text("Open Settings Modal")');
    await expect(page.locator("dialog[open]")).toBeAttached();

    await page.keyboard.press("Escape");

    await expect(page.locator("dialog[open]")).not.toBeAttached();
  });

  test("Close button closes the dialog", async ({ page }) => {
    await page.click('button:has-text("Open Settings Modal")');
    await expect(page.locator("dialog[open]")).toBeAttached();

    await page.click("dialog[open] >> button:has-text('Close')");

    await expect(page.locator("dialog[open]")).not.toBeAttached();
  });
});

test.describe("GitHubModal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("focus moves into the dialog on open", async ({ page }) => {
    await page.click('button:has-text("Open GitHub Modal")');

    const focused = await page.evaluate(() => {
      const active = document.activeElement;
      const dialogEl = document.querySelector("dialog[open]");
      return dialogEl?.contains(active) && active?.tagName === "INPUT";
    });
    expect(focused).toBe(true);
  });

  test("focus is trapped – Tab wraps from last to first element", async ({ page }) => {
    await page.click('button:has-text("Open GitHub Modal")');

    const focusable = await getFocusableInDialog(page);
    expect(focusable.length).toBeGreaterThan(0);

    for (let i = 0; i < focusable.length - 1; i++) {
      await page.keyboard.press("Tab");
    }

    await page.keyboard.press("Tab");

    const inside = await page.evaluate(() => {
      const dialogEl = document.querySelector("dialog[open]");
      return dialogEl ? dialogEl.contains(document.activeElement) : false;
    });
    expect(inside).toBe(true);
    await expect(page.locator("dialog[open]")).toBeAttached();
  });

  test("Escape key closes the dialog", async ({ page }) => {
    await page.click('button:has-text("Open GitHub Modal")');
    await expect(page.locator("dialog[open]")).toBeAttached();

    await page.keyboard.press("Escape");

    await expect(page.locator("dialog[open]")).not.toBeAttached();
  });

  test("Cancel button closes the dialog", async ({ page }) => {
    await page.click('button:has-text("Open GitHub Modal")');
    await expect(page.locator("dialog[open]")).toBeAttached();

    await page.click("dialog[open] >> button:has-text('Cancel')");

    await expect(page.locator("dialog[open]")).not.toBeAttached();
  });
});
