import { Router } from 'express';
import { verifyJWT } from '../middleware/verifyJWT';
import { getRecommendations } from '../controllers/recommendation.controller';

const router = Router();

// Endpoint: GET /api/recommendations (Protected with verifyJWT)
router.get('/', verifyJWT, getRecommendations);

export default router;
