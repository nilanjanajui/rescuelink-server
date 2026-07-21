import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './config/db';
import Mission from './models/Mission';
import VolunteerSignup from './models/VolunteerSignup';
import Update from './models/Update';

const SEED_EMAILS = [
  'org.redcrescent@rescuelink.org',
  'org.fireservice@rescuelink.org',
  'org.oceancleanup@rescuelink.org',
];

const DISASTER_TYPES = ['flood', 'earthquake', 'fire', 'cyclone', 'other'];
const URGENCY_LEVELS = ['low', 'moderate', 'critical'];

// Approximate bounding box for Bangladesh
const BD_BOUNDS = {
  latMin: 21.0,
  latMax: 26.0,
  lngMin: 88.0,
  lngMax: 92.5
};

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

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomInRange(min, max + 1));
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const LOCATIONS = ['Sylhet', 'Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Barisal', 'Rangpur', 'Mymensingh', "Cox's Bazar", 'Sunamganj', 'Feni', 'Noakhali'];

function randomDateInLast6Months(): Date {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - 6);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}


async function seedLarge() {
  await connectDB();
  console.log('🌱 Connected to MongoDB for LARGE seeding...');

  const { db } = mongoose.connection;
  if (!db) {
    throw new Error('Database connection failed');
  }

  // Look up org poster accounts
  const users = await db
    .collection('user')
    .find({ email: { $in: SEED_EMAILS } })
    .toArray();

  const userByEmail = new Map(users.map((u) => [u.email as string, String(u._id)]));
  
  const orgIds = [
    userByEmail.get('org.redcrescent@rescuelink.org'),
    userByEmail.get('org.fireservice@rescuelink.org'),
    userByEmail.get('org.oceancleanup@rescuelink.org')
  ].filter(Boolean) as string[];

  if (orgIds.length === 0) {
    console.error('⚠️ No org posters found. Please run npm run seed:auth in the client first.');
    process.exit(1);
  }

  console.log(`Found ${orgIds.length} verified organization accounts.`);

  // Cleanup old large-seed mock users and data
  await db.collection('user').deleteMany({ email: { $regex: /^mock_volunteer_/ } });
  
  // Cleanup based on orgIds to properly clear demo missions and their signups
  const demoMissions = await Mission.find({ postedBy: { $in: orgIds } }, { _id: 1 });
  const demoMissionIds = demoMissions.map(m => m._id.toString());
  await VolunteerSignup.deleteMany({ missionId: { $in: demoMissionIds } });
  await Mission.deleteMany({ postedBy: { $in: orgIds } });
  
  // Create 100 mock volunteers
  console.log('Creating 100 demo volunteer profiles...');
  const mockVolunteers = Array.from({ length: 100 }).map((_, i) => ({
    _id: new mongoose.Types.ObjectId(),
    name: `Demo Volunteer ${i + 1}`,
    email: `mock_volunteer_${i + 1}@rescuelink.org`,
    emailVerified: true,
    image: `https://i.pravatar.cc/150?u=${i}`,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  if (mockVolunteers.length > 0) {
    await db.collection('user').insertMany(mockVolunteers);
  }
  
  const volunteerIds = mockVolunteers.map(v => String(v._id));

  // Create 50 mock missions
  console.log('Creating 50 demo missions...');
  const mockMissions = Array.from({ length: 50 }).map((_, i) => {
    const disaster = randomItem(DISASTER_TYPES);
    const urgency = randomItem(URGENCY_LEVELS);
    const loc = randomItem(LOCATIONS);
    const createdAt = randomDateInLast6Months();
    const status = Math.random() > 0.3 ? 'resolved' : 'active';
    
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
      volunteersJoined: 0, // Will be updated
      estimatedHours: randomInt(2, 24),
      images: DISASTER_IMAGES[disaster] || DISASTER_IMAGES['other'],
      postedBy: randomItem(orgIds),
      createdAt: createdAt,
      updatedAt: new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime()))
    };
  });

  const insertedMissions = await Mission.insertMany(mockMissions);
  console.log(`✓ Inserted ${insertedMissions.length} missions.`);

  // Create random signups
  console.log('Assigning volunteers to missions...');
  const signups = [];
  
  for (const mission of insertedMissions) {
    // Randomly assign between 0 and volunteersNeeded volunteers to this mission
    const numSignups = randomInt(0, mission.volunteersNeeded);
    
    // Shuffle volunteers to pick random ones
    const shuffledVolunteers = [...volunteerIds].sort(() => 0.5 - Math.random());
    const selectedVolunteers = shuffledVolunteers.slice(0, Math.min(numSignups, volunteerIds.length));
    
    for (const vId of selectedVolunteers) {
      signups.push({
        missionId: mission._id,
        userId: vId,
        joinedAt: new Date(mission.createdAt.getTime() + Math.random() * (Date.now() - mission.createdAt.getTime()))
      });
    }
    
    // Update the mission's volunteersJoined count
    mission.volunteersJoined = selectedVolunteers.length;
    await mission.save();
  }

  if (signups.length > 0) {
    await VolunteerSignup.insertMany(signups);
  }
  
  console.log(`✓ Generated ${signups.length} random volunteer signups.`);

  console.log('🎉 Large seeding completed successfully!');
  process.exit(0);
}

seedLarge().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
