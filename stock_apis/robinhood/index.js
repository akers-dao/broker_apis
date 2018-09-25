
const { decrypt } = require('./encryption')

const login = require('./login');
const searchForStock = require('./search-for-stock');
const selectExpirationDate = require('./select-expiration-date');
const selectStrickPrice = require('./select-strick-price');
const executeOptionOrder = require('./execute-option-order');



async function makeARequest(req, res) {
    try {
        // const Request = {
        //     stock: 'baba',
        //     month: 'October',
        //     date: '26',
        //     amount: '$170',
        //     quantity: '1',
        //     price: '1.25',
        //     password:'8e49b5280fe18de9d4fdaf6d2d5ccc89:2e3fce244a3dc288d07a37b8fa69cfae',
        //     user:'akers.dao'
        // }

        // Login 
        await login(page, req.body.user, decrypt(req.body.password));

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
        res.status(200).send({ confirmationText: confirmationText.replace(/\n      /g, ' ') });

    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }

}

module.exports = makeARequest;
