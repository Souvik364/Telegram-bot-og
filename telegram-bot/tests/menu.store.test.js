const fs = require('fs');
const path = require('path');
const tmpFile = path.join(__dirname, 'tmp_db_menu.json');
process.env.DATA_PATH = tmpFile;
const db = require('../services/db.service');
const { createMenuStore } = require('../modules/menu/menu.store');

beforeAll(async () => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    await db.init();
});

afterAll(async () => {
    await db.close();
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});

test('menu store add/get/remove', async () => {
    const store = createMenuStore(db);
    await store.add({ id: 'm1', text: 'Hello', key: 'hello' });
    const items = await store.list();
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = await store.getByKey('hello');
    expect(found).not.toBeNull();
    await store.remove('m1');
    const after = await store.list();
    expect(after.find((x) => x.id === 'm1')).toBeUndefined();
});
