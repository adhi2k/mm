// content.js - Performs the actual DOM manipulation on the enrollment page

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXECUTE_ENROLLMENT') {
    // Run the async workflow and send the response back
    performEnrollmentWorkflow(request.student)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, message: error.message }));
      
    return true; // Keep channel open for async response
  }
});

// Helper for sleep/delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for robust clicking (Moodle's YUI/jQuery sometimes misses standard .click())
function simulateClick(element) {
  const opts = { bubbles: true, cancelable: true, view: window };
  element.dispatchEvent(new MouseEvent('mouseover', opts));
  element.dispatchEvent(new MouseEvent('mousedown', opts));
  element.dispatchEvent(new MouseEvent('mouseup', opts));
  element.dispatchEvent(new MouseEvent('click', opts));
}

// Helper to wait for an element to appear in the DOM
async function waitForElement(selector, maxWait = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    const el = document.querySelector(selector);
    if (el) return el;
    await sleep(250);
  }
  throw new Error(`Timeout waiting for element: ${selector}`);
}

// Main automation workflow
async function performEnrollmentWorkflow(studentRegNo) {
  console.log(`Starting enrollment automation for: ${studentRegNo}`);
  
  try {
    // 1. Initial wait to ensure page framework is fully loaded
    await sleep(CONFIG.delays.pageLoadWait);
    
    // 2. Find and click the initial "Enroll users" button with a retry loop
    let searchInput = null;
    let retries = 4;
    
    while (retries > 0 && !searchInput) {
      const initialBtn = await waitForElement(CONFIG.selectors.initialEnrollButton);
      console.log(`Clicking initial enroll button... (Retries left: ${retries})`);
      
      // Scroll into view and click
      initialBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
      await sleep(500);
      initialBtn.click();
      
      // Try to find the search input indicating the modal opened
      try {
        // Wait up to 3 seconds for the modal to appear
        searchInput = await waitForElement(CONFIG.selectors.searchUserInput, 3000); 
      } catch (e) {
        console.log("Modal did not appear. Retrying initial click...");
        retries--;
        await sleep(1000);
      }
    }
    
    if (!searchInput) {
      throw new Error(`Timeout waiting for element: ${CONFIG.selectors.searchUserInput}`);
    }
    
    // 4. Input the registration number
    // We simulate real typing by setting value and dispatching events
    searchInput.value = studentRegNo;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`Entered registration number: ${studentRegNo}`);
    
    // 5. Wait for the AJAX search results to load
    await sleep(CONFIG.delays.searchWait);
    
    // 6. Try to click the matching student result
    let studentResult;
    try {
      // We only wait a short time here because if they are already enrolled, it will never appear.
      studentResult = await waitForElement(CONFIG.selectors.studentSearchResult, 4000);
      simulateClick(studentResult);
      console.log("Selected student from search results");
      
      // 7. Wait briefly, then click the final enroll button
      await sleep(CONFIG.delays.actionWait);
      const finalBtn = await waitForElement(CONFIG.selectors.finalEnrollButton);
      simulateClick(finalBtn);
      console.log("Clicked final enroll button");
      
      // 8. Wait for success
      await sleep(CONFIG.delays.actionWait);
      
      return { success: true, message: `Successfully enrolled` };

    } catch (e) {
      console.log("Student not found in results. Likely already enrolled or invalid ID.");
      // Press escape to close modal just in case
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return { success: true, message: `Skipped (Already Enrolled or Invalid)` };
    }
    
  } catch (error) {
    console.error("Automation error:", error);
    return { success: false, message: error.message };
  }
}
