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

        // const token = browser.browserContexts().filter(b => b.isIncognito()).length

        const token = crypto.createHash('md5').update(username + password).digest('hex');
        browserContext.token = token;

        // Create a new page inside context.
        const page = await browserContext.newPage();

        await page.setExtraHTTPHeaders({
            Referer: 'https://robinhood.com/'
        });

        // Login 
        await page.goto('https://robinhood.com/login');
        await page.type('[name="username"]', username);
        await page.type('[name="password"]', decrypt(password));
        await page.click('[type="submit"]');
        await page.waitForNavigation();

        // take a screen shot
        // await page.screenshot({ path: 'robinhood.png' });

        return token;

    } catch (error) {
        console.error(error)
        return error;
    }
}

module.exports = login;