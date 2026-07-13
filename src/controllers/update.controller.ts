import { Request, Response } from 'express';
import Update from '../models/Update';

// GET /api/updates?missionId=... — public updates feed for a mission's
// details page (no auth required to read).
export const getUpdatesByMission = async (req: Request, res: Response) => {
  try {
    const { missionId } = req.query as { missionId?: string };
    if (!missionId)
      return res.status(400).json({ message: 'missionId is required' });

    const updates = await Update.find({ missionId }).sort({ createdAt: -1 });
    res.json({ updates });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch updates' });
  }
};
