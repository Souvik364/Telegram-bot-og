/**
 * services/admin.service.js
 * Central admin helpers: isAdmin check and requireAdmin middleware factory.
 */

/**
 * Create admin helpers
 * @param {Object} config
 * @param {Object} logger
 */
function createAdminService(config, logger) {
    function isAdminById(id) {
        if (!id) return false;
        return (config.ADMIN_IDS || []).includes(Number(id));
    }

    function isAdminCtx(ctx) {
        const id = ctx && ctx.from && ctx.from.id;
        return isAdminById(id);
    }

    function requireAdmin() {
        return async (ctx, next) => {
            if (!isAdminCtx(ctx)) return ctx.reply && ctx.reply('Unauthorized');
            return next();
        };
    }

    return { isAdminById, isAdminCtx, requireAdmin };
}

module.exports = createAdminService;
