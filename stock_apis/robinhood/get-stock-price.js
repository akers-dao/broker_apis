const searchForStock = require('./search-for-stock');

/**
 * Extract and return purchse info
 *
 * @param {Page} page
 * @param {string} stock
 */
async function getStockPrice(page, stock) {
    try {

        await searchForStock(page, stock);

        return await page.evaluate(() => {
            const price = document.querySelector('[data-testid="ChartSection"] header h1 div div:nth-child(1)').textContent;
            return { price };
        });
    } catch (error) {
        console.error(error);
        return error;
    }
}

module.exports = getStockPrice;