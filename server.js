const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const saveSubscription = require('./notification/save-subscription');
const getSubscriptions = require('./notification/get-subscriptions');
const sendNotifications = require('./notification/send-notifications');
const login = require('./stock_apis/robinhood');

const adapter = new FileSync('.data/db.json');
const db = low(adapter);
db.defaults({ subscriptions: [], sessions: [] }).write();

const app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

// Notification APIs
app.route('/api/saveSubscription').post(saveSubscription);
app.route('/api/sendNotifications').post(sendNotifications);
app.route('/api/getSubscriptions').get(getSubscriptions);

// Robinhood APIs
app.route('/api/login').post(login);




app.listen(3000, () => console.log('Beanvest Web Notification App listening on port 3000!'));