const puppeteer = require('puppeteer');

let browser;
/**
 * Login
 *
 * @param {Page} page
 * @param {string} username
 * @param {string} password
 */
async function login(page, username, password) {
    browser = browser ? browser : await puppeteer.launch({ headless: true })
    const browserContexts = browser.browserContexts();
    const context = await browser.createIncognitoBrowserContext();

    // Create a new page inside context.
    const page = await context.newPage();
    await page.setViewport({ width: 1024, height: 768 });
    await page.setExtraHTTPHeaders({ Referer: 'https://robinhood.com/' })

    console.log(context.sessionId);
    console.log(browserContexts.length);

    // Login 
    await page.goto('https://robinhood.com/login');
    await page.type('[name="username"]', username);
    await page.type('[name="password"]', password);
    await page.click('[type="submit"]');
    await page.waitForNavigation({ timeout: 0, waitUntil: 'networkidle0' });

    return browserContexts.length
}

module.exports = login;