/**
 * modules/user/user.module.js
 * User-facing commands: /start, /help, /menu stub wiring.
 */

/**
 * Initialize user module
 * @param {import('telegraf').Telegraf} bot
 * @param {Object} services
 */
async function init(bot, services) {
    const { logger } = services;

    bot.start(async (ctx) => {
        const name = ctx.from && ctx.from.first_name ? ctx.from.first_name : 'there';
        await ctx.reply(`Welcome, ${name}! Use /menu to see available options.`);
        logger.info('User started bot', ctx.from && ctx.from.id);
    });

    bot.command('help', async (ctx) => {
        await ctx.reply('Available commands: /start, /help, /menu');
    });

    // Generic fallback for simple messages — real implementation is modular
    bot.on('message', async (ctx) => {
        // Keep minimal: let other modules handle it; this is only a placeholder.
        logger.debug('user module received message', ctx.message && ctx.message.text);
    });
}

module.exports = { init };
