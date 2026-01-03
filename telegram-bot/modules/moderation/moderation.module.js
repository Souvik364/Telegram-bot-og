/**
 * modules/moderation/moderation.module.js
 * Basic moderation: rate limiting (simple), keyword auto-reply and link filtering.
 */

/**
 * Initialize moderation module
 * @param {import('telegraf').Telegraf} bot
 * @param {Object} services
 */
async function init(bot, services) {
    const { logger } = services;

    const forbidden = ['badword1', 'badword2'];

    bot.on('message', async (ctx, next) => {
        try {
            const text = (ctx.message && ctx.message.text) || '';
            const lowered = text.toLowerCase();
            if (forbidden.some((w) => lowered.includes(w))) {
                await ctx.reply('Please avoid using prohibited words.');
                return;
            }
            // crude link filter
            if (text.includes('http://') || text.includes('https://')) {
                // Optionally delete or warn
                await ctx.reply('Links are not allowed here.');
                return;
            }
        } catch (e) {
            logger.warn('Moderation middleware failed', e.message);
        }
        return next();
    });
}

module.exports = { init };
