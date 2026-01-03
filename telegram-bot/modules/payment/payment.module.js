/**
 * modules/payment/payment.module.js
 * QR-only demo payment flow: /plans shows plans, /pay <PLAN_ID> generates a QR (DataURL)
 * which the user scans with their payment app; payment remains `pending` until confirmed.
 * Confirmation can be done by the user with `/confirm <PAYMENT_ID>` or by an admin with `/payconfirm <PAYMENT_ID>`.
 */

const QRCode = require('qrcode');

const PLANS = {
    p1: { id: 'p1', name: '1 month', price: 50, months: 1 },
    p3: { id: 'p3', name: '3 months', price: 120, months: 3 },
};

/**
 * Initialize payment module
 * @param {import('telegraf').Telegraf} bot
 * @param {Object} services
 */
async function init(bot, services) {
    const { db, config, logger } = services;

    bot.command('plans', async (ctx) => {
        const msg = Object.values(PLANS).map((p) => `${p.id}: ${p.name} - ₹${p.price}`).join('\n');
        await ctx.reply(`Plans:\n${msg}\nUse /pay PLAN_ID to generate a payment QR.`);
    });

    // /pay PLAN_ID -> generate QR and save pending payment
    bot.command('pay', async (ctx) => {
        const id = ctx.message.text.replace('/pay', '').trim();
        if (!id) return ctx.reply('Usage: /pay PLAN_ID');
        const plan = PLANS[id];
        if (!plan) return ctx.reply('Plan not found. Use /plans to list available plans.');

        const paymentId = `pay_${Date.now()}`;
        // Create a simple payload for QR (demo UPI-like or generic payload)
        const payload = `PAYMENT|id:${paymentId}|user:${ctx.from.id}|plan:${plan.id}|amount:${plan.price}`;
        try {
            const dataUrl = await QRCode.toDataURL(payload, { width: config.QR_DEFAULT_SIZE || 300 });
            // Store payment as pending with QR payload (store DataURL to keep demo simple)
            const record = { id: paymentId, userId: ctx.from.id, planId: plan.id, amount: plan.price, status: 'pending', qr: dataUrl, createdAt: new Date().toISOString() };
            await db.insert('payments', record);
            // Send QR photo to user
            const base64 = dataUrl.split(',')[1];
            const buf = Buffer.from(base64, 'base64');
            await ctx.reply(`Payment ID: ${paymentId}. Scan the QR with your payment app, then confirm with /confirm ${paymentId}`);
            await ctx.replyWithPhoto({ source: buf });
        } catch (e) {
            logger.error('Failed to generate payment QR', e.message);
            await ctx.reply('Failed to generate payment QR. Try again later.');
        }
    });

    // User confirms their payment
    bot.command('confirm', async (ctx) => {
        const paymentId = ctx.message.text.replace('/confirm', '').trim();
        if (!paymentId) return ctx.reply('Usage: /confirm PAYMENT_ID');
        const payment = (await db.list('payments')).find((p) => p.id === paymentId && p.userId === ctx.from.id);
        if (!payment) return ctx.reply('Payment not found');
        if (payment.status === 'paid') return ctx.reply('Payment already marked as paid');
        await db.update('payments', paymentId, { status: 'paid', paidAt: new Date().toISOString() });
        // Activate subscription
        const plan = PLANS[payment.planId];
        if (plan) {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + plan.months);
            await db.insert('subscriptions', { id: `sub_${Date.now()}`, userId: ctx.from.id, planId: plan.id, expiresAt: expiresAt.toISOString(), createdAt: new Date().toISOString() });
        }
        await ctx.reply('Payment confirmed and subscription activated (demo).');
    });

    // Admin can mark a payment as paid
    const { requireAdmin } = services.admin;
    bot.command('payconfirm', requireAdmin(), async (ctx) => {
        const paymentId = ctx.message.text.replace('/payconfirm', '').trim();
        if (!paymentId) return ctx.reply('Usage: /payconfirm PAYMENT_ID');
        const payment = (await db.list('payments')).find((p) => p.id === paymentId);
        if (!payment) return ctx.reply('Payment not found');
        if (payment.status === 'paid') return ctx.reply('Payment already marked as paid');
        await db.update('payments', paymentId, { status: 'paid', paidAt: new Date().toISOString(), confirmedBy: ctx.from.id });
        // Activate subscription for the user
        const plan = PLANS[payment.planId];
        if (plan) {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + plan.months);
            await db.insert('subscriptions', { id: `sub_${Date.now()}`, userId: payment.userId, planId: plan.id, expiresAt: expiresAt.toISOString(), createdAt: new Date().toISOString() });
        }
        await ctx.reply('Payment marked as paid and subscription activated (demo).');
    });
}

module.exports = { init };
