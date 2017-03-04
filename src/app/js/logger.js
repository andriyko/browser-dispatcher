const winston = require('winston');
winston.emitErrs = true;

function getLogger (logFilename) {
  return new winston.Logger({
    transports: [
      new winston.transports.File({
        level: 'info',
        filename: logFilename,
        handleExceptions: true,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
      })
    ],
    exitOnError: false
  });
}

module.exports = {
  'getLogger': getLogger
};
