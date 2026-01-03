/**
 * services/utils.service.js
 * Small utility helpers used across modules.
 */

module.exports = {
    safeId(value) {
        if (!value) return null;
        if (typeof value === 'number') return value;
        const n = Number(value);
        return Number.isNaN(n) ? null : n;
    },
    now() {
        return new Date().toISOString();
    },
};
