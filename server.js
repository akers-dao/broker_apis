const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const saveSubscription = require('./notification/save-subscription');
const getSubscriptions = require('./notification/get-subscriptions');
const sendNotifications = require('./notification/send-notifications');
const login = require('./stock_apis/robinhood/login');
const executeOptionOrder = require('./stock_apis/robinhood');
const puppeteer = require('puppeteer');

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
            const browserContexts = browser.browserContexts().filter(b => b.isIncognito());
            const context = browserContexts[req.body.token - 1];

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
            const browserContexts = browser.browserContexts().filter(b => b.isIncognito());
            const context = browserContexts[req.body.token - 1];

            if (context) {
                // Get open pages inside context.
                const ctxBrowser = context.browser();
                const page = (await ctxBrowser.pages())[req.body.token];

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


app.listen(3000, () => console.log('Beanvest Web Notification App listening on port 3000!'));