import { Request, Response } from 'express';
import Mission from '../models/Mission';
import VolunteerSignup from '../models/VolunteerSignup';
import { getPlatformStatsData } from './stats.controller';

// GET /api/dashboard — a single role-aware summary endpoint for the
// dashboard page: what you've posted, what you've joined, and (admin only)
// platform-wide numbers. One call instead of stitching together several.
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { role } = req.user!;

    const signups = await VolunteerSignup.find({ userId })
      .sort({ joinedAt: -1 })
      .limit(3);
    const joinedMissionIds = signups.map((s) => s.missionId);
    const joinedMissionDocs = await Mission.find({
      _id: { $in: joinedMissionIds },
    });
    const joinedMissionById = new Map(
      joinedMissionDocs.map((m) => [String(m._id), m]),
    );

    const recentJoinedMissions = signups
      .map((s) => {
        const mission = joinedMissionById.get(s.missionId);
        return mission ? { joinedAt: s.joinedAt, mission } : null;
      })
      .filter(Boolean);

    const missionsJoinedCount = await VolunteerSignup.countDocuments({
      userId,
    });

    let missionsPostedCount = 0;
    let recentPostedMissions: unknown[] = [];

    // Tenants are browse-only and never post missions.
    if (role !== 'Tenant') {
      missionsPostedCount = await Mission.countDocuments({ postedBy: userId });
      recentPostedMissions = await Mission.find({ postedBy: userId })
        .sort({ createdAt: -1 })
        .limit(3);
    }

    const payload: Record<string, unknown> = {
      missionsJoinedCount,
      recentJoinedMissions,
      missionsPostedCount,
      recentPostedMissions,
    };

    if (role === 'admin') {
      payload.platform = await getPlatformStatsData();
    }

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
};
