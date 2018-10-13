/**
 * Extract and return confirmation text
 *
 * @param {Page} page
 * @param {string} stock
 */
async function getConfirmationText(page) {
    try {
        const confirmationTextHandle = (await page.$x(`//*[@id="react_root"]/div/main/div[2]/div/div[1]/div/div/div/div[2]/div/div/form/div[1]/div[2]/div[1]`))[0];

        return await page.evaluate(confirmationText => {
            return confirmationText.textContent
        }, confirmationTextHandle);
    } catch (error) {
        console.error(error);
        return error;
    }
}

module.exports = getConfirmationText;