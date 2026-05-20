const { chromium } = require('playwright');
const fs = require('fs');
const axios = require('axios');
const config = require('./config');
const { sleep, log } = require('./utils');

async function fetchPendingStudents() {
  log('Fetching pending students from Google Sheet...', 'INFO');
  try {
    const res = await axios.get(config.urls.webAppUrl);
    const result = res.data;
    
    if (!result.success) throw new Error(result.error);
    
    let expandedQueue = [];
    result.data.forEach(item => {
      const regs = item.regNo.toString().split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      const mods = item.moduleName.toString().split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

      let subTasks = [];
      regs.forEach(r => {
        mods.forEach(m => {
          subTasks.push({ regNo: r, moduleName: m, success: false, error: null });
        });
      });

      if (subTasks.length > 0) {
        expandedQueue.push({
          rowNumber: item.rowNumber,
          subTasks: subTasks
        });
      }
    });
    return expandedQueue;
  } catch (error) {
    log(`Failed to fetch from Google Sheets: ${error.message}`, 'ERROR');
    return [];
  }
}

async function updateSheetStatus(rowNumber, status) {
  log(`Updating row ${rowNumber} with status: ${status}`, 'INFO');
  try {
    const res = await axios.post(config.urls.webAppUrl, {
      rowNumber: rowNumber,
      status: status
    });
    if (!res.data.success) throw new Error(res.data.error);
  } catch (error) {
    log(`Failed to update Google Sheet: ${error.message}`, 'ERROR');
  }
}

async function login(page) {
  log('Navigating to login page...', 'INFO');
  await page.goto(config.urls.login, { waitUntil: 'networkidle' });

  const username = process.env.MOODLE_USERNAME;
  const password = process.env.MOODLE_PASSWORD;

  if (!username || !password) {
    throw new Error('Credentials not found in environment variables. Please set MOODLE_USERNAME and MOODLE_PASSWORD in GitHub Secrets.');
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

async function enrollStudent(page, studentRegNo, moduleName) {
  const courseId = config.courseMapping[moduleName];

  if (!courseId) {
    throw new Error(`Course mapping not found for module: ${moduleName}`);
  }

  const courseUrl = config.urls.baseCourseUrl + courseId;
  log(`Navigating to course URL: ${courseUrl}`, 'INFO');
  await page.goto(courseUrl, { waitUntil: 'networkidle' });

  await sleep(config.delays.pageLoad);

  log(`Clicking initial enroll button...`, 'INFO');
  await page.click(config.selectors.initialEnrollBtn);

  log(`Typing registration number: ${studentRegNo}`, 'INFO');
  await page.fill(config.selectors.searchInput, studentRegNo);

  await sleep(config.delays.searchWait);

  log(`Waiting for search results...`, 'INFO');
  try {
    await page.waitForSelector(config.selectors.searchResultOption, { timeout: 5000 });
    await page.click(config.selectors.searchResultOption);
  } catch (error) {
    log(`No search results for ${studentRegNo}. They might already be enrolled or the ID is invalid. Skipping.`, 'WARNING');
    return; // Exit successfully
  }

  await sleep(config.delays.actionWait);

  log(`Clicking final enroll button...`, 'INFO');
  await page.click(config.selectors.finalEnrollBtn);

  await sleep(config.delays.actionWait);
  log(`Successfully completed enrollment workflow for ${studentRegNo}`, 'SUCCESS');
}

async function main() {
  const enrollmentQueue = await fetchPendingStudents();

  if (enrollmentQueue.length === 0) {
    log('No pending students found in Google Sheet.', 'INFO');
    return;
  }

  log(`Found ${enrollmentQueue.length} row(s) to process.`, 'INFO');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  if (!fs.existsSync('./screenshots')) fs.mkdirSync('./screenshots');

  try {
    await login(page);

    for (let i = 0; i < enrollmentQueue.length; i++) {
      const currentRow = enrollmentQueue[i];
      log(`--- Processing Sheet Row ${currentRow.rowNumber} ---`, 'INFO');
      
      for (let j = 0; j < currentRow.subTasks.length; j++) {
        const task = currentRow.subTasks[j];
        log(`Task ${j+1}/${currentRow.subTasks.length}: Enrolling ${task.regNo} into ${task.moduleName}`, 'INFO');
        
        let attempts = 0;
        const maxAttempts = 2;
        let success = false;

        while (attempts < maxAttempts && !success) {
          attempts++;
          try {
            await enrollStudent(page, task.regNo, task.moduleName);
            task.success = true;
            success = true;
          } catch (error) {
            task.error = error.message;
            log(`Attempt ${attempts} failed for ${task.regNo}: ${error.message}`, 'ERROR');
            
            const screenshotPath = `./screenshots/error-${task.regNo}-attempt${attempts}.png`;
            await page.screenshot({ path: screenshotPath });
            log(`Saved error screenshot to ${screenshotPath}`, 'INFO');

            if (attempts < maxAttempts) {
              log(`Retrying in 5 seconds...`, 'INFO');
              await sleep(5000);
            }
          }
        }
      }

      // Check subtask success to write final status back to Sheet
      const failedTasks = currentRow.subTasks.filter(t => !t.success);
      let finalStatus = 'Completed';

      if (failedTasks.length > 0) {
        if (failedTasks.length === currentRow.subTasks.length) {
          finalStatus = `Failed All: ${failedTasks[0].error}`;
        } else {
          const failedRegs = [...new Set(failedTasks.map(f => f.regNo))].join(', ');
          finalStatus = `Partial Success (Failed: ${failedRegs})`;
        }
      }

      await updateSheetStatus(currentRow.rowNumber, finalStatus);
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
