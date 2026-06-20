const { getConfig } = require('../config/configManager');

async function erlcRequest(path, options = {}) {
  const config = getConfig();
  const apiKey = process.env.ERLC_API_KEY;

  if (!apiKey) {
    throw new Error('ERLC_API_KEY is missing from .env');
  }

  const response = await fetch(`${config.erlc.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Server-Key': apiKey,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`ER:LC API error ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }

  return data;
}

module.exports = { erlcRequest };
