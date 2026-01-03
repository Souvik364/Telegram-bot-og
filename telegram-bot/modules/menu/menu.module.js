/**
 * modules/menu/menu.module.js
 * Dynamic menu module: admin can add/remove/list menu items stored in the DB.
 */

/**
 * Initialize menu module
 * @param {import('telegraf').Telegraf} bot
 * @param {Object} services
 */
async function init(bot, services) {
    const { db } = services;

    bot.command('menu', async (ctx) => {
        const menus = await db.list('menus');
        if (!menus.length) return ctx.reply('No menus available');
        const keyboard = menus.map((m) => [m.text]);
        await ctx.reply('Main Menu', { reply_markup: { keyboard, resize_keyboard: true } });
    });
}

module.exports = { init };
