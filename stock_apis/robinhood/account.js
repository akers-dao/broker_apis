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

            const portfolio = document.querySelector('header h1 div > div').textContent;
            const dayTrades = document.querySelector('section:nth-of-type(2) > div > div:nth-child(1) header h2').textContent;
            const buyingpower = document.querySelector('section:nth-of-type(2) > div > div:nth-child(2) header h2').textContent;
            const withdrawableCash = document.querySelector('section:nth-of-type(2) > div > div:nth-child(3) header h2').textContent;

            return {
                portfolio,
                dayTrades,
                buyingpower,
                withdrawableCash
            }
        })
    } catch (error) {
        console.error(error);
    }
}

module.exports = account;