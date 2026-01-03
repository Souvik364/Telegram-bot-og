/**
 * modules/menu/menu.store.js
 * A tiny helper to work with menu records in the DB; keeps module code tidy.
 */

/**
 * @param {Object} db - db service with minimal API (list, get, insert, update, remove)
 */
function createMenuStore(db) {
    return {
        list: () => db.list('menus'),
        getByKey: async (key) => (await db.list('menus')).find((m) => m.key === key) || null,
        add: (item) => db.insert('menus', item),
        remove: (id) => db.remove('menus', id),
    };
}

module.exports = { createMenuStore };
