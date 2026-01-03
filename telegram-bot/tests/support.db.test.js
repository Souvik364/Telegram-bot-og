const fs = require('fs');
const path = require('path');
const tmpFile = path.join(__dirname, 'tmp_db_support.json');
process.env.DATA_PATH = tmpFile;
const db = require('../services/db.service');

beforeAll(async () => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    await db.init();
});

afterAll(async () => {
    await db.close();
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});

test('create and respond to support ticket', async () => {
    const ticket = { id: 't1', userId: 42, text: 'Help', createdAt: new Date().toISOString(), status: 'open' };
    await db.insert('support', ticket);
    const all = await db.list('support');
    expect(all.find((t) => t.id === 't1')).toBeTruthy();

    await db.update('support', 't1', { status: 'responded', responderId: 1001, response: 'OK', respondedAt: new Date().toISOString() });
    const t = (await db.list('support')).find((x) => x.id === 't1');
    expect(t.status).toBe('responded');
    expect(t.responderId).toBe(1001);
});
