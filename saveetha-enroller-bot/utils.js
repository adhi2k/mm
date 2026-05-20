const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  console.log(logMessage);
  
  // Save logs to file for GitHub Actions artifacts
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
  }
  fs.appendFileSync('./logs/automation.log', logMessage + '\n');
}

module.exports = { sleep, log };
