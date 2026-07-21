import { Router } from 'express';
import { getUpdatesByMission, createMissionUpdate } from '../controllers/update.controller';
import { verifyJWT } from '../middleware/verifyJWT';

const router = Router();

router.get('/', getUpdatesByMission);
router.post('/', verifyJWT, createMissionUpdate);

export default router;
