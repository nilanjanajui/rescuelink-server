import { Router } from 'express';
import { verifyJWT } from '../middleware/verifyJWT';
import { requireRole } from '../middleware/requireRole';
import { getUsersForVerification, toggleUserVerification } from '../controllers/admin.controller';

const router = Router();

// Require admin role for all moderation endpoints
router.get('/users', verifyJWT, requireRole('admin'), getUsersForVerification);
router.patch('/users/:id/verify', verifyJWT, requireRole('admin'), toggleUserVerification);

export default router;
