import { Request, Response } from 'express';
import mongoose from 'mongoose';

// GET /api/admin/users — admin-only listing of users with verification status
export const getUsersForVerification = async (req: Request, res: Response) => {
  try {
    const { db } = mongoose.connection;
    if (!db) {
      return res.status(500).json({ message: 'Database connection unavailable' });
    }

    const users = await db
      .collection('user')
      .find({})
      .project({ name: 1, email: 1, role: 1, isVerified: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = users.map((u) => ({
      _id: String(u._id),
      name: u.name || 'Unnamed Account',
      email: u.email,
      role: u.role || 'user',
      isVerified: !!u.isVerified,
      createdAt: u.createdAt,
    }));

    res.json({ users: formatted });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// PATCH /api/admin/users/:id/verify — admin-only toggle or set isVerified status
export const toggleUserVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body as { isVerified?: boolean };

    const { db } = mongoose.connection;
    if (!db) {
      return res.status(500).json({ message: 'Database connection unavailable' });
    }

    const userObjectId = new mongoose.Types.ObjectId(id as string);
    const user = await db.collection('user').findOne({ _id: userObjectId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newVerifiedState = typeof isVerified === 'boolean' ? isVerified : !user.isVerified;

    await db.collection('user').updateOne(
      { _id: userObjectId },
      { $set: { isVerified: newVerifiedState, updatedAt: new Date() } }
    );

    res.json({
      message: `User verification updated to ${newVerifiedState}`,
      userId: id,
      isVerified: newVerifiedState,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user verification' });
  }
};
