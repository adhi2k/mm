const config = require('./config');
const logger = require('./logger');

/**
 * Attempt to enroll a single student in a specific course
 * @param {import('playwright').Page} page - Authenticated Playwright page
 * @param {string} regNo - Student registration number
 * @param {string} moduleName - Module name (for logging)
 * @param {string} courseId - Moodle course ID
 */
async function enrollStudent(page, regNo, moduleName, courseId) {
  const targetUrl = `http://training.saveetha.in/user/index.php?id=${courseId}`;
  
  logger.info(`Navigating to Course Page...`, { regNo, courseId });
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  
  // CHECK FOR EXPIRED SESSION
  if (page.url().includes('/login/')) {
    throw new Error('SESSION_EXPIRED'); // Handled by orchestrator to trigger re-login
  }

  // 1. Click initial Enroll users button
  logger.info(`Waiting for initial 'Enroll users' button...`);
  // Use locators for robust waiting
  const initialBtn = page.locator(config.selectors.initialEnrollButton).first();
  await initialBtn.waitFor({ state: 'visible', timeout: 10000 });
  await initialBtn.click();

  // 2. Wait for search input in the modal
  logger.info(`Waiting for search input modal...`);
  const searchInput = page.locator(config.selectors.searchUserInput).first();
  await searchInput.waitFor({ state: 'visible', timeout: 5000 });

  // 3. Fill the registration number
  logger.info(`Typing Registration Number: ${regNo}...`);
  await searchInput.fill(regNo);
  
  // Sometimes Playwright types too fast for Moodle's AJAX, trigger an input event
  await searchInput.dispatchEvent('input');

  // 4. Wait for autocomplete suggestions
  logger.info(`Waiting for autocomplete results...`);
  try {
    const studentResult = page.locator(config.selectors.studentSearchResult).first();
    // Short timeout because if they are already enrolled, it will never appear
    await studentResult.waitFor({ state: 'visible', timeout: 4000 });
    
    // Click the student result
    await studentResult.click();
    logger.info(`Selected student from dropdown.`);
    
    // 5. Click the final Enroll button
    const finalBtn = page.locator(config.selectors.finalEnrollButton).first();
    await finalBtn.waitFor({ state: 'visible', timeout: 5000 });
    await finalBtn.click();
    
    // Wait a brief moment to ensure the request goes through
    await page.waitForTimeout(1000);
    logger.success(`Enrollment automation complete!`, { regNo, moduleName });
    return { success: true, message: `Successfully enrolled` };
    
  } catch (error) {
    // If timeout happens waiting for the search result, they might be already enrolled
    if (error.name === 'TimeoutError') {
      logger.warn(`No student found. Likely already enrolled or invalid ID.`, { regNo });
      return { success: true, message: `Skipped (Already Enrolled or Invalid)` };
    }
    throw error;
  }
}

module.exports = {
  enrollStudent
};
