const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

/**
 * Fetch pending students from the Google Apps Script Web App
 * @returns {Promise<Array>} List of student task objects
 */
async function fetchQueue() {
  if (!config.webAppUrl) {
    logger.error("WEB_APP_URL is not set in environment variables!");
    return [];
  }

  try {
    const response = await axios.get(config.webAppUrl);
    const result = response.data;

    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    if (!result.data || result.data.length === 0) {
      return [];
    }

    // Expand comma-separated rows into individual tasks
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
    logger.error("Error fetching queue from Google Sheet:", { error: error.message });
    return [];
  }
}

/**
 * Update the Google Sheet with the final status for a row
 * @param {number} rowNumber - The sheet row number
 * @param {string} status - The status text to write
 */
async function updateRowStatus(rowNumber, status) {
  try {
    const response = await axios.post(config.webAppUrl, {
      rowNumber: rowNumber,
      status: status
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to update row");
    }
    
    logger.success(`Updated Sheet Row ${rowNumber} to status: ${status}`);
  } catch (error) {
    logger.error(`Error updating Sheet Row ${rowNumber}:`, { error: error.message });
  }
}

module.exports = {
  fetchQueue,
  updateRowStatus
};
