import { Router } from 'express';
import { getStats, getVolunteerGrowth, getMissionsByDisasterType } from '../controllers/stats.controller';

const router = Router();
router.get('/', getStats);
router.get('/volunteer-growth', getVolunteerGrowth);
router.get('/by-disaster-type', getMissionsByDisasterType);
export default router;