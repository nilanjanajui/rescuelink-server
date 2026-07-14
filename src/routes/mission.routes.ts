import { Router } from 'express';
import { verifyJWT } from '../middleware/verifyJWT';
import { requireRole } from '../middleware/requireRole';
import {
  getMissions,
  getMyMissions,
  getAllMissionsForAdmin,
  getMissionById,
  createMission,
  updateMissionStatus,
  deleteMission,
} from '../controllers/mission.controller';

const router = Router();

router.get('/', getMissions);

// Both must come before '/:id' — otherwise Express matches these as an :id param.
router.get('/mine', verifyJWT, requireRole('user', 'admin'), getMyMissions);
router.get('/admin/all', verifyJWT, requireRole('admin'), getAllMissionsForAdmin);

router.get('/:id', getMissionById);

router.post('/', verifyJWT, requireRole('user', 'admin'), createMission);
router.patch('/:id/status', verifyJWT, requireRole('user', 'admin'), updateMissionStatus);
router.delete('/:id', verifyJWT, requireRole('user', 'admin'), deleteMission);

export default router;