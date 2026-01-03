const fs = require('fs');
const path = require('path');

// Create a fresh temp db file to avoid clobbering project data
const tmpFile = path.join(__dirname, 'tmp_db.json');
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

test('insert and list collections', async () => {
    await db.insert('testcol', { id: '1', value: 'x' });
    const items = await db.list('testcol');
    expect(items).toHaveLength(1);
    expect(items[0].value).toBe('x');
});

test('get and update', async () => {
    await db.insert('things', { id: 't1', name: 'A' });
    const got = await db.get('things', 't1');
    expect(got.name).toBe('A');
    await db.update('things', 't1', { name: 'B' });
    const got2 = await db.get('things', 't1');
    expect(got2.name).toBe('B');
});
