import { Request, Response } from 'express';
import Mission from '../models/Mission';

// GET /api/missions — public listing with basic filtering, used by
// FeaturedMissions on the homepage and (eventually) the Explore page.
// Full search/sort/pagination is Phase 3 — this covers what's needed now.
export const getMissions = async (req: Request, res: Response) => {
  try {
    const { limit, status, disasterType, urgency } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (disasterType) filter.disasterType = disasterType;
    if (urgency) filter.urgency = urgency;

    const query = Mission.find(filter).sort({ createdAt: -1 });
    if (limit) query.limit(Number(limit));

    const missions = await query.exec();
    res.json({ missions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch missions' });
  }
};

// GET /api/missions/:id — public mission details
export const getMissionById = async (req: Request, res: Response) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    res.json({ mission });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch mission' });
  }
};
