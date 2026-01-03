/**
 * services/logger.service.js
 * Minimal structured logger wrapper (console-based for now). Swap to pino/winston later.
 */

const config = require('../config/env.config');

const levels = ['debug', 'info', 'warn', 'error'];
const currentLevelIndex = levels.indexOf(config.LOG_LEVEL) || 1;

function log(level, ...args) {
    const idx = levels.indexOf(level);
    if (idx < currentLevelIndex) return;
    console[level === 'debug' ? 'debug' : level](new Date().toISOString(), level.toUpperCase(), ...args);
}

module.exports = {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
};
