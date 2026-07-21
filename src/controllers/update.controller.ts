import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Update from '../models/Update';
import Mission from '../models/Mission';
import VolunteerSignup from '../models/VolunteerSignup';
import { notifyMissionUpdateAdded, sendUserNotification } from '../lib/socket';
import { sendMissionUpdateNotification } from '../services/email.service';

// GET /api/updates?missionId=... — public updates feed
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

// POST /api/updates — create mission update (poster/admin only)
export const createMissionUpdate = async (req: Request, res: Response) => {
  try {
    const { missionId, message } = req.body as { missionId?: string; message?: string };
    if (!missionId || !message || !message.trim()) {
      return res.status(400).json({ message: 'missionId and message are required' });
    }

    const mission = await Mission.findById(missionId);
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    // Check authorization: must be mission poster or admin
    if (mission.postedBy !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Only the mission poster or admin can post updates' });
    }

    const { db } = mongoose.connection;
    let authorName = req.user!.email || 'Mission Coordinator';
    if (db && mongoose.Types.ObjectId.isValid(req.user!.id)) {
      const user = await db
        .collection('user')
        .findOne({ _id: new mongoose.Types.ObjectId(req.user!.id) });
      if (user?.name) authorName = user.name;
    }

    const update = await Update.create({
      missionId,
      userId: req.user!.id,
      authorName,
      message: message.trim(),
    });

    // 1. Emit socket event to room mission:ID
    notifyMissionUpdateAdded(missionId, update);

    // 2. Fetch volunteers who joined this mission to notify them via socket & email
    const signups = await VolunteerSignup.find({ missionId });
    const volunteerUserIds = signups.map((s) => s.userId);

    // Socket toast notifications
    volunteerUserIds.forEach((volUserId) => {
      if (volUserId !== req.user!.id) {
        sendUserNotification(volUserId, {
          title: 'Mission Update Posted',
          message: `New update on "${mission.title}": ${message.trim().slice(0, 80)}...`,
          type: 'mission_update',
          link: `/missions/${mission._id}`,
        });
      }
    });

    // Email notifications (async)
    if (db && volunteerUserIds.length > 0) {
      const validVolunteerObjectIds = volunteerUserIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      db.collection('user')
        .find({ _id: { $in: validVolunteerObjectIds } })
        .project({ email: 1, name: 1 })
        .toArray()
        .then((volunteers) => {
          for (const vol of volunteers) {
            if (vol.email) {
              sendMissionUpdateNotification({
                volunteerEmail: vol.email,
                volunteerName: vol.name || 'Volunteer',
                missionTitle: mission.title,
                updateMessage: message.trim(),
                authorName,
                missionId: String(mission._id),
              }).catch((e) => console.error('Failed sending update email:', e));
            }
          }
        })
        .catch(() => {});
    }

    res.status(201).json({ update });
  } catch (err) {
    res.status(500).json({ message: 'Failed to post update' });
  }
};
