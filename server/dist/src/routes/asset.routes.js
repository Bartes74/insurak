"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asset_controller_1 = require("../controllers/asset.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = require("../lib/upload");
const router = (0, express_1.Router)();
console.log('✅ Loading asset routes...');
router.get('/', auth_middleware_1.authenticateToken, asset_controller_1.getAssets);
router.get('/:id/history', auth_middleware_1.authenticateToken, asset_controller_1.getPolicyHistory);
router.get('/:id/files', auth_middleware_1.authenticateToken, asset_controller_1.listPolicyFiles);
router.get('/:id/files/:filename', auth_middleware_1.authenticateToken, asset_controller_1.downloadPolicyFile);
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireEditPermission, asset_controller_1.createAsset);
router.post('/:id/renew', auth_middleware_1.authenticateToken, auth_middleware_1.requireEditPermission, asset_controller_1.renewPolicy);
router.post('/:id/files', auth_middleware_1.authenticateToken, auth_middleware_1.requireEditPermission, upload_1.uploadMiddleware.array('files', 5), asset_controller_1.uploadPolicyFiles);
router.put('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireEditPermission, asset_controller_1.updateAsset);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireEditPermission, asset_controller_1.deleteAsset);
exports.default = router;
//# sourceMappingURL=asset.routes.js.map