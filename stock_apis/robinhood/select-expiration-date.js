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
        await page.$eval('input', (el, { month, date }) => {
    
            const expirationDateHeaderIndex = Array.from(el.parentElement.nextElementSibling.querySelectorAll('section  header'))
                .map(e => e.textContent.replace(/\d+/, ' $&'))
                .findIndex(d => d === month);
    
            const expirationDatesNodes = Array.from(el.parentElement.nextElementSibling.querySelectorAll('section > div'))
                .find((e, i) => i === expirationDateHeaderIndex);
    
            const options = expirationDatesNodes.querySelectorAll('[role="option"]');
    
            const index = Array.from(options)
                .map(e => e.textContent)
                .findIndex(d => d === date);
    
            options[index].click();
    
            return index !== undefined ? 'success' : 'error';
        }, { month, date });
        
    } catch (error) {
        console.error(error);
    }
}

module.exports = selectExpirationDate;