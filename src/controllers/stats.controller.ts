import { Request, Response } from 'express';
import Mission from '../models/Mission';
import VolunteerSignup from '../models/VolunteerSignup';

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalMissions = await Mission.countDocuments({ status: 'active' });
    const totalVolunteers = await VolunteerSignup.countDocuments();
    const resolvedCount = await Mission.countDocuments({ status: 'resolved' });
    const totalCount = await Mission.countDocuments();
    const successRate = totalCount
      ? Math.round((resolvedCount / totalCount) * 100)
      : 0;
    res.json({ totalMissions, totalVolunteers, successRate });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

type VolunteerGrowthAgg = { _id: string; volunteers: number };

export const getVolunteerGrowth = async (req: Request, res: Response) => {
  try {
    const data = await VolunteerSignup.aggregate<VolunteerGrowthAgg>([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$joinedAt' } },
          volunteers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);
    const formatted = data.map((d: VolunteerGrowthAgg) => ({
      month: d._id,
      volunteers: d.volunteers,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch volunteer growth' });
  }
};


type ByDisasterTypeAgg = { _id: string; count: number };

// GET /api/stats/by-disaster-type — used on the Impact Reports page
export const getMissionsByDisasterType = async (req: Request, res: Response) => {
  try {
    const data = await Mission.aggregate<ByDisasterTypeAgg>([
      { $group: { _id: '$disasterType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(data.map((d) => ({ disasterType: d._id, count: d.count })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch mission breakdown' });
  }
};