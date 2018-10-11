/**
 * Execute option order
 *
 * @param {Page} page
 * @param {string} quantity
 * @param {string} price
 */
async function executeOptionOrder(page, quantity, price) {
    try {
        await page.click('[type="button"]');

        await page.type('[name="quantity"]', quantity);
        
        const bid = await page.evaluate(() => {
            return document.querySelector('form label:nth-child(2) > div > div > div:nth-child(2)')
                .textContent
                .match(/\$\d.\d{2}/)[0];
        })

        price = isEmpty(price) ? bid : price;

        await page.type('[name="price"]', price);

        await page.click('[type="submit"]');

        await page.waitForSelector('[type="button"]');

    } catch (error) {
        console.log(error);
        return error;
    }
}

function isEmpty(price){
    return price === '' || price === undefined;
}

module.exports = executeOptionOrder;