/**
 * Select strike price from table
 *
 * @param {Page} page
 * @param {string} amount
 */
async function selectStrickPrice(page, amount) {
    let btn;
    // Get strike price table
    const strikePriceTable = await page.$$eval('.row > div > div', el =>
        Array.from(el).map(e => e.querySelector('h3')).filter(e => e !== null).map(e => e.textContent)
    )

    const strickPriceIndex = strikePriceTable.findIndex(s => s === amount)

    await page.waitFor(1000);

    // select the strike price
    do {
        scrollWindow(page);
        btn = (await page.$x(`//*[@id="react_root"]/div/main/div[2]/div/div[1]/main/div/div/div/div[${strickPriceIndex + 1}]/div/div/div/div[1]/div[6]/h3/div`))[0];
    } while (btn === undefined)

    btn.click();
}

/**
 * Scroll window
 *
 * @param {*} page
 */
async function scrollWindow(page) {
    try {
        const windowScrollY = await page.evaluate(() => window.scrollY)
        await page.evaluate((windowScrollY) => window.scrollTo(1, windowScrollY - 200), windowScrollY)
    } catch (error) {
        console.error(error)
    }
}

module.exports = selectStrickPrice;