const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

/**
 * Get subscriptions
 *
 * @param {*} req
 * @param {*} res
 */
function getSubscriptions(req, res) {
    const adapter = new FileSync('.data/db.json');
    const db = low(adapter);
    const subscriptions = db.get('subscriptions').value();
    res.status(200).json(subscriptions);
}

module.exports = getSubscriptions