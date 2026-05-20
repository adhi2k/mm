// Import configuration
importScripts('config.js');

let enrollmentQueue = [];
let isProcessing = false;
let globalWorkerTabId = null; // Track the background tab

// Listen for alarms (Automatic Background Sync)
chrome.runtime.onInstalled.addListener(() => {
  // Check the Google Sheet every 1 minute automatically
  chrome.alarms.create('autoSyncSheet', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoSyncSheet' && !isProcessing) {
    console.log("Running automatic background sync...");
    triggerSheetSync();
  }
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SYNC_SHEET') {
    if (isProcessing) {
      sendResponse({ status: 'already_processing' });
      return;
    }

    triggerSheetSync();
    sendResponse({ status: 'started' });
  }
  else if (request.action === 'STOP_ENROLLMENT') {
    isProcessing = false;
    enrollmentQueue = [];
    sendResponse({ status: 'stopped' });
  }
  else if (request.action === 'GET_STATUS') {
    // Allows popup to check status when reopened
    sendResponse({
      isProcessing: isProcessing,
      remainingQueue: enrollmentQueue
    });
  }
  return true; // Keep message channel open for async responses
});

function triggerSheetSync() {
  isProcessing = true;

  // Notify popup if it is open
  chrome.runtime.sendMessage({ action: 'SYNC_STARTED' }).catch(() => { });

  // Fetch from Google Apps Script (ignoring browser cookies to prevent Google login redirects)
  fetch(CONFIG.webAppUrl, { credentials: 'omit' })
    .then(res => res.json())
    .then(result => {
      if (!result.success) throw new Error(result.error);
      if (result.data.length === 0) {
        isProcessing = false;
        chrome.runtime.sendMessage({
          action: 'STUDENT_RESULT',
          student: 'System',
          success: true,
          message: 'No pending students found.'
        }).catch(() => { });
        chrome.runtime.sendMessage({ action: 'PROCESS_COMPLETE' }).catch(() => { });
        return;
      }

      // Process the fetched rows into an expanded queue
      let expandedQueue = [];
      result.data.forEach(item => {
        // Split by comma, newline, or semicolon
        const regs = item.regNo.toString().split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
        const mods = item.moduleName.toString().split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

        let subTasks = [];
        regs.forEach(r => {
          mods.forEach(m => {
            subTasks.push({ regNo: r, moduleName: m, processed: false, success: false, error: null });
          });
        });

        if (subTasks.length > 0) {
          expandedQueue.push({
            rowNumber: item.rowNumber,
            subTasks: subTasks
          });
        }
      });

      if (expandedQueue.length === 0) {
        isProcessing = false;
        chrome.runtime.sendMessage({
          action: 'STUDENT_RESULT', student: 'System', success: true, message: 'No valid combinations found.'
        }).catch(() => { });
        chrome.runtime.sendMessage({ action: 'PROCESS_COMPLETE' }).catch(() => { });
        return;
      }

      enrollmentQueue = expandedQueue;
      processNextStudent();
    })
    .catch(error => {
      isProcessing = false;
      console.error("Sync error:", error);
      chrome.runtime.sendMessage({
        action: 'STUDENT_RESULT',
        student: 'SYNC ERROR',
        success: false,
        message: error.message
      }).catch(() => { });
      chrome.runtime.sendMessage({ action: 'PROCESS_COMPLETE' }).catch(() => { });
    });
}

async function processNextStudent() {
  if (!isProcessing || enrollmentQueue.length === 0) {
    isProcessing = false;

    // Close the background tab when finished!
    if (globalWorkerTabId) {
      chrome.tabs.remove(globalWorkerTabId).catch(() => { });
      globalWorkerTabId = null;
    }

    // Notify popup that processing is done
    chrome.runtime.sendMessage({ action: 'PROCESS_COMPLETE' }).catch(() => { });
    return;
  }

  let currentRow = enrollmentQueue[0];
  let currentTask = currentRow.subTasks.find(t => !t.processed);

  // If all subtasks for this row are done, update Google Sheet and move to next row
  if (!currentTask) {
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

    await updateSheetStatus(currentRow.rowNumber, finalStatus).catch(() => { });

    enrollmentQueue.shift(); // Remove this row from queue
    return processNextStudent(); // Process next row
  }

  currentTask.processed = true;
  const currentStudent = currentTask.regNo;
  const moduleName = currentTask.moduleName;
  const courseId = CONFIG.courseMapping[moduleName];

  try {
    // Notify popup of current progress
    chrome.runtime.sendMessage({
      action: 'UPDATE_PROGRESS',
      student: `${currentStudent} (${moduleName})`,
      status: 'Processing...'
    }).catch(() => { });

    if (!courseId) {
      throw new Error(`Course mapping not found for: ${moduleName}`);
    }

    // 1. Construct the exact URL
    const targetUrl = `http://training.saveetha.in/user/index.php?id=${courseId}`;

    // 2. Find or create a background worker tab
    let workerTab = null;
    if (globalWorkerTabId) {
      try {
        workerTab = await chrome.tabs.update(globalWorkerTabId, { url: targetUrl, active: false });
      } catch (e) {
        workerTab = await chrome.tabs.create({ url: targetUrl, active: false });
        globalWorkerTabId = workerTab.id;
      }
    } else {
      workerTab = await chrome.tabs.create({ url: targetUrl, active: false });
      globalWorkerTabId = workerTab.id;
    }

    // 3. Wait for the tab to fully load
    await waitForTabLoad(workerTab.id);

    // Check if Moodle redirected us to the login page
    let currentTabInfo = await chrome.tabs.get(workerTab.id);
    if (currentTabInfo.url.includes('/login/')) {
      console.log("Not logged in! Attempting auto-login...");

      chrome.runtime.sendMessage({
        action: 'UPDATE_PROGRESS',
        student: `${currentStudent} (${moduleName})`,
        status: 'Logging in...'
      }).catch(() => { });

      // Inject the login script
      await chrome.scripting.executeScript({
        target: { tabId: workerTab.id },
        files: ['config.js', 'login.js']
      });

      // Wait a short moment for the form submission to start the navigation
      await new Promise(res => setTimeout(res, 1000));
      
      // Wait for the login to complete and the next page to fully load
      await waitForTabLoad(workerTab.id);
      
      // Moodle might redirect to the Dashboard. If we aren't on the target course, navigate there.
      let afterLoginTabInfo = await chrome.tabs.get(workerTab.id);
      if (!afterLoginTabInfo.url.includes(`id=${courseId}`)) {
        await chrome.tabs.update(workerTab.id, { url: targetUrl });
        await waitForTabLoad(workerTab.id);
      }
    }

    // 4. Inject enrollment scripts
    await chrome.scripting.executeScript({
      target: { tabId: workerTab.id },
      files: ['config.js', 'content.js']
    });

    // 5. Send command to content script to perform UI automation
    const response = await sendEnrollCommandWithRetry(workerTab.id, currentStudent);

    if (!response || !response.success) {
      throw new Error((response && response.message) ? response.message : "Automation failed without response");
    }

    // Mark success
    currentTask.success = true;

    // 7. Report success
    chrome.runtime.sendMessage({
      action: 'STUDENT_RESULT',
      student: currentStudent,
      success: true,
      message: `Enrolled in ${moduleName}`
    }).catch(() => { });

  } catch (error) {
    console.error(`Error processing student ${currentStudent}:`, error);

    currentTask.success = false;
    currentTask.error = error.message;

    // Report failure
    chrome.runtime.sendMessage({
      action: 'STUDENT_RESULT',
      student: currentStudent,
      success: false,
      message: `${moduleName} - ${error.message || 'Unknown error'}`
    }).catch(() => { });
  }

  // Small delay before next student/subtask
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Continue queue
  processNextStudent();
}

async function updateSheetStatus(rowNumber, status) {
  try {
    const res = await fetch(CONFIG.webAppUrl, {
      method: 'POST',
      credentials: 'omit',
      body: JSON.stringify({ rowNumber: rowNumber, status: status })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);
  } catch (e) {
    console.error("Failed to update Google Sheet:", e);
    throw new Error("Failed to update status in Google Sheet");
  }
}

// Helper: Wait for tab to finish loading
function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// Helper: Send message with retry in case content script takes a moment to initialize
async function sendEnrollCommandWithRetry(tabId, studentRegNo, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Small wait before messaging to ensure script execution finished
      await new Promise(res => setTimeout(res, 500));

      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'EXECUTE_ENROLLMENT',
        student: studentRegNo
      });
      return response;
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(res => setTimeout(res, 1000));
    }
  }
}
