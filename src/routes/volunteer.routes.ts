import { Router } from 'express';
import { verifyJWT } from '../middleware/verifyJWT';
import { requireRole } from '../middleware/requireRole';
import { getSignupStatus, createSignup } from '../controllers/volunteer.controller';

const router = Router();

router.get('/status', verifyJWT, requireRole('user', 'admin'), getSignupStatus);
router.post('/', verifyJWT, requireRole('user', 'admin'), createSignup);

export default router;