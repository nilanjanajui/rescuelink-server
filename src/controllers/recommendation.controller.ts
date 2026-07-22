import { Request, Response } from 'express';
import Mission, { IMission } from '../models/Mission';
import {
    fetchAdzunaMissions,
    rankMissionsWithGroq,
    RecommendedMission,
    VolunteerProfile,
} from '../services/aiRecommendation.service';

export async function getRecommendations(req: Request, res: Response) {
    try {
        const user = req.user as any;
        const profile: VolunteerProfile = {
            userId: typeof user?.id === 'string' ? user.id : 'guest',
            name: typeof user?.name === 'string' ? user.name : 'Volunteer',
            skills: ['Medical Aid', 'Driving', 'Logistics', 'Search & Rescue'], // Default volunteer skill set
            location: 'New York',
        };

        // 1. Fetch internal active missions from MongoDB
        const internalDocs = await Mission.find({ status: 'active' }).limit(10);

        const internalMissions: RecommendedMission[] = internalDocs.map((doc: IMission) => {
            const m = doc.toObject() as IMission;
            return {
                _id: String(m._id),
                title: m.title,
                shortDescription: m.shortDescription,
                fullDescription: m.fullDescription,
                disasterType: m.disasterType,
                urgency: m.urgency,
                status: m.status,
                location: m.location,
                volunteersNeeded: m.volunteersNeeded,
                volunteersJoined: m.volunteersJoined,
                imageUrl: m.imageUrl,
                postedBy: m.postedBy,
                createdAt: m.createdAt?.toISOString(),
                aiMatchScore: 80,
                aiMatchReason: 'Matches active disaster relief criteria.',
                source: 'RescueLink',
            };
        });

        // 2. Fetch external missions from Adzuna API
        const externalMissions = await fetchAdzunaMissions(profile.location, profile.skills);

        // 3. Combine internal & external opportunities
        const combined = [...internalMissions, ...externalMissions];

        // 4. Rank combined list using Groq AI (or heuristic fallback)
        const ranked = await rankMissionsWithGroq(profile, combined);

        res.json({
            success: true,
            total: ranked.length,
            recommendations: ranked,
        });
    } catch (error: any) {
        console.error('Error in getRecommendations:', error);
        res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
    }
}
