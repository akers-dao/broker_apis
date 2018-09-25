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
 *   password:'8e49b5280fe18de9d4fdaf6d2d5ccc89:2e3fce244a3dc288d07a37b8fa69cfae',
 *   user:'akers.dao'
 * }
 * Response = { token:1 }
 */
app.route('/api/login').post(async (req, res) => {
    try {
        browser = await puppeteer.launch({
            headless: true
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
 *   stock: 'baba',
 *   month: 'October',
 *   date: '26',
 *   amount: '$170',
 *   quantity: '1',
 *   price: '1.25',
 * }
 * Response = { confirmationText }
 */
app.route('/api/executeOptionOrder').post(async (req, res) => {
    const browserContexts = browser.browserContexts();

    if (req.token) {
        try {
            const context = browserContexts[req.token];

            // Get open pages inside context.
            const browser = context.browser();
            const page = (await browser.pages())[0];

            const confirmationText = await executeOptionOrder(page, req, res);

            res.status(200).json({
                confirmationText
            });

        } catch (error) {
            res.status(500).json({
                error
            });
        }

        return;
    }

    res.status(500).json({
        error: 'missing required token'
    });

});


app.listen(3000, () => console.log('Beanvest Web Notification App listening on port 3000!'));