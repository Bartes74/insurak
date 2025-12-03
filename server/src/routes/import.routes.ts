import { Router } from 'express';
import { dryRunImport, commitImport } from '../controllers/import.controller';
import { authenticateToken, requireEditPermission } from '../middleware/auth.middleware';

const router = Router();

router.post('/dry-run', authenticateToken, requireEditPermission, dryRunImport);
router.post('/commit', authenticateToken, requireEditPermission, commitImport);

export default router;
