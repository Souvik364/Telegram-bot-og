// Tests for admin module handlers (addmenu, removemenu)
const fs = require('fs');
const path = require('path');

const tmpFile = path.join(__dirname, 'tmp_db_admin_handlers.json');
process.env.DATA_PATH = tmpFile;
process.env.ADMIN_IDS = '1111';

const db = require('../services/db.service');
const config = require('../config/env.config');
const logger = require('../services/logger.service');
const createAdminService = require('../services/admin.service');
const adminModule = require('../modules/admin/admin.module');

function makeFakeBot() {
    return {
        _commands: {},
        command(name, ...handlers) {
            this._commands[name] = handlers;
        },
    };
}

async function runHandlers(handlers, ctx) {
    // handlers is array of middleware functions; execute them sequentially
    let idx = 0;
    const next = async () => {
        const h = handlers[idx++];
        if (!h) return;
        // Some handlers have signature (ctx) others (ctx, next)
        if (h.length >= 2) {
            return h(ctx, next);
        }
        return h(ctx);
    };
    return next();
}

beforeAll(async () => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    await db.init();
});

afterAll(async () => {
    await db.close();
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});

test('admin addmenu and removemenu', async () => {
    const fakeBot = makeFakeBot();
    const services = { db, config, logger, admin: createAdminService(config, logger) };
    await adminModule.init(fakeBot, services);

    const adminCtx = {
        from: { id: 1111 },
        message: { text: '/addmenu Hello Button | hello_key' },
        replyCalledWith: null,
        reply(msg) { this.replyCalledWith = msg; return Promise.resolve(); },
    };

    const addHandlers = fakeBot._commands['addmenu'];
    expect(addHandlers).toBeDefined();
    await runHandlers(addHandlers, adminCtx);

    const menus = await db.list('menus');
    expect(menus.find((m) => m.key === 'hello_key')).toBeTruthy();

    // Now remove
    const removeCtx = {
        from: { id: 1111 },
        message: { text: '/removemenu hello_key' },
        replyCalledWith: null,
        reply(msg) { this.replyCalledWith = msg; return Promise.resolve(); },
    };

    const remHandlers = fakeBot._commands['removemenu'];
    await runHandlers(remHandlers, removeCtx);
    const after = await db.list('menus');
    expect(after.find((m) => m.key === 'hello_key')).toBeUndefined();
});
