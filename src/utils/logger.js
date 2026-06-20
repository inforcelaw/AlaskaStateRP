function timestamp() {
  return new Date().toISOString();
}

function format(level, message) {
  return `[${timestamp()}] [${level}] ${message}`;
}

module.exports = {
  info(message) {
    console.log(format('INFO', message));
  },

  warn(message) {
    console.warn(format('WARN', message));
  },

  error(message, error) {
    console.error(format('ERROR', message));
    if (error) console.error(error);
  },

  success(message) {
    console.log(format('SUCCESS', message));
  }
};
