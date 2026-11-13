/* Capture only audit-gap screenshots: Study Buddy, collective milestone, WCAG focus + larger text. */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE = process.argv[2] || "http://localhost:3210";
const CHROME =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.join(__dirname, "..", "screenshots", "report");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function norm(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

async function waitForText(page, needle, timeout = 20000) {
  const target = norm(needle).toLowerCase();
  await page.waitForFunction(
    (n) =>
      document.body
        ? document.body.innerText.replace(/\s+/g, " ").toLowerCase().includes(n)
        : false,
    { timeout },
    target
  );
}

async function clickButton(page, label) {
  const target = norm(label);
  const visibleButtons = await page.$$eval("button", (els) =>
    els
      .map((el, i) => ({
        i,
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
        display: getComputedStyle(el).display,
        visibility: getComputedStyle(el).visibility,
      }))
      .filter((b) => b.display !== "none" && b.visibility !== "hidden")
  );
  const match = visibleButtons.find((b) =>
    b.text.toLowerCase().includes(target.toLowerCase())
  );
  if (!match) throw new Error(`No button matching "${target}"`);
  await page.$$eval("button", (els, i) => els[i].click(), match.i);
}

async function shot(page, name) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.evaluate(() => {
    document
      .querySelectorAll("nextjs-portal, #webpack-dev-server-client-overlay")
      .forEach((el) => el.remove());
  });
  const file = path.join(OUT, name + ".png");
  await sleep(400);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✔ ${name}`);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
    args: ["--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);

  try {
    await page.goto(BASE + "/login", { waitUntil: "load", timeout: 120000 });
    await waitForText(page, "Continue with Google");
    await clickButton(page, "Continue with Google");
    await waitForText(page, "The mountain");
    await clickButton(page, "Skip");
    await sleep(800);
    try {
      await waitForText(page, "Today", 8000);
    } catch {
      /* already past onboarding */
    }

    // Study Buddy (Settings)
    await page.goto(BASE + "/settings", { waitUntil: "networkidle0", timeout: 60000 });
    await waitForText(page, "Study buddy");
    await page.evaluate(() => {
      const el = [...document.querySelectorAll("p, h1, h2, span")].find((n) =>
        /Study buddy/i.test(n.textContent || "")
      );
      if (el) el.scrollIntoView({ block: "center" });
    });
    await sleep(300);
    // turn on if off
    await page.evaluate(() => {
      const cards = [...document.querySelectorAll("div")].filter((d) =>
        /Study buddy/i.test(d.innerText || "")
      );
      for (const card of cards) {
        const btn = card.querySelector('button[role="switch"], button[aria-pressed]');
        if (btn && (btn.getAttribute("aria-checked") === "false" || btn.getAttribute("aria-pressed") === "false")) {
          btn.click();
          break;
        }
      }
    });
    await sleep(300);
    await shot(page, "fig18-study-buddy");

    // Larger text (WCAG 1.4.4) — stay on settings
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /150|Large|Bigger|text size/i.test(b.textContent || "")
      );
      if (btn) btn.click();
    });
    await sleep(400);
    await page.evaluate(() => {
      const el = [...document.querySelectorAll("p, h1, h2, label, span")].find((n) =>
        /text size|font|contrast|150|display/i.test(n.textContent || "")
      );
      if (el) el.scrollIntoView({ block: "center" });
    });
    await sleep(300);
    await shot(page, "fig19-larger-text");

    // Collective milestone on Social (scroll to bottom cards)
    await page.goto(BASE + "/social", { waitUntil: "networkidle0", timeout: 60000 });
    await waitForText(page, "Support Wall");
    await page.evaluate(() => {
      const el = [...document.querySelectorAll("h2, h3, p, span")].find((n) =>
        /Collective|milestone|help circle/i.test(n.textContent || "")
      );
      if (el) el.scrollIntoView({ block: "center" });
      else window.scrollTo(0, document.body.scrollHeight);
    });
    await sleep(400);
    await shot(page, "fig20-collective");

    // Keyboard focus ring on dashboard primary CTA
    await page.goto(BASE + "/dashboard", { waitUntil: "networkidle0", timeout: 60000 });
    await waitForText(page, "Today");
    await page.keyboard.press("Tab");
    await sleep(100);
    // keep tabbing until Start today's target is focused
    for (let i = 0; i < 25; i++) {
      const label = await page.evaluate(() => {
        const el = document.activeElement;
        return (el && (el.innerText || el.getAttribute("aria-label") || "")).replace(/\s+/g, " ");
      });
      if (/Start today/i.test(label)) break;
      await page.keyboard.press("Tab");
      await sleep(80);
    }
    await sleep(200);
    await shot(page, "fig21-focus-ring");

    console.log("Done.");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
