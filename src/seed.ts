import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './config/db';
import Mission from './models/Mission';
import Testimonial from './models/Testimonial';
import VolunteerSignup from './models/VolunteerSignup';
import Update from './models/Update';

const SEED_EMAILS = [
  'org.redcrescent@rescuelink.org',
  'org.fireservice@rescuelink.org',
  'org.oceancleanup@rescuelink.org',
];

async function seed() {
  await connectDB();
  console.log('🌱 Connected to MongoDB for seeding...');

  const { db } = mongoose.connection;
  if (!db) {
    throw new Error('Database connection failed');
  }

  // Look up org poster accounts by email to get their real Better Auth user IDs
  const users = await db
    .collection('user')
    .find({ email: { $in: SEED_EMAILS } })
    .toArray();

  const userByEmail = new Map(users.map((u) => [u.email as string, String(u._id)]));

  for (const email of SEED_EMAILS) {
    if (!userByEmail.has(email)) {
      console.warn(
        `⚠️ Could not find poster account ${email}. Run "npm run seed:auth" in rescuelink-client first!`,
      );
    } else {
      // Mark org posters as isVerified: true in user collection
      await db
        .collection('user')
        .updateOne({ email }, { $set: { isVerified: true } });
      console.log(`✓ Marked ${email} as verified organization`);
    }
  }

  const redCrescentId = userByEmail.get('org.redcrescent@rescuelink.org') || 'demo-redcrescent-id';
  const fireServiceId = userByEmail.get('org.fireservice@rescuelink.org') || 'demo-fireservice-id';
  const oceanCleanupId = userByEmail.get('org.oceancleanup@rescuelink.org') || 'demo-oceancleanup-id';

  // Clear existing collections
  await Promise.all([
    Mission.deleteMany({}),
    Testimonial.deleteMany({}),
    VolunteerSignup.deleteMany({}),
    Update.deleteMany({}),
  ]);
  console.log('✓ Cleared old missions, testimonials, signups, and updates');

  // Seed Missions with coordinates, estimated hours, and verified posters
  const missionsData = [
    {
      title: 'Sylhet Flash Flood Emergency Relief',
      shortDescription: 'Emergency food distribution, dry ration packs, and rescue boat deployment in Sunamganj & Sylhet.',
      fullDescription: 'Severe monsoon rains have caused unprecedented flash flooding across Northeastern Bangladesh. Over 500 families in rural Sunamganj are stranded without clean water, shelter, or food. Volunteers will assist in packing food supplies, deploying rescue boats, and operating emergency drinking water purification stations.',
      disasterType: 'flood',
      urgency: 'critical',
      status: 'active',
      location: 'Sylhet, Sunamganj',
      coordinates: { lat: 24.8949, lng: 91.8687 },
      volunteersNeeded: 45,
      volunteersJoined: 32,
      estimatedHours: 6,
      imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=1200&q=80',
      ],
      postedBy: redCrescentId,
    },
    {
      title: 'Chittagong Landslide Evacuation & Search Support',
      shortDescription: 'Supporting fire service crews with search, debris clearing, and emergency medical triage in hilly zones.',
      fullDescription: 'Torrential rains triggered hillside mudslides near Chittagong. Emergency personnel require trained volunteers for perimeter security, temporary shelter management, distribution of emergency blankets, and medical triage assistance at community centers.',
      disasterType: 'earthquake',
      urgency: 'critical',
      status: 'active',
      location: 'Chittagong, Hill Tracts',
      coordinates: { lat: 22.3569, lng: 91.7832 },
      volunteersNeeded: 30,
      volunteersJoined: 18,
      estimatedHours: 8,
      imageUrl: 'https://images.unsplash.com/photo-1590059207019-1ea19e794216?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1590059207019-1ea19e794216?auto=format&fit=crop&w=1200&q=80',
      ],
      postedBy: fireServiceId,
    },
    {
      title: 'Feni Coastal Cyclone Shelter Readiness & Supplies',
      shortDescription: 'Pre-positioning hygiene kits, high-calorie food bars, and solar lanterns ahead of Tropical Cyclone Remal.',
      fullDescription: 'With Tropical Cyclone Remal approaching coastal districts, volunteers are needed to reinforce cyclone shelters, prepare medical aid kits, set up mobile solar battery charging stations, and distribute emergency radio receivers to rural community leaders.',
      disasterType: 'cyclone',
      urgency: 'critical',
      status: 'active',
      location: 'Feni Coastal Region',
      coordinates: { lat: 23.0159, lng: 91.3976 },
      volunteersNeeded: 50,
      volunteersJoined: 42,
      estimatedHours: 5,
      imageUrl: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1200&q=80',
      ],
      postedBy: redCrescentId,
    },
    {
      title: 'Kurigram Northern Flood River Embankment Defense',
      shortDescription: 'Filling sandbags and fortifying vulnerable Jamuna river embankments to protect agricultural villages.',
      fullDescription: 'Rising Jamuna river levels threaten to breach key earth embankments protecting 12 farming villages. Volunteers will assist local villagers and engineers in filling, transporting, and stacking 5,000 sandbags along vulnerable breach points.',
      disasterType: 'flood',
      urgency: 'moderate',
      status: 'active',
      location: 'Kurigram, Rangpur',
      coordinates: { lat: 25.8054, lng: 89.6361 },
      volunteersNeeded: 60,
      volunteersJoined: 25,
      estimatedHours: 4,
      imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80',
      ],
      postedBy: oceanCleanupId,
    },
    {
      title: 'Dhaka Slum Fire Emergency Relief & Medical Drive',
      shortDescription: 'Providing medical first aid, clothing, and temporary tents following an informal settlement fire.',
      fullDescription: 'A severe fire devastated 120 informal housing structures in Korail Slum, leaving hundreds displaced. Volunteer teams are deploying immediately to provide emergency burn treatment supplies, warm clothes, infant care packages, and hygiene kits.',
      disasterType: 'fire',
      urgency: 'critical',
      status: 'active',
      location: 'Mohakhali, Dhaka',
      coordinates: { lat: 23.8103, lng: 90.4125 },
      volunteersNeeded: 25,
      volunteersJoined: 21,
      estimatedHours: 4,
      imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
      ],
      postedBy: fireServiceId,
    },
    {
      title: 'Sunamganj Water Purification & Medical Clinic',
      shortDescription: 'Operating mobile water purification units and conducting mobile healthcare drives for flood survivors.',
      fullDescription: 'Post-flood water contamination poses high risks of waterborne diseases. Volunteer healthcare professionals and general volunteers will manage water distribution kiosks, hand out oral rehydration salts (ORS), and assist medical officers.',
      disasterType: 'flood',
      urgency: 'moderate',
      status: 'resolved',
      location: 'Sunamganj District',
      coordinates: { lat: 25.0658, lng: 91.395 },
      volunteersNeeded: 35,
      volunteersJoined: 35,
      estimatedHours: 6,
      imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
      ],
      postedBy: redCrescentId,
    },
  ];

  const createdMissions = await Mission.insertMany(missionsData);
  console.log(`✓ Seeded ${createdMissions.length} active disaster response missions`);

  // Seed sample updates for the first mission
  const sylhetMissionId = String(createdMissions[0]._id);
  await Update.insertMany([
    {
      missionId: sylhetMissionId,
      userId: redCrescentId,
      authorName: 'Bangladesh Red Crescent',
      message: 'Rescue boat fleet deployed to Sunamganj Sadar. 120 dry ration packages delivered to isolated families.',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    },
    {
      missionId: sylhetMissionId,
      userId: redCrescentId,
      authorName: 'Bangladesh Red Crescent',
      message: 'Clean drinking water purification unit is now fully operational at the central shelter.',
      createdAt: new Date(Date.now() - 1 * 3600 * 1000),
    },
  ]);
  console.log('✓ Seeded updates for Sylhet Flash Flood mission');

  // Seed Testimonials
  const testimonials = [
    {
      quote: 'RescueLink transformed how our emergency teams coordinate in flood-prone districts. We were able to recruit 40 verified volunteers in under two hours.',
      authorName: 'Tanvir Hossain',
      authorRole: 'Regional Response Coordinator, Red Crescent',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    {
      quote: 'As a student volunteer, seeing live viewer counts and immediate location pins gave me total confidence in where my help was needed most.',
      authorName: 'Nusrat Jahan',
      authorRole: 'University Youth Volunteer',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
  ];
  await Testimonial.insertMany(testimonials);
  console.log('✓ Seeded testimonials');

  console.log('\n🎉 Seeding complete! Run the app to explore live missions and verified organizations.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
