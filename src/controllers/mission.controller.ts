import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Mission from '../models/Mission';

// GET /api/missions — public listing.
// Supports two modes:
//  - `limit` alone (used by the homepage's FeaturedMissions): returns a flat
//    array, no pagination metadata.
//  - `page`/`pageSize` (used by the Explore page): returns pagination info
//    alongside the results, plus search/sort/filtering.
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
      match.$or = [
        { title: regex },
        { location: regex },
        { shortDescription: regex },
      ];
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
          remainingNeed: {
            $subtract: ['$volunteersNeeded', '$volunteersJoined'],
          },
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
      const missions = await Mission.aggregate([
        ...pipeline,
        { $limit: Number(limit) },
      ]);
      return res.json({ missions });
    }

    // Explore mode — paginated.
    const pageNum = Math.max(1, Number(page ?? '1'));
    const pageSizeNum = Math.max(1, Number(pageSize));

    const [missions, countResult] = await Promise.all([
      Mission.aggregate([
        ...pipeline,
        { $skip: (pageNum - 1) * pageSizeNum },
        { $limit: pageSizeNum },
      ]),
      Mission.aggregate([...pipeline, { $count: 'total' }]),
    ]);

    const total = countResult[0]?.total ?? 0;

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