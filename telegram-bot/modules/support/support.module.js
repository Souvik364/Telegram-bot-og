/**
 * modules/support/support.module.js
 * Forward user messages to admins and route admin replies back to the original user.
 * This is a minimal, modular implementation — for a production system consider ticket states.
 */

/**
 * Initialize support module
 * @param {import('telegraf').Telegraf} bot
 * @param {Object} services
 */
async function init(bot, services) {
    const { db, config, logger } = services;

    // Forward any message that starts with /support or a direct message to support
    bot.command('support', async (ctx) => {
        const text = ctx.message.text.replace('/support', '').trim() || 'No message';
        const ticket = { id: Date.now().toString(), userId: ctx.from.id, text, createdAt: new Date().toISOString() };
        await db.insert('support', ticket);

        // Notify all admins with ticket id
        const admins = config.ADMIN_IDS || [];
        for (const adminId of admins) {
            try {
                await ctx.telegram.sendMessage(adminId, `Support ticket #${ticket.id} from ${ctx.from.id}: ${text}`);
            } catch (e) {
                logger.warn('Failed to notify admin', adminId, e.message);
            }
        }

        await ctx.reply('Thanks! Your message has been forwarded to support.');
    });

    // Admin reply helper uses services.admin middleware for auth
    const { requireAdmin } = services.admin;

    // List tickets: /tickets
    bot.command('tickets', requireAdmin(), async (ctx) => {
        const tickets = await db.list('support');
        if (!tickets.length) return ctx.reply('No support tickets');
        const lines = tickets.map((t) => `#${t.id} from ${t.userId} - ${t.status || 'open'}`).join('\n');
        await ctx.reply(`Tickets:\n${lines}`);
    });

    // Reply by ticket id: /replyticket TICKET_ID | message
    bot.command('replyticket', requireAdmin(), async (ctx) => {
        const payload = ctx.message.text.replace('/replyticket', '').trim();
        const parts = payload.split('|').map((p) => p.trim());
        if (parts.length < 2) return ctx.reply('Usage: /replyticket TICKET_ID | Your message here');
        const [ticketId, ...rest] = parts;
        const ticket = (await db.list('support')).find((t) => t.id === ticketId);
        if (!ticket) return ctx.reply('Ticket not found');
        const msg = rest.join('|');
        // Send message to original user
        await ctx.telegram.sendMessage(ticket.userId, `Support reply: ${msg}`);
        // Update ticket
        await db.update('support', ticket.id, { status: 'responded', responderId: ctx.from.id, response: msg, respondedAt: new Date().toISOString() });
        await ctx.reply('Reply sent and ticket updated');
    });
}

module.exports = { init };
