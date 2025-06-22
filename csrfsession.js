import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
dotenv.config();

const {
  SESSIONID,
  CSRFTOKEN,
  TARGET_POST_URL,
  COMMENT_TEXT,
} = process.env;

if (!SESSIONID || !CSRFTOKEN || !TARGET_POST_URL || !COMMENT_TEXT) {
  console.error('Missing one of SESSIONID, CSRFTOKEN, TARGET_POST_URL, COMMENT_TEXT in .env');
  process.exit(1);
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

  await page.setCookie(
    {
      name: 'sessionid',
      value: SESSIONID,
      domain: '.instagram.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
    {
      name: 'csrftoken',
      value: CSRFTOKEN,
      domain: '.instagram.com',
      path: '/',
      secure: true,
      sameSite: 'Lax',
    }
  );

  console.log('Validating session...');
  await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
  const isLoggedIn = await page.$('nav'); 

  if (!isLoggedIn) {
    console.error('Session cookies are invalid or expired.');
    await browser.close();
    process.exit(1);
  }

  console.log('Session validated. Logged in.');

  console.log(`Navigating to post: ${TARGET_POST_URL}`);
  await page.goto(TARGET_POST_URL, { waitUntil: 'networkidle2' });

  const COMMENT_PANE_SELECTOR = 'textarea[aria-label^="Add a comment"], div[role="textbox"][contenteditable]';
  let commentBox = await page.$(COMMENT_PANE_SELECTOR);

  if (!commentBox) {
    const COMMENT_ICON = 'svg[aria-label="Comment"]';
    const btn = await page.$(COMMENT_ICON);
    if (btn) {
      await btn.click();
      await page.waitForSelector(COMMENT_PANE_SELECTOR, { visible: true, timeout: 15000 });
      commentBox = await page.$(COMMENT_PANE_SELECTOR);
    }
  }

  if (!commentBox) {
    console.error(' Could not find comment box.');
    await browser.close();
    process.exit(1);
  }

  console.log('Typing comment');
  await commentBox.click();
  await commentBox.type(COMMENT_TEXT, { delay: 40 });
  console.log('Pressing Enter to submit');
  await page.keyboard.press('Enter');

  const sleep = ms => new Promise(res => setTimeout(res, ms));
  await sleep(2500);

  console.log('Comment posted successfully!');
  await browser.close();
})().catch((err) => {
  console.error(' Failed to post comment:', err);
  process.exit(1);
});
