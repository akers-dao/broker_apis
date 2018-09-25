/**
 * Search for stock
 *
 * @param {Page} page
 * @param {string} stock
 */
async function searchForStock(page, stock) {
    await page.type('input', stock);
    await page.waitForSelector('.Select-menu-outer');
    await page.keyboard.down('Enter');
    await page.waitForNavigation({ timeout: 0, waitUntil: 'networkidle0' });
}

module.exports = searchForStock;