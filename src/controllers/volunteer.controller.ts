import { Request, Response } from 'express';
import mongoose from 'mongoose';
import VolunteerSignup from '../models/VolunteerSignup';
import Mission from '../models/Mission';
import { notifyMissionUpdated, sendUserNotification } from '../lib/socket';
import { sendNewVolunteerNotification } from '../services/email.service';

// GET /api/volunteer-signups/mine — user's joined missions + impact stats + badges
export const getMySignups = async (req: Request, res: Response) => {
  try {
    const signups = await VolunteerSignup.find({ userId: req.user!.id }).sort({ joinedAt: -1 });

    const missionIds = signups.map((s) => s.missionId);
    const missions = await Mission.find({ _id: { $in: missionIds } });
    const missionById = new Map(missions.map((m) => [String(m._id), m]));

    let totalEstimatedHours = 0;
    let criticalMissionsJoinedWithin1Hour = 0;

    const joined = signups
      .map((s) => {
        const mission = missionById.get(s.missionId);
        if (!mission) return null;

        const hours = mission.estimatedHours || 4;
        totalEstimatedHours += hours;

        // Check Rapid Responder badge condition (joined within 1 hour of mission creation)
        if (
          mission.urgency === 'critical' &&
          s.joinedAt.getTime() - mission.createdAt.getTime() <= 60 * 60 * 1000
        ) {
          criticalMissionsJoinedWithin1Hour += 1;
        }

        return {
          missionId: s.missionId,
          joinedAt: s.joinedAt,
          mission,
        };
      })
      .filter(Boolean);

    // Compute Badges
    const badges = [
      {
        id: 'first_mission',
        name: 'First Mission',
        description: 'Joined your first disaster response mission',
        icon: '🏅',
        unlocked: joined.length >= 1,
      },
      {
        id: '5_missions',
        name: 'Dedicated Responder',
        description: 'Joined 5 or more emergency missions',
        icon: '⭐',
        unlocked: joined.length >= 5,
      },
      {
        id: 'rapid_responder',
        name: 'Rapid Responder',
        description: 'Joined a critical urgency mission within 1 hour of posting',
        icon: '⚡',
        unlocked: criticalMissionsJoinedWithin1Hour >= 1,
      },
      {
        id: 'impact_champion',
        name: 'Impact Champion',
        description: 'Contributed 20+ estimated hours of volunteer work',
        icon: '🛡️',
        unlocked: totalEstimatedHours >= 20,
      },
    ];

    res.json({
      joined,
      stats: {
        totalMissions: joined.length,
        totalHours: totalEstimatedHours,
      },
      badges,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your joined missions' });
  }
};

// GET /api/volunteer-signups/status?missionId=...
export const getSignupStatus = async (req: Request, res: Response) => {
  try {
    const { missionId } = req.query as { missionId?: string };
    if (!missionId) return res.status(400).json({ message: 'missionId is required' });

    const existing = await VolunteerSignup.findOne({ missionId, userId: req.user!.id });
    res.json({ joined: !!existing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check signup status' });
  }
};

// POST /api/volunteer-signups — join a mission
export const createSignup = async (req: Request, res: Response) => {
  try {
    const { missionId } = req.body as { missionId?: string };
    if (!missionId) return res.status(400).json({ message: 'missionId is required' });

    const mission = await Mission.findById(missionId);
    if (!mission) return res.status(404).json({ message: 'Mission not found' });

    const existing = await VolunteerSignup.findOne({ missionId, userId: req.user!.id });
    if (existing) {
      return res.status(409).json({ message: 'You have already joined this mission' });
    }

    await VolunteerSignup.create({ missionId, userId: req.user!.id });
    mission.volunteersJoined += 1;
    await mission.save();

    // 1. Emit live Socket.IO update to mission page (progress bar tick-up)
    notifyMissionUpdated(missionId, mission.volunteersJoined);

    // 2. Fetch volunteer & poster info for real-time toast notification & email
    const { db } = mongoose.connection;
    let volunteerName = req.user!.email || 'A volunteer';
    let posterEmail = '';
    let posterName = 'Coordinator';

    if (db) {
      const volunteerUser = await db
        .collection('user')
        .findOne({ _id: new mongoose.Types.ObjectId(req.user!.id) })
        .catch(() => null);
      if (volunteerUser?.name) volunteerName = volunteerUser.name;

      if (mongoose.Types.ObjectId.isValid(mission.postedBy)) {
        const posterUser = await db
          .collection('user')
          .findOne({ _id: new mongoose.Types.ObjectId(mission.postedBy) })
          .catch(() => null);
        if (posterUser) {
          posterEmail = posterUser.email;
          posterName = posterUser.name || 'Coordinator';
        }
      }
    }

    // 3. Emit real-time toast notification to the mission poster
    if (mission.postedBy) {
      sendUserNotification(mission.postedBy, {
        title: 'New Volunteer Joined!',
        message: `${volunteerName} joined your mission "${mission.title}"`,
        type: 'volunteer_joined',
        link: `/missions/${mission._id}`,
      });
    }

    // 4. Send email notification to mission poster asynchronously
    if (posterEmail) {
      sendNewVolunteerNotification({
        posterEmail,
        posterName,
        missionTitle: mission.title,
        volunteerName,
        missionId: String(mission._id),
      }).catch((err) => console.error('Failed sending volunteer notification email:', err));
    }

    res.status(201).json({ joined: true, volunteersJoined: mission.volunteersJoined });
  } catch (err) {
    res.status(500).json({ message: 'Failed to join mission' });
  }
};