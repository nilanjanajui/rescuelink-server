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

  // Seed 50 Missions dynamically with coordinates, estimated hours, and verified posters
  const DISASTER_IMAGES: Record<string, string[]> = {
    flood: [
      'https://upload.wikimedia.org/wikipedia/commons/4/4b/Flood_in_Bangladesh_2020.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/Flood_at_Sylhet.jpg'
    ],
    earthquake: [
      'https://upload.wikimedia.org/wikipedia/commons/b/bd/2010_Haiti_earthquake_damage.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/52/Damage_after_2015_Nepal_earthquake_in_Kathmandu.jpg'
    ],
    fire: [
      'https://upload.wikimedia.org/wikipedia/commons/e/e0/Fires_in_the_Amazon_Rainforest%2C_Brazil.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/75/Large_wildfire.jpg'
    ],
    cyclone: [
      'https://upload.wikimedia.org/wikipedia/commons/d/df/US_Navy_071123-N-1752H-062_An_aerial_view_of_the_damage_to_villages_and_infrastructure_following_Cyclone_Sidr.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/5c/Cyclone_Amphan_aftermath.jpg'
    ],
    other: [
      'https://upload.wikimedia.org/wikipedia/commons/3/30/Humanitarian_aid_in_Haiti.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/c5/Emergency_relief_supplies.jpg'
    ]
  };

  const DISASTER_TYPES = ['flood', 'earthquake', 'fire', 'cyclone', 'other'];
  const URGENCY_LEVELS = ['low', 'moderate', 'critical'];
  const LOCATIONS = ['Sylhet', 'Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Barisal', 'Rangpur', 'Mymensingh', "Cox's Bazar", 'Sunamganj', 'Feni', 'Noakhali'];
  const BD_BOUNDS = { latMin: 21.0, latMax: 26.0, lngMin: 88.0, lngMax: 92.5 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomInt = (min: number, max: number) => Math.floor(randomInRange(min, max + 1));
  const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randomDateInLast6Months = () => {
    const now = new Date();
    const past = new Date();
    past.setMonth(now.getMonth() - 6);
    return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
  };

  const orgIds = [redCrescentId, fireServiceId, oceanCleanupId];

  console.log('Generating 50 demo missions...');
  const missionsData = Array.from({ length: 50 }).map((_, i) => {
    const disaster = randomItem(DISASTER_TYPES);
    const urgency = randomItem(URGENCY_LEVELS);
    const loc = randomItem(LOCATIONS);
    const createdAt = randomDateInLast6Months();
    const status = Math.random() > 0.3 ? 'resolved' : 'active';
    const images = DISASTER_IMAGES[disaster] || DISASTER_IMAGES['other'];
    
    return {
      title: `${loc} ${disaster.charAt(0).toUpperCase() + disaster.slice(1)} Response`,
      shortDescription: `Emergency response mission for ${disaster} relief efforts in affected zones.`,
      fullDescription: `This is an auto-generated demo mission. We need volunteers for immediate assistance regarding a recent ${disaster} in ${loc}. Duties include supply distribution, local guidance, and basic support. Urgency is ${urgency}.`,
      disasterType: disaster,
      urgency: urgency,
      status: status,
      location: `${loc}, Bangladesh`,
      coordinates: { 
        lat: randomInRange(BD_BOUNDS.latMin, BD_BOUNDS.latMax), 
        lng: randomInRange(BD_BOUNDS.lngMin, BD_BOUNDS.lngMax) 
      },
      volunteersNeeded: randomInt(10, 100),
      volunteersJoined: randomInt(0, 10),
      estimatedHours: randomInt(2, 24),
      imageUrl: images[0],
      images: images,
      postedBy: randomItem(orgIds),
      createdAt: createdAt,
      updatedAt: new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime()))
    };
  });

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
      avatarUrl: 'https://i.pravatar.cc/150?img=11',
    },
    {
      quote: 'As a student volunteer, seeing live viewer counts and immediate location pins gave me total confidence in where my help was needed most.',
      authorName: 'Nusrat Jahan',
      authorRole: 'University Youth Volunteer',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
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
