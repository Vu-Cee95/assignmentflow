/*
 * AssignmentFlow screenshot capture for the POE report.
 * Usage: node scripts/screenshots.js            (auto-starts nothing; expects dev server on port 3210)
 *        node scripts/screenshots.js <base-url>  (optional override, defaults to http://localhost:3210)
 *
 * Produces screenshots/mobile/NN-name.png and screenshots/desktop/NN-name.png (25 each).
 * Requires `npm run dev -- --webpack -p 3210` to be running.
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE = process.argv[2] || "http://localhost:3210";
const CHROME =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.join(__dirname, "..", "screenshots");

const VIEWPORTS = [
  { set: "mobile", width: 375, height: 812 },
  { set: "desktop", width: 1280, height: 800 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function norm(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

async function waitForText(page, needle, timeout = 15000) {
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

/* Returns true when the button's normalized text matches. */
async function clickButton(page, label, { exact = false, tabs = "exclude", index = 0 } = {}) {
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
      .filter((b) => b.display !== "none" && b.visibility !== "hidden")
  );
  let matches = visibleButtons.filter((b) =>
    exact ? b.text === target : b.text.includes(target)
  );
  if (tabs === "exclude") matches = matches.filter((b) => !b.tab);
  if (tabs === "only") matches = matches.filter((b) => b.tab);
  if (matches.length === 0) throw new Error(`No button matching "${target}"`);
  const pick = matches[Math.min(index, matches.length - 1)];
  await page.$$eval(
    "button",
    (els, i) => els[i].click(),
    pick.i
  );
}

/* Set a controlled input value the way React expects (native setter + events). */
async function fillInput(page, selector, value) {
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

async function navigate(page, url, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(1500);
      return;
    } catch (err) {
      lastErr = err;
      await sleep(1500);
    }
  }
  throw lastErr;
}

async function shot(page, set, name, extraDelay = 0) {
  if (extraDelay) await sleep(extraDelay);
  const dir = path.join(OUT, set);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name + ".png");
  await page.screenshot({ path: file, fullPage: true });
  const size = fs.statSync(file).size;
  console.log(`  ✔ ${name} (${(size / 1024).toFixed(1)} KB)`);
}

async function warmUp(page) {
  const routes = [
    "/", "/login", "/signup", "/onboarding",
    "/dashboard", "/assignments", "/assignments/create", "/flowcite",
    "/journey", "/achievements", "/social", "/rewards", "/settings",
  ];
  for (const route of routes) {
    try {
      await navigate(page, BASE + route);
      await sleep(300);
    } catch (err) {
      console.log(`  warm-up skipped ${route}: ${err.message}`);
    }
  }
  await navigate(page, BASE + "/login");
  await waitForText(page, "Continue with Google");
}

async function signInAndOnboard(page) {
  // login
  await clickButton(page, "Continue with Google");
  await sleep(700);
  await waitForText(page, "How do assignments usually get done?");
  // step 1
  await clickButton(page, "The night before it's due");
  await clickButton(page, "Next", { exact: true });
  await sleep(400);
  await waitForText(page, "What would actually help you finish?");
}

async function captureSet(page, set) {
  // --- Auth + onboarding (shots 1-4) ---
  await navigate(page, BASE + "/login");
  await waitForText(page, "Continue with Google");
  await sleep(700);
  await shot(page, set, "01-login");

  await clickButton(page, "Continue with Google");
  await waitForText(page, "How do assignments usually get done?");
  await shot(page, set, "02-onboarding-about-you");

  await clickButton(page, "The night before it's due");
  await clickButton(page, "Next", { exact: true });
  await waitForText(page, "What would actually help you finish?");
  await clickButton(page, "Rewards for finishing");
  await clickButton(page, "Help writing references");
  await shot(page, set, "03-onboarding-your-needs");

  await clickButton(page, "Next", { exact: true });
  await waitForText(page, "Set a pace that quietly works.");
  await clickButton(page, "Cruiser");
  await shot(page, set, "04-onboarding-your-pace");

  await clickButton(page, "Get Started");
  await sleep(1000);

  // --- Dashboard flow (shots 5-12) ---
  await waitForText(page, "Today's step");
  await shot(page, set, "05-dashboard-ready");

  await clickButton(page, "Start today's target");
  await sleep(500);
  await waitForText(page, "Return & check in");
  await shot(page, set, "06-dashboard-in-progress");

  await clickButton(page, "Return & check in");
  await waitForText(page, "How did it go?");
  await shot(page, set, "07-check-in");

  await clickButton(page, "Feel good");
  await sleep(300);
  await clickButton(page, "Almost there");
  await sleep(800);
  await waitForText(page, "Finish check-in");
  await clickButton(page, "Finish check-in");
  await sleep(500);

  await waitForText(page, "Let's verify your session");
  await shot(page, set, "08-verification-intro");

  await clickButton(page, "Run verification");
  await sleep(1100);
  await shot(page, set, "09-verification-running");

  await waitForText(page, "Claim XP & rest", 15000);
  await shot(page, set, "10-verification-result");

  await clickButton(page, "Claim XP & rest");
  await waitForText(page, "That's today's step done");
  await shot(page, set, "11-rest-reminder");

  await clickButton(page, "Enjoy your rest");
  await sleep(600);
  await waitForText(page, "Today's step is done");
  await shot(page, set, "12-dashboard-completed");

  // --- Assignments + plan wizard (shots 13-17) ---
  await navigate(page, BASE + "/assignments");
  await waitForText(page, "Assignments");
  await shot(page, set, "13-assignments");

  await clickButton(page, "New assignment");
  await waitForText(page, "Plan a new assignment");
  await fillInput(page, "#plan-code", "WEDE5020");
  await fillInput(page, "#plan-title", "Interactive Media Website Project");
  await fillInput(page, "#plan-due", "2026-12-18");
  await sleep(300);
  await shot(page, set, "14-create-details");

  await clickButton(page, "Generate my recommended plan");
  await waitForText(page, "Recommended plan");
  await shot(page, set, "15-plan-recommended");

  await clickButton(page, "Adjust plan");
  await waitForText(page, "Tweak the steps");
  await fillInput(page, '[aria-label="Step 1 minutes"]', "45");
  await sleep(300);
  await shot(page, set, "16-plan-adjust");

  await clickButton(page, "Save plan & review");
  await waitForText(page, "Plan accepted");
  await shot(page, set, "17-plan-accepted");

  await clickButton(page, "Add to my plan");
  await sleep(800);

  // --- FlowCite (shots 18-22) ---
  await navigate(page, BASE + "/flowcite");
  await waitForText(page, "FlowCite");
  await fillInput(
    page,
    "#fc-question",
    "Discuss the role of visibility of system status and clear feedback in the interface design of a mobile banking app."
  );
  await sleep(200);
  await shot(page, set, "18-flowcite-paste");

  await clickButton(page, "Analyse Question");
  await waitForText(page, "Suggested sources", 20000);
  await sleep(600);
  await shot(page, set, "19-flowcite-sources");

  await clickButton(page, "Use this source");
  await waitForText(page, "Build your citation");
  await fillInput(page, "#page-number", "12–18");
  await sleep(300);
  await shot(page, set, "20-flowcite-citation");

  await clickButton(page, "Generate Reference");
  await waitForText(page, "Your Harvard reference");
  await shot(page, set, "21-flowcite-reference");

  await clickButton(page, "Save to My References");
  await waitForText(page, "Saved to My References");
  await sleep(300);
  await clickButton(page, "My References");
  await waitForText(page, "12–18", 8000);
  await shot(page, set, "22-my-references");

  // --- Journey, Social, Rewards (shots 23-25) ---
  await navigate(page, BASE + "/journey");
  await waitForText(page, "My Journey");
  await shot(page, set, "23-journey");

  await navigate(page, BASE + "/social");
  await waitForText(page, "Support wall");
  await shot(page, set, "24-social");

  await navigate(page, BASE + "/rewards");
  await waitForText(page, "Rewards");
  await shot(page, set, "25-rewards");
}

let browser;

async function main() {
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.set.toUpperCase()} (${vp.width}x${vp.height}) ===`);
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(60000);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await warmUp(page);
    await captureSet(page, vp.set);
    await context.close();
  }

  await browser.close();
  console.log("\nDone. Screenshots in:", OUT);
}

main().catch(async (err) => {
  console.error("Capture failed:", err);
  if (browser) {
    try {
      const pages = await browser.pages();
      if (pages.length) {
        const debugFile = path.join(OUT, "_debug_failure.png");
        await pages[pages.length - 1].screenshot({ path: debugFile });
        console.log("Debug screenshot:", debugFile);
      }
    } catch (e) {
      console.error("Could not dump debug screenshot:", e.message);
    }
    await browser.close();
  }
  process.exit(1);
});