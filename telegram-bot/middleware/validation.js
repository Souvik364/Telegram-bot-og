/**
 * middleware/validation.js
 * Small input validation helpers for command payloads.
 */

function requireArgs(count, usageMsg) {
    return async (ctx, next) => {
        const payload = (ctx.message && ctx.message.text) || '';
        const parts = payload.replace(/^\/\w+/, '').trim();
        if (!parts || parts.split('|').length < count) {
            return ctx.reply && ctx.reply(usageMsg || 'Invalid usage');
        }
        return next();
    };
}

module.exports = { requireArgs };
