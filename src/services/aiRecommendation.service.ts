import Groq from 'groq-sdk';
import axios from 'axios';
import { IMission } from '../models/Mission';

export interface VolunteerProfile {
    userId: string;
    name: string;
    skills: string[];
    location?: string;
}

export interface RecommendedMission {
    _id: string;
    title: string;
    shortDescription: string;
    fullDescription: string;
    disasterType: string;
    urgency: string;
    status: string;
    location: string;
    volunteersNeeded: number;
    volunteersJoined: number;
    imageUrl: string;
    postedBy?: string;
    createdAt?: string;
    aiMatchScore: number;
    aiMatchReason: string;
    source?: 'RescueLink' | 'Adzuna';
    redirectUrl?: string;
}

/**
 * Fetch external disaster relief / community volunteer listings from Adzuna API
 */
export async function fetchAdzunaMissions(
    location: string = '',
    skills: string[] = []
): Promise<RecommendedMission[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    const country = process.env.ADZUNA_COUNTRY || 'us';

    if (!appId || !appKey) {
        console.log('[AI Service] Adzuna API credentials missing. Skipping external search.');
        return [];
    }

    try {
        const queryTerm = skills.length > 0 ? skills.slice(0, 2).join(' ') + ' relief' : 'disaster relief';
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1`;

        const response = await axios.get(url, {
            params: {
                app_id: appId,
                app_key: appKey,
                results_per_page: 5,
                what: queryTerm,
                where: location || undefined,
            },
            timeout: 5000,
        });

        const results = response.data?.results || [];
        return results.map((job: any): RecommendedMission => ({
            _id: `adzuna-${job.id}`,
            title: job.title || 'Relief Volunteer Opportunity',
            shortDescription: (job.description || '').slice(0, 160) + '...',
            fullDescription: job.description || 'External relief opportunity fetched via Adzuna Network.',
            disasterType: 'other',
            urgency: 'moderate',
            status: 'active',
            location: job.location?.display_name || location || 'Remote / Multi-region',
            volunteersNeeded: 5,
            volunteersJoined: 0,
            imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800',
            aiMatchScore: 75,
            aiMatchReason: 'Matches volunteer skills via Adzuna Relief Network.',
            source: 'Adzuna',
            redirectUrl: job.redirect_url,
        }));
    } catch (err: any) {
        console.error('[AI Service] Error fetching Adzuna listings:', err.message || err);
        return [];
    }
}

/**
 * Score and rank missions using Groq AI (Llama 3) with heuristic fallback
 */
export async function rankMissionsWithGroq(
    profile: VolunteerProfile,
    missions: RecommendedMission[]
): Promise<RecommendedMission[]> {
    if (missions.length === 0) return [];

    const groqKey = process.env.GROQ_API_KEY;

    // Fallback heuristic scoring if Groq API Key is not set
    if (!groqKey) {
        console.log('[AI Service] GROQ_API_KEY missing. Using heuristic skill matching.');
        return missions.map((mission) => {
            let score = 70;
            const desc = (mission.title + ' ' + mission.fullDescription).toLowerCase();
            const matchingSkills = profile.skills.filter((skill) => desc.includes(skill.toLowerCase()));

            if (matchingSkills.length > 0) score += matchingSkills.length * 10;
            if (mission.urgency === 'critical') score += 10;
            score = Math.min(score, 98);

            return {
                ...mission,
                aiMatchScore: score,
                aiMatchReason: matchingSkills.length > 0
                    ? `Matches your skills in ${matchingSkills.join(', ')}.`
                    : `High urgency ${mission.disasterType} relief mission.`,
            };
        }).sort((a, b) => b.aiMatchScore - a.aiMatchScore);
    }

    try {
        const groq = new Groq({ apiKey: groqKey });
        const prompt = `
You are an expert AI coordinator for RescueLink, a disaster relief platform.
Analyze the following volunteer profile and rank the missions by compatibility.

VOLUNTEER PROFILE:
- Name: ${profile.name}
- Skills: ${profile.skills.join(', ') || 'General Support'}
- Preferred Location: ${profile.location || 'Any'}

AVAILABLE MISSIONS:
${JSON.stringify(
    missions.map((m) => ({
        id: m._id,
        title: m.title,
        disasterType: m.disasterType,
        urgency: m.urgency,
        location: m.location,
        description: m.shortDescription,
    })),
    null,
    2
)}

Output a valid JSON array of objects strictly matching this format (no extra text or markdown):
[
  {
    "id": "mission_id_str",
    "matchScore": 95,
    "matchReason": "Concise 1-sentence explanation of why this mission matches their skills/location."
  }
]
`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
        });

        const rawText = completion.choices[0]?.message?.content || '[]';
        // Clean markdown code fence if wrapped
        const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const matches: Array<{ id: string; matchScore: number; matchReason: string }> = JSON.parse(jsonText);
        const matchMap = new Map(matches.map((m) => [m.id, m]));

        return missions.map((mission) => {
            const aiData = matchMap.get(mission._id) || matchMap.get(String(mission._id));
            return {
                ...mission,
                aiMatchScore: aiData ? Math.min(Math.max(aiData.matchScore, 50), 99) : 75,
                aiMatchReason: aiData?.matchReason || `Matches volunteer profile for ${mission.disasterType} relief.`,
            };
        }).sort((a, b) => b.aiMatchScore - a.aiMatchScore);
    } catch (err: any) {
        console.error('[AI Service] Groq AI Error:', err.message || err);
        // Fallback gracefully to original array
        return missions;
    }
}
