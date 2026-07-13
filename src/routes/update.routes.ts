import { Router } from 'express';
import { getUpdatesByMission } from '../controllers/update.controller';

const router = Router();

router.get('/', getUpdatesByMission);

export default router;
