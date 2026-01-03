/**
 * modules/subscription/subscription.module.js
 * Track subscription status and provide middleware to protect premium features.
 */

/**
 * Initialize subscription module
 * @param {import('telegraf').Telegraf} bot
 * @param {Object} services
 */
async function init(bot, services) {
    const { db } = services;

    // Simple middleware example — not registered globally here, but modules can use it
    async function checkSubscription(ctx, next) {
        const subs = await db.list('subscriptions');
        const userSub = subs.find((s) => s.userId === ctx.from.id);
        if (!userSub || new Date(userSub.expiresAt) < new Date()) {
            return ctx.reply('This is a premium feature. Please subscribe.');
        }
        return next();
    }

    // Expose middleware via services so other modules can use it (pattern, not intrusive)
    services.subscription = { checkSubscription };
}

module.exports = { init };
