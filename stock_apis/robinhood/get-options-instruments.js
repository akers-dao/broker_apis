const { selectExpirationDate } = require('./buy-option');
const searchForStock = require('./search-for-stock');
const request = require('request-promise-native')

/**
 * User profile
 *
 * @param {Page} page
 * @param {string} stock
 */
async function getOptionsInstruments(page, stock, date, type = 'call') {
    try {
        // Search for stock
        await searchForStock(page, stock);

        const stockInfo = await request.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stock.toUpperCase()}&apikey=8QDY3P1X6QJL11SR`)
        const stockVolume = JSON.parse(stockInfo)['Global Quote']['06. volume'];

        await page.waitForResponse(response => {
            return response.url().includes('https://nummus.robinhood.com/accounts/') &&
                response.status() === 200
        });

        const stockPrice = await page.evaluate(() =>
            document.querySelector('[data-testid="ChartSection"] h1 div div:nth-child(1)').textContent.match(/\d+\.\d{2}/)[0]
        )

        await page.click('.sidebar-buttons > a');
        await page.waitForSelector('input');

        // Select expiration date from drop down
        await selectExpirationDate(page, date);

        // select CALL or PUT based on type
        await page.evaluate(type => {
            const index = type === 'call' ? 0 : 1;
            Array.from(document.querySelectorAll('footer button')).filter((e, i) => i > 1)[index].click()
        }, type)

        await page.waitForResponse(response => {
            return response.url().includes('https://nummus.robinhood.com/accounts/') &&
                response.status() === 200
        });

        // Get strike price table
        return await page.evaluate(({ type, stockPrice, stockVolume }) => {
            const label = ['strikePrice', 'breakEven', 'toBreakEven', 'percentChange', 'change', 'price'];

            function removeDollarSign(amount) {
                const matchInfo = amount.match(/\d+\.?\d?/)
                let amountWithOutDollarSign = matchInfo === null ? amount : matchInfo[0];

                if (/-/.test(amount)) {
                    amountWithOutDollarSign = `-${amountWithOutDollarSign}`
                }

                return amountWithOutDollarSign;
            }

            function compareStockPrice(strikePrice) {
                return type === 'call' ? parseInt(strikePrice) >= parseInt(stockPrice) : parseInt(strikePrice) <= parseInt(stockPrice);
            }

            const allOpenInterest = Array.from(document.querySelectorAll('section > div > div:nth-child(8) > div:last-child'))

            return Array.from(document.querySelectorAll('.row > div > div > div > div > div > div'))
                .filter(e => e.childElementCount > 1)
                .map((e, idx) => {
                    return Array.from(e.querySelectorAll('h3'))
                        .reduce((acc, el, i) => ({
                            ...acc,
                            [label[i]]: removeDollarSign(el.textContent),
                            stockVolume: new Number(stockVolume).toLocaleString('latn'),
                            openInterest: allOpenInterest[idx].textContent
                        }), {})
                })
                .filter(o => compareStockPrice(o.strikePrice))
        }, { type, stockPrice, stockVolume })

    } catch (error) {
        console.error(error)
    }
}



module.exports = getOptionsInstruments;