/*
 * index.js — Application bootstrap and module loader only
 * This file contains no business logic; it only wires up services and modules,
 * and starts the bot and Express server.
 */

require('dotenv').config();

const { Telegraf } = require('telegraf');
const config = require('./config/env.config');
const logger = require('./services/logger.service');
const db = require('./services/db.service');
const server = require('./server/health.server');

// Create a lightweight services bag to pass to modules
const adminServiceFactory = require('./services/admin.service');
const services = { config, logger, db };
services.admin = adminServiceFactory(config, logger);

// Create the bot instance — modules register handlers on this instance
const bot = new Telegraf(config.BOT_TOKEN);

// Modules are loaded here; each module exports a single `init(bot, services)` function
const modules = [
    require('./modules/user/user.module'),
    require('./modules/admin/admin.module'),
    require('./modules/menu/menu.module'),
    require('./modules/support/support.module'),
    require('./modules/payment/payment.module'),
    require('./modules/qr/qr.module'),
    require('./modules/subscription/subscription.module'),
    require('./modules/moderation/moderation.module'),
];

(async () => {
    try {
        await db.init();

        // Initialize modules (each module should be side-effect free beyond registering handlers)
        for (const mod of modules) {
            if (typeof mod.init === 'function') {
                await mod.init(bot, services);
            }
        }

        // Start Express health server
        const httpServer = server.start(services.config.PORT, services);

        // Launch the bot (long polling by default)
        await bot.launch();
        logger.info('Bot launched and ready');

        // Graceful shutdown
        const shutdown = async () => {
            logger.info('Shutdown initiated');
            try {
                await bot.stop();
            } catch (e) {
                logger.warn('Error during bot.stop()', e);
            }
            try {
                httpServer && httpServer.close();
            } catch (e) {
                logger.warn('Error closing server', e);
            }
            await db.close();
            process.exit(0);
        };

        process.once('SIGINT', shutdown);
        process.once('SIGTERM', shutdown);
    } catch (err) {
        logger.error('Failed to start application', err);
        process.exit(1);
    }
})();
