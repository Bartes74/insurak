import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  getNotificationSettings,
  updateNotificationSettings,
  listRecipients,
  addRecipient,
  deleteRecipient,
} from '../controllers/admin.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken, requireRole(['ADMIN']));

router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);

router.get('/recipients', listRecipients);
router.post('/recipients', addRecipient);
router.delete('/recipients/:id', deleteRecipient);

export default router;
