import { Router } from 'express';

const router = Router();

// TODO (Phase 4): wire real controllers + verifyJWT middleware here
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Update routes not implemented yet' });
});

export default router;
