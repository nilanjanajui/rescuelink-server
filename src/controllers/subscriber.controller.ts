import { Request, Response } from 'express';
import Subscriber from '../models/Subscriber';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter — public newsletter signup
export const createSubscriber = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    // Upsert so re-submitting the same email is a no-op, not an error.
    await Subscriber.updateOne(
      { email: email.toLowerCase().trim() },
      { $setOnInsert: { email: email.toLowerCase().trim() } },
      { upsert: true },
    );

    res.status(201).json({ message: 'Subscribed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to subscribe' });
  }
};
