const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

/**
 *
 *
 * @param {*} req
 * @param {*} res
 */
function saveSubscription(req, res) {
    const adapter = new FileSync('.data/db.json');
    const db = low(adapter);

    const subscriptions = db.get('subscriptions').value();

    const newSub = req.body;
    const hasSubscription = subscriptions.some(sub => newSub.keys.auth === sub.keys.auth);
    if (!hasSubscription) {
        db.get('subscriptions')
            .push(newSub)
            .write();
    }

    res.status(200).end();
}

module.exports = saveSubscription