const createAdminService = require('../services/admin.service');
const config = require('../config/env.config');
const logger = require('../services/logger.service');

describe('admin service', () => {
    test('isAdminById returns true for configured admin', () => {
        const svc = createAdminService(config, logger);
        const adminId = config.ADMIN_IDS[0];
        expect(svc.isAdminById(adminId)).toBe(true);
    });

    test('isAdminById returns false for random id', () => {
        const svc = createAdminService(config, logger);
        expect(svc.isAdminById(99999999)).toBe(false);
    });
});
