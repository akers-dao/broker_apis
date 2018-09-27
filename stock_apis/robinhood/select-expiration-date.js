/**
 * Chooose expiration date from drop down
 *
 * @param {Page} page
 * @param {string} month
 * @param {string} date
 */
async function selectExpirationDate(page, month, date) {
    try {
        // Open expiration dates drop down
        await page.click(`input`);

        // Click on an expiration date
        await page.evaluate(date => {
            const options = document.querySelectorAll('[role="option"]');

            const index = Array.from(options)
                .map(e => e.textContent)
                .findIndex(d => d === date);

            options[index].click();
        }, date)

    } catch (error) {
        console.error(error);
    }
}

module.exports = selectExpirationDate;