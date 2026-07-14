import { Request, Response } from 'express';
import Testimonial from '../models/Testimonial';

// GET /api/testimonials — public, used on the homepage and Success Stories page
export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json({ testimonials });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch testimonials' });
  }
};
