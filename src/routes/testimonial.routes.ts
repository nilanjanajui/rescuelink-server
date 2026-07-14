import { Router } from 'express';
import { getTestimonials } from '../controllers/testimonial.controller';

const router = Router();
router.get('/', getTestimonials);
export default router;