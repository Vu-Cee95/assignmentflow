const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE = "http://localhost:3210";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.join(__dirname, "..", "screenshots", "report", "fig7-flowcite-home.png");

async function waitForText(page, needle, timeout = 60000) {
  await page.waitForFunction(
    (n) => (document.body ? document.body.innerText.toLowerCase().includes(n) : false),
    { timeout },
    needle.toLowerCase()
  );
}

async function clickButton(page, label) {
  const ok = await page.evaluate((target) => {
    const buttons = [...document.querySelectorAll("button")].filter((el) => {
      const style = getComputedStyle(el);
      return style.display !== "none" && el.getAttribute("role") !== "tab";
    });
    const match = buttons.find((el) => (el.textContent || "").toLowerCase().includes(target));
    if (!match) return false;
    match.click();
    return true;
  }, label.toLowerCase());
  if (!ok) throw new Error("No button " + label);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  try {
    await page.goto(BASE + "/login", { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => !document.body.innerText.includes("Loading AssignmentFlow"), { timeout: 60000 });
    await waitForText(page, "Continue with Google");
    await clickButton(page, "Continue with Google");
    await waitForText(page, "The mountain");
    await clickButton(page, "Skip for now");
    await waitForText(page, "Today's step");
    await page.goto(BASE + "/flowcite", { waitUntil: "load", timeout: 120000 });
    await waitForText(page, "Paste the question");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((el) => el.remove()));
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: OUT, fullPage: false });
    console.log("saved", OUT);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
