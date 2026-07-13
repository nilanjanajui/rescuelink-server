import { Request, Response } from 'express';
import VolunteerSignup from '../models/VolunteerSignup';
import Mission from '../models/Mission';

// GET /api/volunteer-signups/status?missionId=... — tells the client whether
// the current logged-in user has already joined this mission, so the
// "Join Mission" button can show the right state.
export const getSignupStatus = async (req: Request, res: Response) => {
  try {
    const { missionId } = req.query as { missionId?: string };
    if (!missionId)
      return res.status(400).json({ message: 'missionId is required' });

    const existing = await VolunteerSignup.findOne({
      missionId,
      userId: req.user!.id,
    });
    res.json({ joined: !!existing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check signup status' });
  }
};

// POST /api/volunteer-signups — join a mission as a volunteer.
// Tenants are blocked at the route level (requireRole) since they're
// browse-only accounts.
export const createSignup = async (req: Request, res: Response) => {
  try {
    const { missionId } = req.body as { missionId?: string };
    if (!missionId)
      return res.status(400).json({ message: 'missionId is required' });

    const mission = await Mission.findById(missionId);
    if (!mission) return res.status(404).json({ message: 'Mission not found' });

    const existing = await VolunteerSignup.findOne({
      missionId,
      userId: req.user!.id,
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'You have already joined this mission' });
    }

    await VolunteerSignup.create({ missionId, userId: req.user!.id });
    mission.volunteersJoined += 1;
    await mission.save();

    res
      .status(201)
      .json({ joined: true, volunteersJoined: mission.volunteersJoined });
  } catch (err) {
    res.status(500).json({ message: 'Failed to join mission' });
  }
};
