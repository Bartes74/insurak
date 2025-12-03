"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const import_controller_1 = require("../controllers/import.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/dry-run', auth_middleware_1.authenticateToken, auth_middleware_1.requireEditPermission, import_controller_1.dryRunImport);
router.post('/commit', auth_middleware_1.authenticateToken, auth_middleware_1.requireEditPermission, import_controller_1.commitImport);
exports.default = router;
//# sourceMappingURL=import.routes.js.map