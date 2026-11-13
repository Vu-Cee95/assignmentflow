const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE = "http://localhost:3210";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.join(__dirname, "..", "screenshots", "report");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  if (!ok) throw new Error("No button: " + label);
}

async function shot(page, name) {
  await page.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((el) => el.remove()));
  await sleep(350);
  const file = path.join(OUT, name + ".png");
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", name);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  try {
    await page.goto(BASE + "/login", { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(() => !document.body.innerText.includes("Loading AssignmentFlow"), { timeout: 90000 });
    await waitForText(page, "Continue with Google");
    await clickButton(page, "Continue with Google");
    await waitForText(page, "The mountain");
    await clickButton(page, "Skip for now");
    await waitForText(page, "Today's step");

    // Start the task
    await clickButton(page, "Start today's target");
    await waitForText(page, "Minimize & Work");
    await clickButton(page, "Minimize & Work");
    await waitForText(page, "Return & check in");
    await shot(page, "fig14-task-started");

    await page.goto(BASE + "/journey", { waitUntil: "load", timeout: 120000 });
    await waitForText(page, "My Journey");
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    await shot(page, "fig15-timeline-started");

    // Complete the task
    await page.goto(BASE + "/dashboard", { waitUntil: "load", timeout: 120000 });
    await waitForText(page, "Return & check in");
    await clickButton(page, "Return & check in");
    await waitForText(page, "Yes, I finished it");
    await clickButton(page, "Yes, I finished it");
    await waitForText(page, "Run verification");
    await clickButton(page, "Run verification");
    await waitForText(page, "Claim XP & rest", 25000);
    await clickButton(page, "Claim XP & rest");
    await waitForText(page, "I'm Done for Today");
    await clickButton(page, "I'm Done for Today");
    await sleep(800);
    await waitForText(page, "Today's step is done");
    await shot(page, "fig16-task-completed");

    await page.goto(BASE + "/journey", { waitUntil: "load", timeout: 120000 });
    await waitForText(page, "My Journey");
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    await shot(page, "fig17-timeline-completed");
  } catch (err) {
    await page.screenshot({ path: path.join(OUT, "_timeline_debug.png"), fullPage: true }).catch(() => {});
    console.error(err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
