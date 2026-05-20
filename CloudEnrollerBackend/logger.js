const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();

const log = (level, message, meta = {}) => {
  const logStr = `[${getTimestamp()}] [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  console.log(logStr);
  
  const logFile = path.join(logsDir, 'app.log');
  fs.appendFileSync(logFile, logStr + '\n');
};

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  success: (msg, meta) => log('success', msg, meta)
};
