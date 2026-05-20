/**
 * GOOGLE APPS SCRIPT FOR TRAINING MODULE ENROLLER
 * 
 * Instructions:
 * 1. Open your Google Sheet where Form responses go.
 * 2. Ensure your sheet has columns containing these words in the first row (headers):
 *    - "Registration" (for the student registration number)
 *    - "Module" (for the course name, e.g., "TT DS PYTHON MODULE-I")
 *    - "System Status" (The extension will write "Completed" here)
 * 3. Go to Extensions > Apps Script.
 * 4. Paste this entire code into Code.gs (replace everything there).
 * 5. Click Deploy > New deployment.
 * 6. Select type: Web app.
 * 7. Execute as: Me. Who has access: Anyone.
 * 8. Click Deploy, Authorize access, and copy the "Web app URL".
 */

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({success: true, data: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = data[0].map(h => h.toString().toLowerCase());
  
  // Find column indexes (0-indexed)
  const regCol = headers.findIndex(h => h.includes('registration'));
  const modCol = headers.findIndex(h => h.includes('module'));
  const statusCol = headers.findIndex(h => h.includes('system status'));

  if (regCol === -1 || modCol === -1 || statusCol === -1) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, 
      error: "Could not find required columns. Make sure headers contain 'Registration', 'Module', and 'System Status'."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  let pendingRequests = [];
  
  for(let i=1; i<data.length; i++) {
    const row = data[i];
    // Process only if the System Status column is entirely empty
    if(row[statusCol].toString().trim() === '') {
      
      pendingRequests.push({
        rowNumber: i + 1, // 1-indexed for writing back to sheets
        regNo: row[regCol].toString().trim(),
        moduleName: row[modCol].toString().trim()
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true, data: pendingRequests}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const headers = sheet.getDataRange().getValues()[0].map(h => h.toString().toLowerCase());
    
    // Find System Status column index (1-indexed for getRange)
    const statusCol = headers.findIndex(h => h.includes('system status')) + 1; 
    
    if (statusCol === 0) {
      throw new Error("Could not find 'System Status' column");
    }
    
    // Update the cell
    sheet.getRange(params.rowNumber, statusCol).setValue(params.status);
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
