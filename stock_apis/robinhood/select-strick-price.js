/**
 * Select strike price from table
 *
 * @param {Page} page
 * @param {string} amount
 */
async function selectStrickPrice(page, amount) {
    try {
        await page.waitForResponse(response => {
            return response.url().includes('https://nummus.robinhood.com/accounts/') && 
            response.status() === 200
        });

        // Get strike price table
        const strikePriceTable = await page.$$eval('.row > div > div', el =>
            Array.from(el).map(e => e.querySelector('h3')).filter(e => e !== null).map(e => e.textContent)
        )

        const strickPriceIndex = strikePriceTable.findIndex(s => s === amount)

        // select the strike price
        let btn = (await page.$x(`//*[@id="react_root"]/div/main/div[2]/div/div[1]/main/div/div/div/div[${strickPriceIndex + 1}]/div/div/div/div[1]/div[6]/h3/div`))[0];
        btn.click();

    } catch (error) {
        console.error(error)
    }
}

module.exports = selectStrickPrice;