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
            const name = document.querySelector('.main-container h1').textContent
            const options = document.querySelector('[name="options-trading"] > div') !== null;
            return Array.from(document.querySelectorAll('[name="account"] > div header div:nth-child(2) span'))
                .filter((e, i) => i < 3)
                .map(e => e.textContent)
                .concat(name, options);
        })
    } catch (error) {
        console.error(error);
    }
}

module.exports = userProfile;