import { Router } from 'express';
import { createSubscriber } from '../controllers/subscriber.controller';

const router = Router();
router.post('/', createSubscriber);
export default router;
