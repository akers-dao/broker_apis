/**
 * Select strike price from table
 *
 * @param {Page} page
 * @param {string} amount
 */
async function selectStrikePrice(page, amount, type = 'call') {
    try {
        await page.evaluate(type => {
            const index = type === 'call' ? 0 : 1;
            Array.from(document.querySelectorAll('footer button')).filter((e, i) => i > 1)[index].click()
        }, type)

        await page.waitForResponse(response => {
            return response.url().includes('https://nummus.robinhood.com/accounts/') &&
                response.status() === 200
        });

        // Get strike price table
        const strikePriceTable = await page.$$eval('.row > div > div', el =>
            Array.from(document.querySelectorAll('.row > div > div'))
                .map(e => e.querySelector('h3'))
                .filter(e => e !== null)
                .map(e => e.textContent !== 'Trade Options' ? e.textContent.match(/\$\d*/)[0] : '')
        )

        const strikePriceIndex = strikePriceTable.findIndex(s => s === amount)

        // select the strike price
        let btn = (await page.$x(`//*[@id="react_root"]/div/main/div[2]/div/div[1]/main/div/div/div/div[${strikePriceIndex + 1}]/div/div/div/div[1]/div[6]/h3/div`))[0];
        btn.click();

    } catch (error) {
        console.error(error)
    }
}

module.exports = selectStrikePrice;