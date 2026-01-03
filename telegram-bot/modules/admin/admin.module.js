/**
 * modules/admin/admin.module.js
 * Admin command handlers. All admin checks should use `services.config.ADMIN_IDS`.
 */

/**
 * Initialize admin module
 * @param {import('telegraf').Telegraf} bot
 * @param {Object} services
 */
async function init(bot, services) {
    const { logger, config, db } = services;

    const { isAdminCtx, requireAdmin } = services.admin;

    bot.command('listmenu', requireAdmin(), async (ctx) => {
        const menus = await db.list('menus');
        if (!menus.length) return ctx.reply('No menus configured');
        const lines = menus.map((m) => `${m.key}: ${m.text}`).join('\n');
        await ctx.reply(`Menus:\n${lines}`);
        logger.info('Admin listed menus', ctx.from && ctx.from.id);
    });

    // Admin-only: addmenu Button Text | KEY
    const { createMenuStore } = require('../menu/menu.store');
    const menuStore = createMenuStore(db);

    bot.command('addmenu', requireAdmin(), async (ctx) => {
        const payload = ctx.message.text.replace('/addmenu', '').trim();
        const parts = payload.split('|').map((p) => p.trim());
        if (parts.length !== 2) return ctx.reply('Usage: /addmenu Button Text | ACTION_KEY');
        const [text, key] = parts;
        // Validate key: alnum, dash, underscore
        if (!/^[a-zA-Z0-9_-]{1,32}$/.test(key)) return ctx.reply('Invalid ACTION_KEY. Use alphanumeric, -, _ up to 32 chars.');
        const exists = await menuStore.getByKey(key);
        if (exists) return ctx.reply('A menu with that ACTION_KEY already exists');
        await menuStore.add({ id: Date.now().toString(), text, key });
        await ctx.reply(`Added menu: ${text} (${key})`);
    });

    bot.command('removemenu', requireAdmin(), async (ctx) => {
        const key = ctx.message.text.replace('/removemenu', '').trim();
        if (!key) return ctx.reply('Usage: /removemenu ACTION_KEY');
        const item = await menuStore.getByKey(key);
        if (!item) return ctx.reply('Menu not found');
        await menuStore.remove(item.id);
        await ctx.reply(`Removed menu ${key}`);
    });
}

module.exports = { init };
