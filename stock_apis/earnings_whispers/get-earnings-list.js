const getStockInfo = require('../../shared/get-stock-info');
const { from } = require('rxjs');
const { mergeMap, toArray, filter, map } = require('rxjs/operators');
const request = require('request-promise-native');

/**
 * User profile
 *
 * @param {Page} page
 * @param {string} stock
 */
async function getEarningsList(browser, day = 0, type = 'missed') {
    try {
        const browserContext = await browser.createIncognitoBrowserContext();

        // Create a new page inside context.
        const page = await browserContext.newPage();

        // earnings whispers 
        await page.goto(`https://www.earningswhispers.com/calendar?sb=p&d=${day}&t=all`);

        const labels = { 1: 'company', 2: 'symbol', 5: 'estimate_eps', 6: 'estimate_rev', 9: 'actual_eps', 10: 'actual_rev', 18: 'growth', 19: 'surprise', 22: 'guidance_lower' };

        const earnings = await page.evaluate((labels) => {
            return Array.from(document.querySelectorAll('#epscalendar .showconf > div'))
                .map(e =>
                    Array.from(e.querySelectorAll('div'))
                        .reduce((acc, el, i) => {
                            const text = el.textContent.replace(/[\$%]|\sB$/g, '');
                            const value = i === 22 ? el.parentElement.classList[1].toLowerCase() === 'neg' : text;
                            return [0, 3, 4, 7, 8, 11, 12, 13, 14, 15, 16, 17, 20, 21].includes(i) ? acc : { ...acc, [labels[i]]: value }
                        }, {})
                )
                .filter(e => e.symbol !== '' && e.symbol !== 'Meet=' && e.estimate_eps !== 'Rev:')
        }, labels);

        await page.click('#showmore');
        await page.waitForSelector('#morecalendar');

        const moreEarnings = await page.evaluate((labels) => {
            return Array.from(document.querySelectorAll('#morecalendar .showconf > div'))
                .map(e =>
                    Array.from(e.querySelectorAll('div'))
                        .reduce((acc, el, i) => {
                            const text = el.textContent.replace(/[\$%]|\sB$/g, '');
                            const value = i === 22 ? el.parentElement.classList[1].toLowerCase() === 'neg' : text;
                            return [0, 3, 4, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].includes(i) ? acc : { ...acc, [labels[i]]: value }
                        }, {})
                )
                .filter(e => e.symbol !== '' && e.symbol !== 'Meet=' && e.estimate_eps !== 'Rev:')
        }, labels);

        browser.close();

        return await from([...earnings, ...moreEarnings])
            .pipe(
                filterByMissed(type),
                getStock52Weeks(),
                getLastPrice(),
                toArray(),
                sort()
            )
            .toPromise();

    } catch (error) {
        console.error(error);
    }
}

function getStock52Weeks() {
    return mergeMap(e =>
        request.get(`https://api.robinhood.com/fundamentals/${e.symbol.toUpperCase()}/`),
        (e, v) => {
            v = JSON.parse(v);
            return { ...e, high_52_weeks: formatNumber(v.high_52_weeks), low_52_weeks: formatNumber(v.low_52_weeks) }
        });
}

function getLastPrice() {
    return mergeMap(e =>
        request.get(`https://api.robinhood.com/quotes/${e.symbol.toUpperCase()}/`),
        (e, v) => {
            v = JSON.parse(v);
            return { ...e, last_trade_price: formatNumber(v.last_trade_price), last_extended_hours_trade_price: formatNumber(v.last_extended_hours_trade_price) }
        });
}

function filterByMissed(type) {
    return filter(e => {
        if (type === 'all') {
            return true
        }
        
        return e.actual_eps < e.estimate_eps || e.actual_rev < e.estimate_rev
    });
}

function sort() {
    return map(e => {
        const a = e.slice(0);
        return a.sort(compareFunction);
    })
}

function compareFunction(a, b) {
    if (b.actual_eps < b.estimate_eps && b.actual_rev < b.estimate_rev) {
        return -1;
    }
    if (a.actual_eps < a.estimate_eps && a.actual_rev < a.estimate_rev) {
        return 1;
    }
    // a must be equal to b
    return 0;
}

function formatNumber(num) {
    return new Number(num).toFixed(2);
}


module.exports = getEarningsList;