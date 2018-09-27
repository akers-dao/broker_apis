const { decrypt } = require('../../shared/encryption')

/**
 * Login
 *
 * @param {Page} page
 * @param {string} username
 * @param {string} password
 */
async function login(browser, username, password) {

    try {
        const context = await browser.createIncognitoBrowserContext();

        // Create a new page inside context.
        page = await context.newPage();

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
        await page.screenshot({ path: 'robinhood.png' });

        return browser.browserContexts().filter(b => b.isIncognito()).length;

    } catch (error) {
        console.error(error)
        return error;
    }
}

module.exports = login;