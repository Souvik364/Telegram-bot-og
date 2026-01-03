/*
 * server/health.server.js
 * Minimal Express server with health endpoints for Render compatibility.
 */

const express = require('express');
const config = require('../config/env.config');
const logger = require('../services/logger.service');

let server = null;

function start(port = config.PORT, services = {}) {
    const app = express();

    app.get('/', (req, res) => res.send('OK'));
    app.get('/health', (req, res) => res.json({ status: 'ok', env: config.NODE_ENV }));

    server = app.listen(port, () => logger.info(`Server listening on port ${port}`));
    return server;
}

module.exports = { start };
