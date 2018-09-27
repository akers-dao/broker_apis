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
        await page.type('[name="price"]', price);
    
        await page.click('[type="submit"]');
    
        await page.waitForSelector('[type="button"]');
        
    } catch (error) {
        console.log(error);
    }
}

module.exports = executeOptionOrder;