"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN']));
router.get('/users', admin_controller_1.listUsers);
router.post('/users', admin_controller_1.createUser);
router.put('/users/:id', admin_controller_1.updateUser);
router.delete('/users/:id', admin_controller_1.deleteUser);
router.get('/settings', admin_controller_1.getNotificationSettings);
router.put('/settings', admin_controller_1.updateNotificationSettings);
router.get('/recipients', admin_controller_1.listRecipients);
router.post('/recipients', admin_controller_1.addRecipient);
router.delete('/recipients/:id', admin_controller_1.deleteRecipient);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map