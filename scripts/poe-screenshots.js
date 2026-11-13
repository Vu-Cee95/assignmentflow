/*
 * Capture the Part 2 report figures only (desktop 1280x800).
 * Expects: npm run dev -- --webpack -p 3210
 */
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

async function clickButton(page, label, { exact = false } = {}) {
  const target = norm(label);
  const visibleButtons = await page.$$eval("button", (els) =>
    els
      .map((el, i) => ({
        i,
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
        tab: el.getAttribute("role") === "tab",
        display: getComputedStyle(el).display,
        visibility: getComputedStyle(el).visibility,
      }))
      .filter((b) => b.display !== "none" && b.visibility !== "hidden" && !b.tab)
  );
  const matches = visibleButtons.filter((b) =>
    exact ? b.text === target : b.text.toLowerCase().includes(target.toLowerCase())
  );
  if (matches.length === 0) throw new Error(`No button matching "${target}"`);
  await page.$$eval("button", (els, i) => els[i].click(), matches[0].i);
}

async function fillInput(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 15000 });
  await page.$eval(
    selector,
    (el, v) => {
      const proto =
        el.tagName === "SELECT"
          ? HTMLSelectElement.prototype
          : el.tagName === "TEXTAREA"
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value
  );
}

async function shot(page, name) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal, #webpack-dev-server-client-overlay").forEach((el) => el.remove());
  });
  const file = path.join(OUT, name + ".png");
  await sleep(400);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✔ ${name} (${(fs.statSync(file).size / 1024).toFixed(1)} KB)`);
}

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}`);
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
    args: ["--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto(BASE + "/login", { waitUntil: "load", timeout: 120000 });
    await waitForText(page, "Continue with Google");
    await clickButton(page, "Continue with Google");
    await waitForText(page, "The mountain");
    await clickButton(page, "Skip for now");
    await waitForText(page, "Today's step");
    await shot(page, "fig2-dashboard");

    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        (b.textContent || "").includes("Start today's target")
      );
      btn?.focus();
    });
    await shot(page, "fig10-focus");

    await clickButton(page, "Start today's target");
    await waitForText(page, "Ready when you are");
    await shot(page, "fig3-start-modal");
    await clickButton(page, "Minimize & Work");
    await waitForText(page, "Return & check in");
    await shot(page, "fig2b-working");

    await clickButton(page, "Return & check in");
    await waitForText(page, "Did you manage to make progress");
    await shot(page, "fig4-checkin");

    await clickButton(page, "Not yet");
    await waitForText(page, "Life happens");
    await shot(page, "fig5-not-yet");

    await clickButton(page, "Start today's target");
    await waitForText(page, "Minimize & Work");
    await clickButton(page, "Minimize & Work");
    await waitForText(page, "Return & check in");
    await clickButton(page, "Return & check in");
    await waitForText(page, "Yes, I finished it");
    await clickButton(page, "Yes, I finished it");
    await waitForText(page, "Run verification");
    await shot(page, "fig4b-verify");
    await clickButton(page, "Run verification");
    await waitForText(page, "Claim XP & rest", 20000);
    await clickButton(page, "Claim XP & rest");
    await waitForText(page, "I'm Done for Today");
    await shot(page, "fig6-rest");

    await page.goto(BASE + "/assignments/create", { waitUntil: "domcontentloaded" });
    await waitForText(page, "Plan a new assignment");
    await fillInput(page, "#plan-code", "HCIN6222");
    await fillInput(page, "#plan-title", "HCI POE Part 2");
    await fillInput(page, "#plan-due", "2020-01-01");
    await sleep(400);
    await shot(page, "fig1-create");

    await page.goto(BASE + "/flowcite", { waitUntil: "domcontentloaded" });
    await waitForText(page, "FlowCite");
    await fillInput(
      page,
      "#fc-question",
      "How do daily targets and rest reminders reduce assignment overwhelm for university students?"
    );
    await clickButton(page, "Analyse Question");
    await waitForText(page, "Suggested sources", 25000);
    await clickButton(page, "Use this source");
    await waitForText(page, "Build your citation");
    const pageField = await page.$("#page-number");
    if (pageField) await fillInput(page, "#page-number", "12–18");
    const extraRequired = await page.$$eval("input", (els) =>
      els
        .filter((el) => el.placeholder && /required|e\.g\./i.test(el.placeholder) === false)
        .map((el) => el.id)
    );
    if (await page.$("#cite-source")) {
      /* already filled from source */
    }
    try {
      await clickButton(page, "Generate Reference");
      await waitForText(page, "Your Harvard reference");
    } catch {
      /* citation extras may still be missing — sources list is enough */
    }
    await shot(page, "fig7-flowcite");

    await page.goto(BASE + "/social", { waitUntil: "domcontentloaded" });
    await waitForText(page, "Support wall");
    await shot(page, "fig8-social");

    await page.goto(BASE + "/rewards", { waitUntil: "domcontentloaded" });
    await waitForText(page, "Rewards");
    await shot(page, "fig9-rewards");

    console.log("Report figures saved to", OUT);
  } catch (err) {
    const debug = path.join(OUT, "_debug.png");
    await page.screenshot({ path: debug, fullPage: true }).catch(() => {});
    console.error(err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
