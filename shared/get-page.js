/**
 * Get Page
 *
 * @param {*} context
 * @param {string} token
 * @returns
 */
async function getPage(context, token) {
    const ctxBrowser = context.browser();

    const pages = await ctxBrowser.pages();

    return pages.find(p => p.target().browserContext().token === token);
}

module.exports = getPage;