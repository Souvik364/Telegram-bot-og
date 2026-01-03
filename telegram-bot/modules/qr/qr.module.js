/**
 * modules/qr/qr.module.js
 * QR code generation using `qrcode` package. Returns an image (as Data URL) or file.
 */

const QRCode = require('qrcode');

/**
 * Initialize qr module
 * @param {import('telegraf').Telegraf} bot
 * @param {Object} services
 */
async function init(bot, services) {
    const { config } = services;

    bot.command('qr', async (ctx) => {
        const payload = ctx.message.text.replace('/qr', '').trim();
        if (!payload) return ctx.reply('Usage: /qr text-to-encode');

        const size = config.QR_DEFAULT_SIZE || 300;
        try {
            const dataUrl = await QRCode.toDataURL(payload, { width: size });
            // Send as photo by converting data URL to buffer
            const base64Data = dataUrl.split(',')[1];
            const buf = Buffer.from(base64Data, 'base64');
            await ctx.replyWithPhoto({ source: buf });
        } catch (e) {
            await ctx.reply('Failed to generate QR code');
        }
    });
}

module.exports = { init };
