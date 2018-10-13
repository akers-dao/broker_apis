const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const saveSubscription = require('./notification/save-subscription');
const getSubscriptions = require('./notification/get-subscriptions');
const sendNotifications = require('./notification/send-notifications');
const login = require('./stock_apis/robinhood/login');
const buyOption = require('./stock_apis/robinhood/buy-option');
const profile = require('./stock_apis/robinhood/profile');
const account = require('./stock_apis/robinhood/account');
const sellOption = require('./stock_apis/robinhood/sell-option');
const puppeteer = require('puppeteer');
const { encrypt } = require('./shared/encryption');
const getContext = require('./shared/get-context');
const getPage = require('./shared/get-page');
const { from } = require('rxjs');
const { mergeMap, toArray, tap } = require('rxjs/operators');

const adapter = new FileSync('tmp/db.json');
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

                const result = await buyOption(page, req.body);

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

app.route('/api/batchExecuteOptionOrder').post(async (req, res) => {
    if (Array.isArray(req.body.orders) && browser) {
        try {
            from(req.body.orders)
                .pipe(
                    mergeMap(async (order, index) => {
                        if (typeof order === 'string') {
                            order = JSON.parse(order);
                        }

                        if (order.token) {
                            const context = getContext(browser, order.token);

                            if (context) {
                                // Get open pages inside context.
                                const page = await getPage(context, order.token);

                                const result = await buyOption(page, order);

                                return { token: order.token, result };

                            } else {
                                return { token: order.token, error: 'missing a context' };
                            }

                        } else {
                            return { index, error: 'missing a token' };
                        }
                    }),
                    toArray(),
                    tap(orders => {
                        res.status(200).json({
                            orders
                        });
                    })
                )
                .subscribe();
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
                const props = ['emailAddress', 'address', 'phoneNumber', 'name'];
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

app.route('/api/account').post(async (req, res) => {
    if (req.body.token && browser) {
        try {
            const context = getContext(browser, req.body.token);

            if (context) {
                // Get open pages inside context.
                const page = await getPage(context, req.body.token);

                const result = await account(page);
                const props = ['dayTrades', 'robinhoodGoldHealth', 'buyingPower', 'withdrawableCash']
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

app.route('/api/sellOption').post(async (req, res) => {
    if (req.body.token && browser) {
        try {
            const context = getContext(browser, req.body.token);

            if (context) {
                // Get open pages inside context.
                const page = await getPage(context, req.body.token);

                const result = await sellOption(page, req.body.option, req.body.price, req.body.contracts);

                res.status(200).json({ result });
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

app.listen(3000, () => console.log('Beanvest Web Notification App listening on port 3000!'));