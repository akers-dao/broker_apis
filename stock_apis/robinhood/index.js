const searchForStock = require('./search-for-stock');
const selectExpirationDate = require('./select-expiration-date');
const selectStrickPrice = require('./select-strick-price');
const executeOptionOrder = require('./execute-option-order');
const { decrypt } = require('../../shared/encryption');

async function makeARequest(page, req) {
    try {

        // Search for stock
        await searchForStock(page, req.body.stock);

        // Click on `Trade xxx Options` button
        await page.click('.sidebar-buttons > a');
        await page.waitForSelector('input');

        // Select expiration date from drop down
        await selectExpirationDate(page, req.body.month, req.body.date);

        // Select strike price from table
        await selectStrickPrice(page, req.body.amount, req.body.type);

        await page.waitFor(1000);

        // Execute option order
        await executeOptionOrder(page, req.body.quantity, req.body.price);

        // Extract confirmation text
        const confirmationTextHandle = (await page.$x(`//*[@id="react_root"]/div/main/div[2]/div/div[1]/div/div/div/div[2]/div/div/form/div[1]/div[2]/div[1]`))[0];

        const confirmationText = await page.evaluate(confirmationText => {
            return confirmationText.textContent
        }, confirmationTextHandle);

        await page.click('[type="submit"]');

        await page.waitFor(1000);

        // check for the account verify page
        const hasVerifyPage = (await page.$('[name="password"]')) !== null;

        if (hasVerifyPage) {
            await page.type('[name="password"]', decrypt(req.body.password));
            await page.click('footer [type="submit"]');
        }

        // extract the purchase information
        await page.waitForSelector('.sidebar-content > div div.lined-row');

        const purchaseInfo = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.sidebar-content > div div.lined-row'))
                .map(e => Array.from(e.children)
                    .map(c => c.textContent).join(' '))
        );

        return { confirmationText: confirmationText.replace(/\n      /g, ' '), purchaseInfo };

    } catch (error) {
        console.error(error);
        return error
    }

}

module.exports = makeARequest;
