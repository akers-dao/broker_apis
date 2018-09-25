
const { decrypt } = require('../../shared/encryption')

const login = require('./login');
const searchForStock = require('./search-for-stock');
const selectExpirationDate = require('./select-expiration-date');
const selectStrickPrice = require('./select-strick-price');
const executeOptionOrder = require('./execute-option-order');



async function makeARequest(page, req, res) {
    try {

        // Search for stock
        await searchForStock(page, req.body.stock);

        // Click on `Trade xxx Options` button
        await page.click('.sidebar-buttons > a');
        await page.waitForXPath('//*[@id="react_root"]/div/main/div[2]/div/div[1]/main/div/div/div/div[26]/button/span');

        // Select expiration date from drop down
        await selectExpirationDate(page, req.body.month, req.body.date);

        // Select strike price from table
        await selectStrickPrice(page, req.body.amount);

        await page.waitFor(1000);

        // Execute option order
        await executeOptionOrder(page, req.body.quantity, req.body.price);

        const confirmationTextHandle = (await page.$x(`//*[@id="react_root"]/div/main/div[2]/div/div[1]/div/div/div/div[2]/div/div/form/div[1]/div[2]/div[1]`))[0];

        const confirmationText = await page.evaluate(confirmationText => {
            return confirmationText.textContent
        }, confirmationTextHandle);

        console.log(confirmationText.replace(/\n      /g, ' '));

        await page.click('[type="submit"]');

        await page.waitForSelector('[type="button"]');

        // take a screen shot
        await page.screenshot({ path: 'robinhood.png' });
        // browser.close();
        return { confirmationText: confirmationText.replace(/\n      /g, ' ') };

    } catch (error) {
        // console.error(error);
        return error
    }

}

module.exports = makeARequest;
