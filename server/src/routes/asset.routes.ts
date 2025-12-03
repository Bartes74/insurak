import { Router } from 'express';
import { getAssets, createAsset, updateAsset, deleteAsset, renewPolicy, getPolicyHistory, uploadPolicyFiles, listPolicyFiles, downloadPolicyFile } from '../controllers/asset.controller';
import { authenticateToken, requireEditPermission } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../lib/upload';

const router = Router();

console.log('✅ Loading asset routes...');

router.get('/', authenticateToken, getAssets);
router.get('/:id/history', authenticateToken, getPolicyHistory);
router.get('/:id/files', authenticateToken, listPolicyFiles);
router.get('/:id/files/:filename', authenticateToken, downloadPolicyFile);
router.post('/', authenticateToken, requireEditPermission, createAsset);
router.post('/:id/renew', authenticateToken, requireEditPermission, renewPolicy);
router.post('/:id/files', authenticateToken, requireEditPermission, uploadMiddleware.array('files', 5), uploadPolicyFiles);
router.put('/:id', authenticateToken, requireEditPermission, updateAsset);
router.delete('/:id', authenticateToken, requireEditPermission, deleteAsset);

export default router;
