import { Router } from 'express';
import { login, register, forgotPassword, resetPassword, changePassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', authenticateToken, register);
router.post('/bootstrap', register); // allows first admin creation when no users
router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);
router.post('/change-password', authenticateToken, changePassword);

export default router;
