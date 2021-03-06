const searchForStock = require('./search-for-stock');
const { decrypt } = require('../../shared/encryption');
const getConfirmationText = require('./get-confirmation-text');
const getPurchaseInfo = require('./get-purchase-info');
const isEmpty = require('../../shared/is-empty');

async function buyOption(page, req) {
    try {
        // Search for stock
        await searchForStock(page, req.stock);

        // Click on `Trade xxx Options` button
        await page.click('.sidebar-buttons > a');
        await page.waitForSelector('input');

        // Select expiration date from drop down
        await selectExpirationDate(page, req.date);

        // Select strike price from table
        await selectStrikePrice(page, req.amount, req.type);

        await page.waitFor('form [type="button"]');

        // Execute option order
        await executeOptionOrder(page, req.quantity, req.price);

        // Extract confirmation text
        const confirmationText = await getConfirmationText(page);

        await page.click('[type="submit"]');

        await page.waitFor(1000);

        // check for the account verify page
        const hasVerifyPage = (await page.$('[name="password"]')) !== null;

        if (hasVerifyPage) {
            await page.type('[name="password"]', decrypt(req.password));
            await page.click('footer [type="submit"]');
        }

        // extract the purchase information
        const purchaseInfo = await getPurchaseInfo(page);

        return { confirmationText: confirmationText.replace(/\n      /g, ' '), purchaseInfo };

    } catch (error) {
        console.error(error);
        return error
    }

}

/**
 * Chooose expiration date from drop down
 *
 * @param {Page} page
 * @param {string} month
 * @param {string} date
 */
async function selectExpirationDate(page, date) {
    try {
        // Open expiration dates drop down
        await page.click(`input`);

        // Click on an expiration date
        await page.evaluate(date => {
            const options = document.querySelectorAll('[role="option"]');

            const index = Array.from(options)
                .map(e => e.textContent)
                .findIndex(d => d === date);

            options[index].click();
        }, date)

    } catch (error) {
        console.error(error);
    }
}

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

        await page.evaluate((amount) => {
            // Get strike price table
            const strikePriceTable = Array.from(document.querySelectorAll('.row > div > div'))
                .map(e => e.querySelector('h3'))
                .filter(e => e !== null)
                .map(e => e.textContent !== 'Trade Options' ? e.textContent.match(/\$\d*/)[0] : '')

            const strikePriceIndex = strikePriceTable.findIndex(s => s === amount);

            // select the strike price
            const strikePriceBtn = document.querySelectorAll('.row > div > div')[strikePriceIndex].querySelector('div:nth-of-type(6) > h3  > div > div:nth-child(2)');

            strikePriceBtn.click();
        }, amount)

    } catch (error) {
        console.error(error)
    }
}

/**
 * Execute option order
 *
 * @param {Page} page
 * @param {string} quantity
 * @param {string} price
 */
async function executeOptionOrder(page, quantity, price) {
    try {
        await page.click('form [type="button"]');

        await page.waitFor('form [name="quantity"]');

        await page.type('form [name="quantity"]', quantity);

        const bid = await page.evaluate(() => {
            return document.querySelector('form > div > div > div > div:nth-of-type(2)')
                .textContent
                .match(/\$\d.\d{2}/)[0];
        })

        price = isEmpty(price) ? bid : price;

        await page.type('form [name="price"]', price);

        await page.click('form [type="submit"]');

        await page.waitForSelector('form [type="button"]');

    } catch (error) {
        console.log(error);
        return error;
    }
}

module.exports = { buyOption, selectExpirationDate };