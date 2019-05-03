const { decrypt } = require('../../shared/encryption');
const crypto = require('crypto');

/**
 * Login
 *
 * @param {Page} page
 * @param {string} username
 * @param {string} password
 */
async function login(browser, username, password) {

    try {
        const browserContext = await browser.createIncognitoBrowserContext();

        const token = crypto.createHash('md5').update(username + password).digest('hex');
        browserContext.token = token;

        // Create a new page inside context.
        const page = await browserContext.newPage();
        page.setCookie({
            name:'device_id',
            value: '2df69dda-d90f-4636-ba96-37bb6c037887',
            domain: '.robinhood.com',
            path: '/',
            expires: 1872267067000
        });

        await page.setExtraHTTPHeaders({
            Referer: 'https://robinhood.com/'
        });

        // Login 
        await page.goto('https://robinhood.com/login');
        await page.type('[name="username"]', username);
        await page.type('[name="password"]', decrypt(password));
        await page.click('[type="submit"]');
        await page.waitForNavigation();

        return token;

    } catch (error) {
        console.error(error)
        return error;
    }
}

module.exports = login;