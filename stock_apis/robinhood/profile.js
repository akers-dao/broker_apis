/**
 * User profile
 *
 * @param {Page} page
 * @param {string} stock
 */
async function userProfile(page) {
    try {
        await page.goto(`https://robinhood.com/account/settings`);
        await page.waitForSelector('[name="account"]');
       return await page.evaluate(() => {
           return Array.from(document.querySelectorAll('[name="account"] > div header div:nth-child(2) span'))
                .filter((e, i) => i < 3)
                .map(e => e.textContent);
        })
    } catch (error) {
        console.error(error);
    }
}

module.exports = userProfile;