document.addEventListener('DOMContentLoaded', () => {
  const syncBtn = document.getElementById('syncBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const currentStudentEl = document.getElementById('currentStudent');
  const logList = document.getElementById('logList');

  // Check initial state
  chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (response) => {
    if (response && response.isProcessing) {
      setProcessingUI(true);
    }
  });

  syncBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'SYNC_SHEET' }, (response) => {
      if (response && response.status === 'started') {
        setProcessingUI(true);
      }
    });
  });

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'STOP_ENROLLMENT' }, () => {
      setProcessingUI(false);
      logMessage('Process stopped manually by user', 'error');
    });
  });

  // Listen for updates from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SYNC_STARTED') {
      setProcessingUI(true);
    } else if (request.action === 'PROCESS_COMPLETE') {
      setProcessingUI(false);
      currentStudentEl.textContent = 'All tasks completed';
    } else if (request.action === 'UPDATE_PROGRESS') {
      currentStudentEl.textContent = `Target: ${request.student} - ${request.status}`;
    } else if (request.action === 'STUDENT_RESULT') {
      logMessage(`${request.student}: ${request.message}`, request.success ? 'success' : 'error');
    }
  });

  function setProcessingUI(isProcessing) {
    if (isProcessing) {
      statusIndicator.className = 'status-dot active';
      statusText.textContent = 'Syncing & Processing...';
      syncBtn.style.display = 'none';
      stopBtn.style.display = 'block';
    } else {
      statusIndicator.className = 'status-dot';
      statusText.textContent = 'Idle (Waiting for Auto-Sync)';
      syncBtn.style.display = 'block';
      stopBtn.style.display = 'none';
    }
  }

  function logMessage(msg, type) {
    const li = document.createElement('li');
    li.textContent = msg;
    li.className = `log-${type}`;
    logList.insertBefore(li, logList.firstChild);
  }
});
