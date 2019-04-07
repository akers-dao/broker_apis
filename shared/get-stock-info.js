/**
 * Get Stock Information
 *
 * @param {*} browser
 * @param {string} token
 * @returns
 */
async function getStockInfo(browser, symbol) {
    try {

        const browserContext = await browser.createIncognitoBrowserContext();

        // Create a new page inside context.
        const page = await browserContext.newPage();

        await page.goto(`https://finance.yahoo.com/quote/${symbol.toUpperCase()}`);

        const stockInfo = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('#quote-summary  table tr'))
                .reduce((acc, e) => ({ ...acc, [e.children[0].textContent]: e.children[1].textContent }), {});
        });

        browser.close();

        return stockInfo;
    } catch (error) {
        console.error(error);
    }
}

module.exports = getStockInfo;