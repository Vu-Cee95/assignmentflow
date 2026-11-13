/* Capture the FlowCite book example for the Part 2 report. */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const BASE = "http://localhost:3210";
const CHROME =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.join(__dirname, "..", "screenshots", "report");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForText(page, needle, timeout = 60000) {
  const target = needle.toLowerCase();
  await page.waitForFunction(
    (n) => (document.body ? document.body.innerText.toLowerCase().includes(n) : false),
    { timeout },
    target
  );
}

async function clickButton(page, label) {
  const clicked = await page.evaluate((target) => {
    const buttons = [...document.querySelectorAll("button")].filter((el) => {
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.getAttribute("role") !== "tab";
    });
    const match = buttons.find((el) => (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase().includes(target));
    if (!match) return false;
    match.click();
    return true;
  }, label.toLowerCase());
  if (!clicked) throw new Error(`No button matching "${label}"`);
}

async function fillInput(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 15000 });
  await page.$eval(
    selector,
    (el, v) => {
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value
  );
}

async function shot(page, name) {
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
  });
  await sleep(350);
  const file = path.join(OUT, name + ".png");
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", name);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
    args: ["--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  try {
    await page.goto(BASE + "/login", { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(
      () => !document.body.innerText.includes("Loading AssignmentFlow"),
      { timeout: 60000 }
    );
    await waitForText(page, "Continue with Google");
    await clickButton(page, "Continue with Google");
    await waitForText(page, "The mountain");
    await clickButton(page, "Skip for now");
    await waitForText(page, "Today's step");

    await page.goto(BASE + "/flowcite", { waitUntil: "load", timeout: 120000 });
    await waitForText(page, "FlowCite");
    await fillInput(
      page,
      "#fc-question",
      "Explain how Norman's design principles help a student finish one assignment step at a time."
    );
    await clickButton(page, "Analyse Question");
    await waitForText(page, "The Design of Everyday Things", 25000);
    await page.evaluate(() => {
      const heading = [...document.querySelectorAll("h2")].find((h) => h.textContent.includes("Suggested sources"));
      heading?.scrollIntoView({ block: "start" });
    });
    await sleep(400);
    await shot(page, "fig7a-flowcite-sources");

    const opened = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").includes("Use this source"));
      const norman = cards.find((b) => {
        const card = b.closest("div.rounded-2xl, article, section, div");
        return (card?.innerText || "").includes("Design of Everyday Things");
      });
      const target = norman || cards[1];
      if (!target) return false;
      target.click();
      return true;
    });
    if (!opened) throw new Error("Could not open the Norman book source");
    await waitForText(page, "Build your citation");
    await fillInput(page, "#page-number", "10–34");
    await page.evaluate(() => {
      const pageField = document.querySelector("#page-number");
      pageField?.scrollIntoView({ block: "center" });
    });
    await sleep(300);
    await shot(page, "fig7b-flowcite-book");

    await clickButton(page, "Generate Reference");
    await waitForText(page, "Your Harvard reference");
    await page.evaluate(() => {
      const label = [...document.querySelectorAll("span, p, h2")].find((el) =>
        (el.textContent || "").includes("Your Harvard reference")
      );
      label?.closest("div")?.scrollIntoView({ block: "center" });
    });
    await sleep(400);
    await shot(page, "fig7c-flowcite-result");

    await clickButton(page, "Save to My References");
    await waitForText(page, "Saved to My References");
    await page.evaluate(() => {
      const tab = [...document.querySelectorAll('[role="tab"]')].find((el) =>
        (el.textContent || "").includes("My References")
      );
      tab?.click();
    });
    await waitForText(page, "Design of Everyday Things");
    await shot(page, "fig7d-flowcite-saved");
  } catch (err) {
    await page.screenshot({ path: path.join(OUT, "_flowcite_debug.png"), fullPage: true }).catch(() => {});
    console.error(err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
