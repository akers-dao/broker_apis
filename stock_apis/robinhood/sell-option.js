const isEmpty = require('../../shared/is-empty');
const getConfirmationText = require('./get-confirmation-text');
const getPurchaseInfo = require('./get-purchase-info');

/**
 * User profile
 *
 * @param {Page} page
 * @param {string} stock
 */
async function sellOption(page, option, price, contracts) {
    try {
        let purchaseInfo;

        await page.goto(`https://robinhood.com`);
        await page.waitForSelector('[data-testid="InstrumentPreviewList"]');
        const optionURL = await getOptionURL(page, option);

        // navigate to option page
        await page.goto(optionURL);
        await page.waitForSelector('[data-testid="OrderFormHeading-Sell"]');

        const allContracts = await getAllContracts(page);

        contracts = isEmpty(contracts) ? allContracts : contracts;

        await page.click('[data-testid="OrderFormHeading-Sell"]');
        await page.type('[name="price"]', price);
        await page.type('[name="quantity"]', contracts);
        await page.click('[type="submit"]');
        await page.waitForSelector('[type="button"]');

        // Extract confirmation text
        const confirmationText = await getConfirmationText(page);

        const hasContracts = (await page.$('[type="submit"]')) !== null;

        if (hasContracts) {
            await page.click('[type="submit"]');

            await page.waitFor(1000);

            // check for the account verify page
            const hasVerifyPage = (await page.$('[name="password"]')) !== null;

            if (hasVerifyPage) {
                await page.type('[name="password"]', decrypt(req.password));
                await page.click('footer [type="submit"]');
            }

            purchaseInfo = await getPurchaseInfo(page);
        }


        return { confirmationText: confirmationText.replace(/\n      /g, ' '), purchaseInfo };

    } catch (error) {
        console.error(error);
        return error;
    }
}

async function getOptionURL(page, option) {
    return await page.evaluate((option) => {
        const options = Array.from(document.querySelectorAll('[data-testid="InstrumentPreviewList"] section:first-of-type a'))
            .map(e => e.textContent.match(/^[\w\s]*[$\d]*\s[Call|Put]*/)[0]);

        const optionIndex = options.findIndex(o => o === option);

        const optionURL = Array.from(document.querySelectorAll('[data-testid="InstrumentPreviewList"]  section:first-of-type a'))[optionIndex].href;
        return optionURL;
    }, option);
}

async function getAllContracts(page) {
    return await page.evaluate(() => {
        return document.querySelector('footer').textContent.match(/\d/)[0];
    });
}


module.exports = sellOption;