import { Router } from 'express';
import { verifyJWT } from '../middleware/verifyJWT';
import { getDashboard } from '../controllers/dashboard.controller';

const router = Router();
router.get('/', verifyJWT, getDashboard);
export default router;