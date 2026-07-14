import { Router } from 'express';
import { getStats, getVolunteerGrowth } from '../controllers/stats.controller';

const router = Router();
router.get('/', getStats);
router.get('/volunteer-growth', getVolunteerGrowth);
export default router;