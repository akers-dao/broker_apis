/**
 * Extract and return purchse info
 *
 * @param {Page} page
 * @param {string} stock
 */
async function getPurchaseInfo(page) {
    try {
        await page.waitForSelector('.sidebar-content > div div.lined-row');

        return await page.evaluate(() =>
            Array.from(document.querySelectorAll('.sidebar-content > div div.lined-row'))
                .reduce((acc, e) => {
                    return { ...acc, [e.children[0].textContent.replace(/(\w)/, (match) => match.toLowerCase()).replace(/\s/, '')]: e.children[1].textContent }
                }, {})
        );
    } catch (error) {
        console.error(error);
        return error;
    }
}

module.exports = getPurchaseInfo;