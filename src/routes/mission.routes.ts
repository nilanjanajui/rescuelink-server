import { Router } from 'express';
import { verifyJWT } from '../middleware/verifyJWT';
import { requireRole } from '../middleware/requireRole';
import { getMissions, getMissionById } from '../controllers/mission.controller';

const router = Router();

router.get('/', getMissions);
router.get('/:id', getMissionById);

// Phase 2 smoke test: proves the JWT chain end-to-end (401 with no/invalid
// token, 403 for a Tenant, 200 for user/admin). Real create-mission logic
// replaces this body in Phase 4 — the middleware stays as-is.
router.post('/', verifyJWT, requireRole('user', 'admin'), (req, res) => {
  res.status(200).json({
    message: 'Token verified and role authorized — mission creation lands in Phase 4',
    user: req.user,
  });
});

export default router;