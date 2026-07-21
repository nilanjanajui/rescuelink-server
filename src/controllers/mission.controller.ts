import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Mission from '../models/Mission';
import VolunteerSignup from '../models/VolunteerSignup';
import Update from '../models/Update';
import { geocodeLocation } from '../lib/geocoder';

// Helper to resolve poster names & verification status from Better Auth's `user` collection
async function enrichMissionsWithPosters(missions: any[]) {
  const { db } = mongoose.connection;
  if (!db || missions.length === 0) {
    return missions.map((m) => ({
      ... (m.toObject ? m.toObject() : m),
      posterName: 'Organization',
      isVerified: false,
    }));
  }

  const posterIds = [...new Set(missions.map((m) => m.postedBy))];
  const validObjectIds = posterIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  let posterMap = new Map<string, { name: string; isVerified: boolean }>();

  if (validObjectIds.length > 0) {
    const users = await db
      .collection('user')
      .find({ _id: { $in: validObjectIds } })
      .project({ name: 1, isVerified: 1 })
      .toArray()
      .catch(() => []);

    posterMap = new Map(
      users.map((u) => [
        String(u._id),
        { name: (u.name as string) || 'Organization', isVerified: !!u.isVerified },
      ])
    );
  }

  return missions.map((m) => {
    const obj = m.toObject ? m.toObject() : m;
    const poster = posterMap.get(obj.postedBy);
    return {
      ...obj,
      posterName: poster?.name || 'Organization',
      isVerified: poster?.isVerified || false,
    };
  });
}

// GET /api/missions — public listing with poster enrichment and filtering
export const getMissions = async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      disasterType,
      urgency,
      sort = 'recent',
      page,
      pageSize = '8',
      limit,
    } = req.query as Record<string, string | undefined>;

    const match: Record<string, unknown> = {};
    if (status) match.status = status;
    if (disasterType) match.disasterType = disasterType;
    if (urgency) match.urgency = urgency;
    if (search) {
      const regex = new RegExp(search, 'i');
      match.$or = [{ title: regex }, { location: regex }, { shortDescription: regex }];
    }

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      {
        $addFields: {
          urgencyWeight: {
            $switch: {
              branches: [
                { case: { $eq: ['$urgency', 'critical'] }, then: 0 },
                { case: { $eq: ['$urgency', 'moderate'] }, then: 1 },
                { case: { $eq: ['$urgency', 'low'] }, then: 2 },
              ],
              default: 3,
            },
          },
          remainingNeed: { $subtract: ['$volunteersNeeded', '$volunteersJoined'] },
        },
      },
    ];

    if (sort === 'urgent') {
      pipeline.push({ $sort: { urgencyWeight: 1, createdAt: -1 } });
    } else if (sort === 'volunteers') {
      pipeline.push({ $sort: { remainingNeed: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Simple "featured" mode — flat array, no pagination.
    if (limit && !page) {
      const rawMissions = await Mission.aggregate([...pipeline, { $limit: Number(limit) }]);
      const missions = await enrichMissionsWithPosters(rawMissions);
      return res.json({ missions });
    }

    // Explore mode — paginated.
    const pageNum = Math.max(1, Number(page ?? '1'));
    const pageSizeNum = Math.max(1, Number(pageSize));

    const [rawMissions, countResult] = await Promise.all([
      Mission.aggregate([
        ...pipeline,
        { $skip: (pageNum - 1) * pageSizeNum },
        { $limit: pageSizeNum },
      ]),
      Mission.aggregate([...pipeline, { $count: 'total' }]),
    ]);

    const total = countResult[0]?.total ?? 0;
    const missions = await enrichMissionsWithPosters(rawMissions);

    res.json({
      missions,
      pagination: {
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.max(1, Math.ceil(total / pageSizeNum)),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch missions' });
  }
};

// GET /api/missions/mine — missions posted by the logged-in user
export const getMyMissions = async (req: Request, res: Response) => {
  try {
    const rawMissions = await Mission.find({ postedBy: req.user!.id }).sort({ createdAt: -1 });
    const missions = await enrichMissionsWithPosters(rawMissions);
    res.json({ missions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your missions' });
  }
};

// GET /api/missions/admin/all — admin-only listing
export const getAllMissionsForAdmin = async (req: Request, res: Response) => {
  try {
    const rawMissions = await Mission.find().sort({ createdAt: -1 });
    const enriched = await enrichMissionsWithPosters(rawMissions);
    res.json({ missions: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all missions' });
  }
};

// GET /api/missions/:id — public mission details
export const getMissionById = async (req: Request, res: Response) => {
  try {
    const rawMission = await Mission.findById(req.params.id);
    if (!rawMission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    const [enriched] = await enrichMissionsWithPosters([rawMission]);
    res.json({ mission: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch mission' });
  }
};

const REQUIRED_FIELDS = [
  'title',
  'shortDescription',
  'fullDescription',
  'disasterType',
  'urgency',
  'location',
  'volunteersNeeded',
] as const;

const DISASTER_TYPES = ['flood', 'earthquake', 'fire', 'cyclone', 'other'];
const URGENCY_LEVELS = ['critical', 'moderate', 'low'];

// POST /api/missions — create a mission. Protected: user/admin only.
export const createMission = async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;

    for (const field of REQUIRED_FIELDS) {
      if (body[field] === undefined || body[field] === '') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }
    if (!DISASTER_TYPES.includes(body.disasterType as string)) {
      return res.status(400).json({ message: 'Invalid disasterType' });
    }
    if (!URGENCY_LEVELS.includes(body.urgency as string)) {
      return res.status(400).json({ message: 'Invalid urgency' });
    }
    const volunteersNeeded = Number(body.volunteersNeeded);
    if (!Number.isFinite(volunteersNeeded) || volunteersNeeded < 1) {
      return res.status(400).json({ message: 'volunteersNeeded must be a positive number' });
    }

    const estimatedHours = Number(body.estimatedHours) || 4;
    const locationStr = body.location as string;
    const coordinates = await geocodeLocation(locationStr);

    const imageUrl =
      typeof body.imageUrl === 'string' && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : `https://picsum.photos/seed/mission-${Date.now()}/900/600`;

    const mission = await Mission.create({
      title: body.title as string,
      shortDescription: body.shortDescription as string,
      fullDescription: body.fullDescription as string,
      disasterType: body.disasterType as 'flood' | 'earthquake' | 'fire' | 'cyclone' | 'other',
      urgency: body.urgency as 'critical' | 'moderate' | 'low',
      location: locationStr,
      coordinates,
      volunteersNeeded,
      volunteersJoined: 0,
      estimatedHours,
      status: 'active',
      imageUrl,
      images: [imageUrl],
      postedBy: req.user!.id,
    });

    const [enriched] = await enrichMissionsWithPosters([mission]);
    res.status(201).json({ mission: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create mission' });
  }
};

async function assertOwnerOrAdmin(req: Request, res: Response, missionId: string) {
  const mission = await Mission.findById(missionId);
  if (!mission) {
    res.status(404).json({ message: 'Mission not found' });
    return null;
  }
  if (mission.postedBy !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ message: 'You can only manage missions you posted' });
    return null;
  }
  return mission;
}

// PATCH /api/missions/:id/status — toggle Active <-> Resolved. Protected
export const updateMissionStatus = async (req: Request, res: Response) => {
  try {
    const mission = await assertOwnerOrAdmin(req, res, String(req.params.id));
    if (!mission) return;

    const { status } = req.body as { status?: string };
    if (status !== 'active' && status !== 'resolved') {
      return res.status(400).json({ message: 'status must be "active" or "resolved"' });
    }

    mission.status = status;
    await mission.save();
    res.json({ mission });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update mission status' });
  }
};

// DELETE /api/missions/:id
export const deleteMission = async (req: Request, res: Response) => {
  try {
    const mission = await assertOwnerOrAdmin(req, res, String(req.params.id));
    if (!mission) return;

    const missionId = String(mission._id);
    await Promise.all([
      Mission.deleteOne({ _id: missionId }),
      VolunteerSignup.deleteMany({ missionId }),
      Update.deleteMany({ missionId }),
    ]);

    res.json({ message: 'Mission deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete mission' });
  }
};