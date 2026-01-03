/**
 * config/env.config.js
 * Reads and validates environment variables and exports a normalized config object.
 */

const required = (name) => {
    if (!process.env[name]) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return process.env[name];
};

const PORT = parseInt(process.env.PORT || '3000', 10);
const BOT_TOKEN = required('BOT_TOKEN');

const ADMIN_IDS = (process.env.ADMIN_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n));

module.exports = {
    PORT,
    BOT_TOKEN,
    ADMIN_IDS,
    DATA_PATH: process.env.DATA_PATH || './data/db.json',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    QR_DEFAULT_SIZE: parseInt(process.env.QR_DEFAULT_SIZE || '300', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
};
