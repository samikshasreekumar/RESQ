const { Builder, By, until } = require('selenium-webdriver');
const path = require('path');
const chrome = require('selenium-webdriver/chrome');

// Determine the URL to the admin_login.html
const htmlFilePath = path.resolve(__dirname, '../admin_login.html');
const fileUrl = 'file://' + htmlFilePath;

async function runTest() {
    // Setup Chrome options
    let options = new chrome.Options();
    // Headless mode is commented out so we can see the browser run
    // options.addArguments('headless'); 

    console.log("Starting Chrome WebDriver...");
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log("Navigating to:", fileUrl);
        await driver.get(fileUrl);
        
        // Wait for elements to be present
        await driver.wait(until.elementLocated(By.id('username')), 5000);

        // Find the username and password fields
        const usernameInput = await driver.findElement(By.id('username'));
        const passwordInput = await driver.findElement(By.id('password'));
        
        // Find the login button
        const loginButton = await driver.findElement(By.xpath('//button[contains(text(), "Login")]'));

        console.log("Entering test credentials...");
        await usernameInput.sendKeys('admin');
        await passwordInput.sendKeys('wrongpassword');

        console.log("Clicking login...");
        await loginButton.click();

        // Wait for potential alert (e.g., "Server error" or "Login failed")
        console.log("Waiting for alert (up to 5 seconds)...");
        try {
            await driver.wait(until.alertIsPresent(), 5000);
            let alert = await driver.switchTo().alert();
            let alertText = await alert.getText();
            console.log("Alert displayed with text:", alertText);
            
            // Accept the alert
            await alert.accept();
            console.log("Alert accepted.");
        } catch (alertError) {
            console.log("No alert was displayed. This might happen if the page redirected or failed silently.");
        }

        console.log("--- Test execution completed successfully! ---");
    } catch (error) {
        console.error("Test failed due to an error:", error);
    } finally {
        console.log("Closing browser...");
        await driver.quit();
    }
}

runTest();
