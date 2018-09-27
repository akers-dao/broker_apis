/**
 * Search for stock
 *
 * @param {Page} page
 * @param {string} stock
 */
async function searchForStock(page, stock) {
    try {
        await page.goto(`https://robinhood.com/stocks/${stock.toUpperCase()}`);
        await page.waitForSelector('.sidebar-buttons > a');
    } catch (error) {
        console.error(error);
    }
}

module.exports = searchForStock;