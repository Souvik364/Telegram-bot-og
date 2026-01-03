/**
 * middleware/rateLimit.js
 * Very small per-user in-memory rate limiter (token bucket-like).
 */

function rateLimit({ points = 5, duration = 10 } = {}) {
    // store: userId -> { tokens, last }
    const store = new Map();

    return async (ctx, next) => {
        const id = ctx.from && ctx.from.id;
        if (!id) return next();
        const now = Date.now();
        const rec = store.get(id) || { tokens: points, last: now };
        // replenish
        const elapsed = Math.max(0, now - rec.last) / 1000;
        const refill = Math.floor(elapsed / duration) * points;
        if (refill > 0) rec.tokens = Math.min(points, rec.tokens + refill);
        rec.last = now;
        if (rec.tokens <= 0) return ctx.reply && ctx.reply('You are sending messages too fast. Please wait.');
        rec.tokens -= 1;
        store.set(id, rec);
        return next();
    };
}

module.exports = { rateLimit };
