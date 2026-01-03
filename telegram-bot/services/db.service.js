/**
 * services/db.service.js
 * A small JSON-backed DB service with a swap-in adapter design. Uses `lowdb` under the hood
 * via the JSONFile adapter. This service exposes a minimal repo-like API for modules.
 */

const fs = require('fs');
const path = require('path');
const { Low, JSONFile } = require('lowdb');
const config = require('../config/env.config');
const logger = require('./logger.service');

let db = null;

async function init() {
    const dir = path.dirname(config.DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const adapter = new JSONFile(config.DATA_PATH);
    db = new Low(adapter);
    await db.read();
    db.data = db.data || { users: [], menus: [], support: [], subscriptions: [], audit: [] };
    await db.write();
    logger.info('DB initialized at', config.DATA_PATH);
}

async function close() {
    if (db) await db.write();
}

async function list(collection) {
    await db.read();
    return db.data[collection] || [];
}

async function get(collection, id) {
    await db.read();
    return (db.data[collection] || []).find((x) => x.id === id) || null;
}

async function insert(collection, item) {
    await db.read();
    db.data[collection] = db.data[collection] || [];
    db.data[collection].push(item);
    await db.write();
    return item;
}

async function update(collection, id, patch) {
    await db.read();
    db.data[collection] = db.data[collection] || [];
    const idx = db.data[collection].findIndex((x) => x.id === id);
    if (idx === -1) return null;
    db.data[collection][idx] = Object.assign({}, db.data[collection][idx], patch);
    await db.write();
    return db.data[collection][idx];
}

async function remove(collection, id) {
    await db.read();
    db.data[collection] = db.data[collection] || [];
    db.data[collection] = db.data[collection].filter((x) => x.id !== id);
    await db.write();
}

module.exports = { init, close, list, get, insert, update, remove };
