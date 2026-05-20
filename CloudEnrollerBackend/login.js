const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const config = require('./config');

const SESSION_DIR = path.join(__dirname, 'sessions');
const STATE_FILE = path.join(SESSION_DIR, 'state.json');

// Ensure session directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

/**
 * Checks if a saved session exists and appears valid
 */
function hasSavedSession() {
  return fs.existsSync(STATE_FILE);
}

/**
 * Perform login and save the session state
 */
async function performLogin(browser) {
  logger.info('Attempting new login...');
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://training.saveetha.in/login/index.php', { waitUntil: 'domcontentloaded' });
    
    await page.waitForSelector(config.selectors.loginUsernameInput);
    
    logger.info('Filling login credentials...');
    await page.fill(config.selectors.loginUsernameInput, config.credentials.username);
    await page.fill(config.selectors.loginPasswordInput, config.credentials.password);
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click(config.selectors.loginSubmitButton)
    ]);
    
    // Check if login was successful by looking at the URL
    if (page.url().includes('login/index.php')) {
      throw new Error('Login failed. Still on login page. Check credentials.');
    }

    logger.success('Login successful. Saving session state...');
    
    // Save storage state to a file
    await context.storageState({ path: STATE_FILE });
    
    await context.close();
    return true;
  } catch (error) {
    logger.error('Login Error:', { error: error.message });
    await context.close();
    return false;
  }
}

/**
 * Get an authenticated context, creating a new one if necessary
 */
async function getAuthenticatedContext(browser) {
  if (!hasSavedSession()) {
    logger.warn('No saved session found. Logging in...');
    const success = await performLogin(browser);
    if (!success) throw new Error("Could not authenticate");
  }

  let context = await browser.newContext({ storageState: STATE_FILE });
  
  // Optional: You could do a quick health check here to see if the session actually expired
  // Moodle sessions typically expire if unused. The enroll.js logic will catch
  // if we get redirected to the login page and trigger a re-login.
  
  return context;
}

/**
 * Force a fresh login by deleting the old session file
 */
async function clearSession() {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
    logger.info('Deleted expired session state file.');
  }
}

module.exports = {
  getAuthenticatedContext,
  clearSession,
  STATE_FILE
};
