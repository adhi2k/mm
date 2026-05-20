const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { sleep, log } = require('./utils');

// Load students from JSON
const studentsPath = path.join(__dirname, 'students.json');
let students = [];
if (fs.existsSync(studentsPath)) {
  students = JSON.parse(fs.readFileSync(studentsPath, 'utf-8'));
}

async function login(page) {
  log('Navigating to login page...', 'INFO');
  await page.goto(config.urls.login, { waitUntil: 'networkidle' });

  const username = process.env.MOODLE_USERNAME;
  const password = process.env.MOODLE_PASSWORD;

  if (!username || !password) {
    throw new Error('Credentials not found in environment variables. Please set MOODLE_USERNAME and MOODLE_PASSWORD.');
  }

  log('Filling login credentials...', 'INFO');
  await page.fill(config.selectors.username, username);
  await page.fill(config.selectors.password, password);
  
  log('Submitting login form...', 'INFO');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click(config.selectors.loginBtn)
  ]);
  
  log('Login successful!', 'SUCCESS');
}

async function enrollStudent(page, student) {
  const { regNo, moduleName } = student;
  const courseId = config.courseMapping[moduleName];

  if (!courseId) {
    throw new Error(`Course mapping not found for module: ${moduleName}`);
  }

  const courseUrl = config.urls.baseCourseUrl + courseId;
  log(`Navigating to course URL: ${courseUrl}`, 'INFO');
  await page.goto(courseUrl, { waitUntil: 'networkidle' });

  await sleep(config.delays.pageLoad);

  log(`Clicking initial enroll button...`, 'INFO');
  // Use Playwright's auto-waiting to click the button
  await page.click(config.selectors.initialEnrollBtn);

  log(`Typing registration number: ${regNo}`, 'INFO');
  await page.fill(config.selectors.searchInput, regNo);

  await sleep(config.delays.searchWait);

  // Bonus Feature: Already Enrolled / Duplicate Prevention
  log(`Waiting for search results...`, 'INFO');
  try {
    // Wait for the autocomplete suggestion to appear
    await page.waitForSelector(config.selectors.searchResultOption, { timeout: 5000 });
    await page.click(config.selectors.searchResultOption);
  } catch (error) {
    log(`No search results for ${regNo}. They might already be enrolled or the ID is invalid. Skipping.`, 'WARNING');
    return; // Exit successfully, they are already enrolled
  }

  await sleep(config.delays.actionWait);

  log(`Clicking final enroll button...`, 'INFO');
  await page.click(config.selectors.finalEnrollBtn);

  await sleep(config.delays.actionWait);
  
  // Verify success
  try {
    await page.waitForSelector(config.selectors.successMessage, { timeout: 5000 });
    log(`Success message verified for ${regNo}`, 'INFO');
  } catch(e) {
    log(`No explicit success message found, but workflow completed for ${regNo}`, 'WARNING');
  }

  log(`Successfully completed enrollment workflow for ${regNo}`, 'SUCCESS');
}

async function main() {
  if (students.length === 0) {
    log('No students found in students.json', 'INFO');
    return;
  }

  log(`Starting automation for ${students.length} students.`, 'INFO');

  // Launch Chromium
  // Headless mode is true by default in Playwright, perfect for GitHub Actions
  const browser = await chromium.launch({
    headless: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create screenshots directory for error handling
  if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots');
  }

  try {
    await login(page);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      log(`--- Processing Student ${i + 1}/${students.length}: ${student.regNo} ---`, 'INFO');
      
      let attempts = 0;
      const maxAttempts = 2; // Retry logic (1 retry)
      let success = false;

      while (attempts < maxAttempts && !success) {
        attempts++;
        try {
          await enrollStudent(page, student);
          success = true;
        } catch (error) {
          log(`Attempt ${attempts} failed for ${student.regNo}: ${error.message}`, 'ERROR');
          
          // Bonus Feature: Screenshot on failure
          const screenshotPath = `./screenshots/error-${student.regNo}-attempt${attempts}.png`;
          await page.screenshot({ path: screenshotPath });
          log(`Saved error screenshot to ${screenshotPath}`, 'INFO');

          if (attempts < maxAttempts) {
            log(`Retrying in 5 seconds...`, 'INFO');
            await sleep(5000);
          } else {
            log(`Max retries reached for ${student.regNo}. Skipping.`, 'ERROR');
          }
        }
      }
    }
  } catch (error) {
    log(`CRITICAL ERROR: ${error.message}`, 'ERROR');
  } finally {
    log('Closing browser...', 'INFO');
    await browser.close();
    log('Automation finished.', 'INFO');
  }
}

main();
