
const webpush = require('web-push');
const express = require('express');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('.data/db.json');
const db = low(adapter);

const vapidKeys = {
    "publicKey": process.env.PUBLIC_KEY,
    "privateKey": process.env.PRIVATE_KEY
};

webpush.setVapidDetails(
    'mailto:akers@railroad19.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
const subscriptions = db.get('subscriptions').value();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.route('/api/saveSubscription').post(saveSubscription);

app.route('/api/sendNotification').post(sendNotification);

app.route('/api/getSubscriptions').get(getSubscriptions);

db.defaults({ subscriptions: [] }).write()

function saveSubscription(req,res) {
    const newSub = req.body;
    const hasSubscription = subscriptions.some(sub => newSub.keys.auth === sub.keys.auth);
    if (!hasSubscription) {
      db.get('subscriptions')
        .push(newSub)
        .write();
    }

    res.status(200).end();
}

function getSubscriptions(req,res){
    res.status(200).json(subscriptions);
}

function sendNotification(req, res) {
  
   const notificationPayload = {
        "notification": {
            "title": "Beanvest Notification",
            "body": req.body.message,
            "actions": [{
                "action": "explore",
                "title": "Go to the site"
            }]
        }
    };
  

    Promise.all(subscriptions.map(sub => webpush.sendNotification(
        sub, JSON.stringify(notificationPayload))))
        .then(() => res.status(200).json({ message: 'Notification Sent' }))
        .catch(err => {
            console.error("Error sending notification, reason: ", err);
            res.sendStatus(500);
        });
}


app.listen(3000, () => console.log('Beanvest Web Notification App listening on port 3000!'));