// Tests for support module handlers (support, replyticket)
const fs = require('fs');
const path = require('path');
const tmpFile = path.join(__dirname, 'tmp_db_support_handlers.json');
process.env.DATA_PATH = tmpFile;
process.env.ADMIN_IDS = '2222,3333';

const db = require('../services/db.service');
const config = require('../config/env.config');
const logger = require('../services/logger.service');
const createAdminService = require('../services/admin.service');
const supportModule = require('../modules/support/support.module');

function makeFakeBot() {
    return {
        _commands: {},
        command(name, ...handlers) {
            this._commands[name] = handlers;
        },
    };
}

async function runHandlers(handlers, ctx) {
    let idx = 0;
    const next = async () => {
        const h = handlers[idx++];
        if (!h) return;
        if (h.length >= 2) return h(ctx, next);
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

test('support command creates ticket and notifies admins', async () => {
    const fakeBot = makeFakeBot();
    const services = { db, config, logger, admin: createAdminService(config, logger) };
    await supportModule.init(fakeBot, services);

    const messagesSent = [];
    const userCtx = {
        from: { id: 9999 },
        message: { text: '/support I need help' },
        reply(msg) { this._lastReply = msg; return Promise.resolve(); },
        telegram: { sendMessage: (id, msg) => messagesSent.push({ id, msg }) },
    };

    const handlers = fakeBot._commands['support'];
    await runHandlers(handlers, userCtx);

    const tickets = await db.list('support');
    expect(tickets.find((t) => t.userId === 9999)).toBeTruthy();
    // Should have notified both admins
    expect(messagesSent.length).toBe(2);
});

test('admin replyticket updates ticket and sends message to user', async () => {
    // create ticket
    const ticket = { id: 'rt1', userId: 7777, text: 'Hi', createdAt: new Date().toISOString(), status: 'open' };
    await db.insert('support', ticket);

    const fakeBot = makeFakeBot();
    const services = { db, config, logger, admin: createAdminService(config, logger) };
    await supportModule.init(fakeBot, services);

    const messagesSent = [];
    const adminCtx = {
        from: { id: 2222 },
        message: { text: '/replyticket rt1 | We fixed it' },
        reply(msg) { this._lastReply = msg; return Promise.resolve(); },
        telegram: { sendMessage: (id, msg) => messagesSent.push({ id, msg }) },
    };

    const handlers = fakeBot._commands['replyticket'];
    await runHandlers(handlers, adminCtx);

    const t = (await db.list('support')).find((x) => x.id === 'rt1');
    expect(t.status).toBe('responded');
    expect(t.responderId).toBe(2222);
    // message to original user
    expect(messagesSent.find((m) => m.id === 7777)).toBeTruthy();
});
