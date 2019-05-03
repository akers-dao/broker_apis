require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const saveSubscription = require('./notification/save-subscription');
const getSubscriptions = require('./notification/get-subscriptions');
const sendNotifications = require('./notification/send-notifications');
const login = require('./stock_apis/robinhood/login');
const { buyOption } = require('./stock_apis/robinhood/buy-option');
const profile = require('./stock_apis/robinhood/profile');
const account = require('./stock_apis/robinhood/account');
const sellOption = require('./stock_apis/robinhood/sell-option');
const getOptionsInstruments = require('./stock_apis/robinhood/get-options-instruments');
const puppeteer = require('puppeteer');
const { encrypt } = require('./shared/encryption');
const getContext = require('./shared/get-context');
const getPage = require('./shared/get-page');
const getStockInfo = require('./shared/get-stock-info');
const getStockPrice = require('./stock_apis/robinhood/get-stock-price');
const getEarningsList = require('./stock_apis/earnings_whispers/get-earnings-List');
const { from } = require('rxjs');
const { mergeMap, toArray, tap } = require('rxjs/operators');
const errorhandler = require('errorhandler');
const notifier = require('node-notifier');
const md = require('markdown-it')({ breaks: true });

require('events').EventEmitter.defaultMaxListeners = 150;

const adapter = new FileSync('tmp/db.json');
const db = low(adapter);
db.defaults({
    subscriptions: []
}).write();

let browser, earingsBrowser, context;

const app = express();

if (process.env.NODE_ENV === 'development') {
    // only use in development
    app.use(errorhandler({ log: false }))
}

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
        catchErrorhandler(error);
    }
});

app.route('/api/earningsList/:view').get(earningsList);

app.route('/api/earningsList').post(earningsList);

async function earningsList(req, res) {
    try {
        earingsBrowser = await puppeteer.launch({
            headless: true,
            defaultViewport: {
                width: 1024,
                height: 8000
            }
        });

        const result = await getEarningsList(earingsBrowser, req.body.day);

        if (req.params.view === 'full') {
            const markdown = result
                .map(v =>
                    `
                        ## ${v.company} (${v.symbol})
                        ---
                        | First Header  | Second Header |
                        | ------------- | ------------- |
                        | Content Cell  | Content Cell  |
                        | Content Cell  | Content Cell  |

                    `
                )
                .join('\n');
            res.status(200).send(md.render(markdown));
        } else {
            res.status(200).json({ result });
        }

    } catch (error) {
        catchErrorhandler(error);
    }
}

app.route('/api/stockInfo').post(async (req, res) => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            defaultViewport: {
                width: 1024,
                height: 8000
            }
        });

        const result = await getStockInfo(browser, req.body.symbol);
        res.status(200).json({ result });
    } catch (error) {
        catchErrorhandler(error);
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

/** TODO: ADD WebSocket  */
//initialize the WebSocket server instance
const wss = new WebSocket.Server({
    port: 8080
});

wss.on('connection', (ws) => {
    ws.isAlive = true;
    //connection is up, let's add a simple simple event
    ws.on('message', async (message) => {
        try {
            const m = JSON.parse(message);
            const page = await getPage(context, m.token)
            const result = await getStockPrice(page, m.stock);
            console.log('received: %s', { result });
            ws.send({ result });
        } catch (error) {
            console.error(error)
        }
    });

    //send immediatly a feedback to the incoming connection    
    ws.send('Hi there, I am a WebSocket server');
    ws.on('open', function open() {
        ws.send('something');
    });
});
/** TODO: ADD WebSocket  */

app.use(async function (req, res, next) {
    if (req.body.orders === undefined) {
        if (req.body.token === undefined || browser === undefined) {
            res.status(500).json({ error: 'missing a context' });
            return;
        }

        // Get open pages inside context.
        context = getContext(browser, req.body.token);
        res.locals.context = context;
        if (res.locals.context === undefined) {
            res.status(500).json({ error: 'missing a context' });
            return;
        }

        try {
            res.locals.page = await getPage(res.locals.context, req.body.token);
        } catch (error) {
            catchErrorhandler(error);
        }
    }
    next();
})

/**
 * Robinhood API
 * 
 * Request = {
 *   token: '1'
 * }
 * 
 */
app.route('/api/logout').post(async (req, res) => {
    try {
        res.locals.context.close();
        res.status(200).json({ token: req.body.token, success: 'ok' });
    } catch (error) {
        res.status(500).json({
            token: req.body.token,
            error: JSON.stringify(error.stack)
        });
        console.log(error)
    }
});

/**
 * Robinhood API
 * 
 * Request = {
 *   stock: 'baba',
 *   date: 'October 26',
 *   amount: '$170',
 *   quantity: '1',
 *   price: '1.25',
 *   token: '1'
 * }
 * Response = { confirmationText }
 */
app.route('/api/executeOptionOrder').post(async (req, res) => {
    try {
        const result = await buyOption(res.locals.page, req.body);
        res.status(200).json({
            result
        });
    } catch (error) {
        catchErrorhandler(error);
    }
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
            catchErrorhandler(error);
        }

        return;
    }

    res.status(500).json({
        error: 'missing required token'
    });
});

app.route('/api/profile').post(async (req, res) => {
    try {
        const result = await profile(res.locals.page);
        const props = ['emailAddress', 'address', 'phoneNumber', 'name', 'option'];
        const response = result.reduce((acc, v, i) => {
            return { ...acc, [props[i]]: v }
        }, {})
        res.status(200).json(response);
    } catch (error) {
        catchErrorhandler(error);
    }

});

app.route('/api/account').post(async (req, res) => {
    try {
        const result = await account(res.locals.page);
        // const props = ['dayTrades', 'robinhoodGoldHealth', 'buyingPower', 'withdrawableCash']
        // const response = result.reduce((acc, v, i) => {
        //     return { ...acc, [props[i]]: v }
        // }, {})
        res.status(200).json(result);
    } catch (error) {
        catchErrorhandler(error);
    }
});

app.route('/api/sellOption').post(async (req, res) => {
    try {
        const result = await sellOption(res.locals.page, req.body.option, req.body.price, req.body.contracts);
        res.status(200).json({ result });
    } catch (error) {
        catchErrorhandler(error);
    }
});

app.route('/api/optionsInstruments').post(async (req, res) => {
    try {
        const result = await getOptionsInstruments(res.locals.page, req.body.stock, req.body.date, req.body.type);
        res.status(200).json({ result });
    } catch (error) {
        catchErrorhandler(error);
    }
});

app.route('/api/stockPrice').post(async (req, res) => {
    try {
        const result = await getStockPrice(res.locals.page, req.body.stock);
        res.status(200).json({ result });
    } catch (error) {
        catchErrorhandler(error);
    }
});

function catchErrorhandler(error) {
    res.status(500).json({
        error
    });
    console.log(error)
}

app.listen(3000, () => console.log('Beanvest Web Notification App listening on port 3000!'));