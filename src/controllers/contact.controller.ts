import { Request, Response } from 'express';
import ContactMessage from '../models/ContactMessage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact — public contact form submission
export const createContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body as Record<
      string,
      string
    >;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });
    res
      .status(201)
      .json({ message: 'Message received', id: contactMessage._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message' });
  }
};
