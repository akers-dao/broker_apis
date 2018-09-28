const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const saveSubscription = require('./notification/save-subscription');
const getSubscriptions = require('./notification/get-subscriptions');
const sendNotifications = require('./notification/send-notifications');
const login = require('./stock_apis/robinhood/login');
const executeOptionOrder = require('./stock_apis/robinhood');
const profile = require('./stock_apis/robinhood/profile');
const puppeteer = require('puppeteer');
const { encrypt } = require('./shared/encryption')

const adapter = new FileSync('.data/db.json');
const db = low(adapter);
db.defaults({
    subscriptions: []
}).write();

let browser;

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

// Notification APIs
app.route('/api/saveSubscription').post(saveSubscription);
app.route('/api/sendNotifications').post(sendNotifications);
app.route('/api/getSubscriptions').get(getSubscriptions);

/**
 * Robinhood API
 * 
 * Request = {
 *   password:'xxxxxxxx',
 *   user:'xxxxx'
 * }
 * Response = { token:1 }
 */
app.route('/api/login').post(async (req, res) => {
    try {
        browser = browser ? browser : await puppeteer.launch({
            headless: true,
            defaultViewport: {
                width: 1024,
                height: 8000
            }
        });

        const token = await login(browser, req.body.user, req.body.password);

        res.status(200).json({
            token
        });

    } catch (error) {
        res.status(500).json({
            error
        });
    }
});

/**
 * Robinhood API
 * 
 * Request = {
 *   token: '1'
 * }
 * 
 */
app.route('/api/logout').post(async (req, res) => {
    if (req.body.token && browser) {
        try {
            const context = getContext(browser, req.body.token);

            context.close();

            res.status(200).end();

        } catch (error) {
            res.status(500).json({
                error
            });
            console.log(error)
        }

        return;
    }
});

/**
 * Robinhood API
 * 
 * Request = {
 *   stock: 'baba',
 *   month: 'October',
 *   date: '26',
 *   amount: '$170',
 *   quantity: '1',
 *   price: '1.25',
 *   token: '1'
 * }
 * Response = { confirmationText }
 */
app.route('/api/executeOptionOrder').post(async (req, res) => {
    if (req.body.token && browser) {
        try {
            const context = getContext(browser, req.body.token);

            if (context) {
                // Get open pages inside context.
                const page = await getPage(context, req.body.token);

                const result = await executeOptionOrder(page, req, res);

                res.status(200).json({
                    result
                });
            } else {
                res.status(500).send('missing a context');
            }

        } catch (error) {
            res.status(500).json({
                error
            });
            console.log(error)
        }

        return;
    }

    res.status(500).json({
        error: 'missing required token'
    });
});

app.route('/api/profile').post(async (req, res) => {
    if (req.body.token && browser) {
        try {
            const context = getContext(browser, req.body.token);

            if (context) {
                // Get open pages inside context.
                const page = await getPage(context, req.body.token);

                const result = await profile(page);
                const props = ['emailAddress', 'address', 'phoneNumber','name']
                const response = result.reduce((acc, v, i) => {
                    return { ...acc, [props[i]]: v }
                }, {})
                res.status(200).json(response);
            } else {
                res.status(500).send('missing a context');
            }

        } catch (error) {
            res.status(500).json({
                error
            });
            console.log(error)
        }

        return;
    }
});

/**
 * Encrypt value used for APIs
 */
app.route('/api/encrypt').post((req, res) => {
    if (req.body.value) {
        res.status(200).send(encrypt(req.body.value));
        return;
    }

    res.status(500).send('missing value to encrypt');
});

/**
 * Get Context
 *
 * @param {*} browser
 * @param {string} token
 * @returns
 */
function getContext(browser, token) {
    return browser.browserContexts().find(b => b.isIncognito() && b.token === token);
}

/**
 * Get Page
 *
 * @param {*} context
 * @param {string} token
 * @returns
 */
async function getPage(context, token) {
    const ctxBrowser = context.browser();

    const pages = await ctxBrowser.pages();

    return pages.find(p => p.target().browserContext().token === token);
}


app.listen(3000, () => console.log('Beanvest Web Notification App listening on port 3000!'));