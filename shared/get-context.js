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

module.exports = getContext;