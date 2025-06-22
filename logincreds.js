
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();
const {
  IG_USERNAME,
  IG_PASSWORD,
  TARGET_POST_URL,
  COMMENT_TEXT,
} = process.env;

if (!IG_USERNAME || !IG_PASSWORD || !TARGET_POST_URL || !COMMENT_TEXT) {
  console.error(
    'Missing one of IG_USERNAME, IG_PASSWORD, TARGET_POST_URL, COMMENT_TEXT in .env'
  );
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COOKIE_PATH = path.join(__dirname, 'cookies.json');

async function loadCookies(page) {
  try {
    const raw = await fs.readFile(COOKIE_PATH, 'utf-8');
    const cookies = JSON.parse(raw);
    if (cookies.length) {
      await page.setCookie(...cookies);
    }
  } catch {
  }
}

async function saveCookies(page) {
  const cookies = await page.cookies();
  await fs.writeFile(COOKIE_PATH, JSON.stringify(cookies, null, 2));
}

async function dismissModal(page) {
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const txt = await page.evaluate((b) => b.innerText, btn);
    if (/Not Now/i.test(txt) || /Ahora no/i.test(txt)) {
      await btn.click();
      await page.waitForTimeout(500);
    }
  }
}

(async () => {
  console.log('Launching headless browser');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await loadCookies(page);
  await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });

  const needsLogin = await page.$('input[name="username"]');
  if (needsLogin) {
    console.log('Logging in');
    await page.type('input[name="username"]', IG_USERNAME, { delay: 50 });
    await page.type('input[name="password"]', IG_PASSWORD, { delay: 50 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    await dismissModal(page);
    await saveCookies(page);
    console.log('Logged in & cookies saved.');
  } else {
    console.log('Logged in via saved cookies.');
  }

  console.log(`Navigating to post: ${TARGET_POST_URL}`);
  await page.goto(TARGET_POST_URL, { waitUntil: 'networkidle2' });

  const DESKTOP = 'textarea[aria-label^="Add a comment"]';
  const MOBILE = 'div[role="textbox"][contenteditable="true"]';
  await page.waitForSelector(`${DESKTOP},${MOBILE}`, {
    visible: true,
    timeout: 45000,
  });

  const commentBox = (await page.$(DESKTOP)) || (await page.$(MOBILE));
  console.log('Typing comment');
  await commentBox.click();
  await commentBox.type(COMMENT_TEXT, { delay: 40 });
  console.log('Pressing Enter to submit');
  await page.keyboard.press('Enter');

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await sleep(2500);

  console.log('Comment posted successfully!');

  await browser.close();
})().catch((err) => {
  console.error('Failed to post comment:', err);
  process.exit(1);
});
