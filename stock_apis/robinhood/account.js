/**
 * User profile
 *
 * @param {Page} page
 * @param {string} stock
 */
async function account(page) {
    try {
        await page.goto(`https://robinhood.com/account`);
        await page.waitForSelector('section:nth-child(2) .row header');
        await page.waitFor(1000);
        return await page.evaluate(() => {
            return Array.from(document.querySelectorAll('section:nth-child(2) .row header'))
                .filter(e => e.children.length > 1)
                .map(e => e.children[1].textContent);
        })
    } catch (error) {
        console.error(error);
    }
}

module.exports = account;