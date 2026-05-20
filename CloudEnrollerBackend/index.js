const { chromium } = require('playwright');
const config = require('./config');
const logger = require('./logger');
const { fetchQueue, updateRowStatus } = require('./queue');
const { getAuthenticatedContext, clearSession } = require('./login');
const { enrollStudent } = require('./enroll');

let isProcessing = false;

async function processQueue() {
  if (isProcessing) {
    logger.info("Previous cycle still processing. Skipping this tick.");
    return;
  }

  isProcessing = true;

  try {
    const queue = await fetchQueue();
    
    if (queue.length === 0) {
      logger.info("Queue is empty. Waiting for next interval...");
      isProcessing = false;
      return;
    }

    logger.info(`Fetched ${queue.length} row(s) to process.`);
    
    // Launch Playwright Browser
    const browser = await chromium.launch({ 
      headless: config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for standard Linux deployments
    });

    try {
      // Process each row sequentially
      for (const row of queue) {
        logger.info(`--- Starting processing for Row ${row.rowNumber} ---`);
        
        for (const subtask of row.subTasks) {
          const { regNo, moduleName } = subtask;
          const courseId = config.courseMapping[moduleName];

          if (!courseId) {
            subtask.error = `Course mapping not found for: ${moduleName}`;
            logger.error(subtask.error);
            continue;
          }

          let attempt = 0;
          let success = false;
          
          while (attempt < 2 && !success) {
            attempt++;
            let context;
            try {
              context = await getAuthenticatedContext(browser);
              const page = await context.newPage();
              
              const result = await enrollStudent(page, regNo, moduleName, courseId);
              subtask.success = true;
              subtask.message = result.message;
              success = true;
              
              await context.close();
            } catch (err) {
              if (context) await context.close();
              
              if (err.message === 'SESSION_EXPIRED') {
                logger.warn(`Session expired on attempt ${attempt}. Clearing session...`);
                await clearSession();
              } else {
                logger.error(`Enrollment failed for ${regNo} (Attempt ${attempt}):`, { error: err.message });
                if (attempt >= 2) {
                  subtask.error = err.message;
                }
              }
            }
          }
          
          // Brief pause between students
          await new Promise(r => setTimeout(r, 1500));
        }

        // Determine final status for the row
        const failedTasks = row.subTasks.filter(t => !t.success);
        let finalStatus = 'Completed';
        
        if (failedTasks.length > 0) {
          if (failedTasks.length === row.subTasks.length) {
            finalStatus = `Failed All: ${failedTasks[0].error}`;
          } else {
            const failedRegs = [...new Set(failedTasks.map(f => f.regNo))].join(', ');
            finalStatus = `Partial Success (Failed: ${failedRegs})`;
          }
        }

        // Update the Google Sheet
        await updateRowStatus(row.rowNumber, finalStatus);
      }
    } finally {
      await browser.close();
      logger.info('Browser closed.');
    }

  } catch (globalErr) {
    logger.error("Critical error in orchestrator:", { error: globalErr.message });
  } finally {
    isProcessing = false;
    logger.info("Cycle complete.");
  }
}

// ------------------------------------------------------------------
// STARTUP AND CRON LOGIC
// ------------------------------------------------------------------

logger.info(`Starting Cloud Enroller Backend. Poll Interval: ${config.pollInterval}ms`);

// Run immediately on boot
processQueue();

// Set interval for continuous polling
setInterval(processQueue, config.pollInterval);
