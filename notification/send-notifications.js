const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const webpush = require('web-push');

/**
 * Send Notifications
 *
 * @param {*} req
 * @param {*} res
 */
function sendNotifications(req, res) {
    const adapter = new FileSync('.data/db.json');
    const db = low(adapter);
    const subscriptions = db.get('subscriptions').value();

    const vapidKeys = {
        "publicKey": process.env.PUBLIC_KEY,
        "privateKey": process.env.PRIVATE_KEY
    };
    
    webpush.setVapidDetails(
        'mailto:falos@beanvest.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

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


module.exports = sendNotifications