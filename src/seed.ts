/**
 * Seeds app data: missions, volunteer signups, updates, and testimonials.
 *
 * This is separate from auth seeding on purpose — Better Auth owns the
 * user/account/session collections and lives in the Next.js app, so this
 * script only *reads* user IDs (by email) from that shared collection and
 * never writes to it.
 *
 * Prerequisite: run `npm run seed:auth` in rescuelink-client first, so the
 * five accounts below already exist in the shared MongoDB database.
 *
 * Run with: npm run seed
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Mission from './models/Mission';
import VolunteerSignup from './models/VolunteerSignup';
import Update from './models/Update';
import Testimonial from './models/Testimonial';
import Subscriber from './models/Subscriber';

const SEED_EMAILS = {
  demoUser: 'demo.user@rescuelink.org',
  demoAdmin: 'demo.admin@rescuelink.org',
  redCrescent: 'org.redcrescent@rescuelink.org',
  fireService: 'org.fireservice@rescuelink.org',
  oceanCleanup: 'org.oceancleanup@rescuelink.org',
} as const;

type SeedUserKey = keyof typeof SEED_EMAILS;

const img = (seed: string, w = 900, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function getSeedUserIds(): Promise<Record<SeedUserKey, string>> {
  // Better Auth owns the `user` collection; we read it directly rather than
  // through a Mongoose model since Express doesn't (and shouldn't) own it.
  const { db } = mongoose.connection;
  if (!db) throw new Error('No active Mongo connection');

  const users = await db
    .collection('user')
    .find({ email: { $in: Object.values(SEED_EMAILS) } })
    .toArray();

  const byEmail = new Map(users.map((u) => [u.email as string, String(u._id)]));

  const result = {} as Record<SeedUserKey, string>;
  for (const [key, email] of Object.entries(SEED_EMAILS) as [
    SeedUserKey,
    string,
  ][]) {
    const id = byEmail.get(email);
    if (!id) {
      throw new Error(
        `Could not find a user for ${email}. Run "npm run seed:auth" in rescuelink-client first.`,
      );
    }
    result[key] = id;
  }
  return result;
}

type MissionSeed = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  disasterType: 'flood' | 'earthquake' | 'fire' | 'cyclone' | 'other';
  urgency: 'critical' | 'moderate' | 'low';
  status: 'active' | 'resolved';
  location: string;
  volunteersNeeded: number;
  imageSeed: string;
  postedBy: SeedUserKey;
};

const MISSION_SEEDS: MissionSeed[] = [
  {
    title: 'Sylhet Flash Flood Response',
    shortDescription:
      'Emergency boat rescues and clean water distribution across flooded wards.',
    fullDescription:
      'Sudden upstream rainfall has left large parts of Sylhet submerged, cutting off several neighborhoods. Teams need volunteers for boat-based rescues, distributing purified water, and setting up temporary shelter points for displaced families.',
    disasterType: 'flood',
    urgency: 'critical',
    status: 'active',
    location: 'Sylhet, Bangladesh',
    volunteersNeeded: 60,
    imageSeed: 'sylhet-flood',
    postedBy: 'redCrescent',
  },
  {
    title: 'Dhaka Ward 12 Waterlogging Relief',
    shortDescription:
      'Pumping stagnant water and distributing hygiene kits in low-lying wards.',
    fullDescription:
      'Heavy monsoon rain has waterlogged several low-lying blocks in Ward 12. Volunteers are needed to help operate portable pumps, distribute hygiene kits, and support families with mobility issues in relocating temporarily.',
    disasterType: 'flood',
    urgency: 'moderate',
    status: 'active',
    location: 'Dhaka, Bangladesh',
    volunteersNeeded: 30,
    imageSeed: 'dhaka-waterlog',
    postedBy: 'redCrescent',
  },
  {
    title: 'Kurigram Riverbank Erosion & Flood Aid',
    shortDescription:
      'Relocating riverside families and distributing emergency food supplies.',
    fullDescription:
      'Continued erosion along the Brahmaputra has claimed several homes in Kurigram. This mission coordinates safe relocation of affected families and distribution of dry food rations and tarpaulin shelter kits.',
    disasterType: 'flood',
    urgency: 'critical',
    status: 'active',
    location: 'Kurigram, Bangladesh',
    volunteersNeeded: 45,
    imageSeed: 'kurigram-erosion',
    postedBy: 'redCrescent',
  },
  {
    title: 'Chittagong Hill Tracts Landslide Recovery',
    shortDescription:
      'Debris clearing and road access restoration after seasonal landslides.',
    fullDescription:
      'Monsoon-triggered landslides blocked several access roads in the Hill Tracts. This mission focused on clearing debris, restoring safe road access, and assessing structural damage to nearby homes. Recovery phase complete.',
    disasterType: 'other',
    urgency: 'moderate',
    status: 'resolved',
    location: 'Chittagong, Bangladesh',
    volunteersNeeded: 25,
    imageSeed: 'ctg-landslide',
    postedBy: 'fireService',
  },
  {
    title: "Cox's Bazar Cyclone Shelter Support",
    shortDescription:
      'Staffing emergency shelters ahead of an approaching coastal cyclone.',
    fullDescription:
      "A tropical cyclone is tracking toward the coast near Cox's Bazar. Volunteers are urgently needed to help staff shelter points, distribute emergency supplies, and assist with evacuation logistics for coastal communities.",
    disasterType: 'cyclone',
    urgency: 'critical',
    status: 'active',
    location: "Cox's Bazar, Bangladesh",
    volunteersNeeded: 80,
    imageSeed: 'coxsbazar-cyclone',
    postedBy: 'redCrescent',
  },
  {
    title: 'Bhola Cyclone Rebuild Initiative',
    shortDescription:
      'Rebuilding damaged homes and restoring embankments post-cyclone.',
    fullDescription:
      "Following last season's cyclone, this mission coordinated the rebuilding of over 40 homes and reinforced coastal embankments in Bhola. Rebuild phase is now complete.",
    disasterType: 'cyclone',
    urgency: 'moderate',
    status: 'resolved',
    location: 'Bhola, Bangladesh',
    volunteersNeeded: 35,
    imageSeed: 'bhola-rebuild',
    postedBy: 'redCrescent',
  },
  {
    title: 'Barguna Coastal Cyclone Preparedness',
    shortDescription:
      'Pre-season shelter drills and supply pre-positioning for coastal villages.',
    fullDescription:
      'Ahead of cyclone season, this mission runs evacuation drills and pre-positions emergency supplies in vulnerable coastal villages around Barguna, reducing response time when storms do arrive.',
    disasterType: 'cyclone',
    urgency: 'low',
    status: 'active',
    location: 'Barguna, Bangladesh',
    volunteersNeeded: 20,
    imageSeed: 'barguna-prep',
    postedBy: 'redCrescent',
  },
  {
    title: 'Rangpur Earthquake Structural Assessment',
    shortDescription:
      'Volunteer engineers assessing building safety after a moderate tremor.',
    fullDescription:
      'A moderate earthquake left cracks in several older buildings in Rangpur. This mission coordinates volunteer engineers and surveyors conducting rapid structural safety assessments for residents.',
    disasterType: 'earthquake',
    urgency: 'moderate',
    status: 'active',
    location: 'Rangpur, Bangladesh',
    volunteersNeeded: 15,
    imageSeed: 'rangpur-quake',
    postedBy: 'fireService',
  },
  {
    title: 'Mymensingh Minor Earthquake Relief',
    shortDescription:
      'Distributed emergency kits after a minor tremor caused localized damage.',
    fullDescription:
      'A minor earthquake caused localized damage in Mymensingh. Volunteers distributed emergency kits and helped affected families with temporary repairs. Mission complete.',
    disasterType: 'earthquake',
    urgency: 'low',
    status: 'resolved',
    location: 'Mymensingh, Bangladesh',
    volunteersNeeded: 12,
    imageSeed: 'mymensingh-quake',
    postedBy: 'fireService',
  },
  {
    title: 'Dhaka Garment Factory Fire Response',
    shortDescription:
      'Emergency medical support and family assistance after a factory fire.',
    fullDescription:
      "A fire broke out at a garment factory on the outskirts of Dhaka. Volunteers are needed for emergency medical support, coordinating with fire services, and assisting affected workers' families.",
    disasterType: 'fire',
    urgency: 'critical',
    status: 'active',
    location: 'Dhaka, Bangladesh',
    volunteersNeeded: 40,
    imageSeed: 'dhaka-fire',
    postedBy: 'fireService',
  },
  {
    title: 'Chattogram Ship-Breaking Yard Fire Relief',
    shortDescription:
      'Supported worker evacuation and medical triage after a yard fire.',
    fullDescription:
      'A fire at a ship-breaking yard required rapid evacuation and medical triage for workers. Volunteers assisted fire crews and provided first aid on-site. Mission resolved.',
    disasterType: 'fire',
    urgency: 'moderate',
    status: 'resolved',
    location: 'Chattogram, Bangladesh',
    volunteersNeeded: 20,
    imageSeed: 'ctg-shipyard-fire',
    postedBy: 'fireService',
  },
  {
    title: 'Sundarbans Wildfire Containment',
    shortDescription:
      'Containing a dry-season brushfire near the mangrove forest edge.',
    fullDescription:
      'Unusually dry conditions sparked a brushfire near the edge of the Sundarbans mangrove forest. Volunteers are assisting fire crews with containment lines and monitoring wildlife impact.',
    disasterType: 'fire',
    urgency: 'moderate',
    status: 'active',
    location: 'Khulna, Bangladesh',
    volunteersNeeded: 25,
    imageSeed: 'sundarbans-fire',
    postedBy: 'oceanCleanup',
  },
  {
    title: 'Rohingya Refugee Camp Health Support',
    shortDescription:
      'Volunteer medical staff and supply runs for camp health posts.',
    fullDescription:
      "Camp health posts near Cox's Bazar are stretched thin. This mission coordinates volunteer medical staff, medicine supply runs, and basic health screenings for camp residents.",
    disasterType: 'other',
    urgency: 'critical',
    status: 'active',
    location: "Cox's Bazar, Bangladesh",
    volunteersNeeded: 50,
    imageSeed: 'refugee-health',
    postedBy: 'redCrescent',
  },
  {
    title: 'Central Anatolia Earthquake Relief',
    shortDescription:
      'International relief coordination after a major regional earthquake.',
    fullDescription:
      'A major earthquake struck central Anatolia, displacing thousands. This mission coordinates international volunteer logistics teams supporting search-and-rescue and emergency shelter setup.',
    disasterType: 'earthquake',
    urgency: 'critical',
    status: 'active',
    location: 'Kahramanmaraş, Turkey',
    volunteersNeeded: 100,
    imageSeed: 'anatolia-quake',
    postedBy: 'demoAdmin',
  },
  {
    title: 'Eastern Seaboard Flood Response',
    shortDescription:
      'Logistics and water purification support for displaced coastal families.',
    fullDescription:
      'Storm surge flooding displaced thousands of families along the eastern seaboard. Volunteers are needed for logistics coordination and operating portable water purification units.',
    disasterType: 'flood',
    urgency: 'critical',
    status: 'active',
    location: 'Coastal Louisiana, USA',
    volunteersNeeded: 70,
    imageSeed: 'seaboard-flood',
    postedBy: 'demoAdmin',
  },
  {
    title: 'Canyon Wildfire Containment',
    shortDescription:
      'Temporary shelter and animal rescue services for a fast-moving wildfire.',
    fullDescription:
      'A fast-moving canyon wildfire has forced evacuations. This mission coordinates temporary shelter for displaced residents and rescue/care for stranded pets and livestock.',
    disasterType: 'fire',
    urgency: 'moderate',
    status: 'active',
    location: 'California, USA',
    volunteersNeeded: 55,
    imageSeed: 'canyon-wildfire',
    postedBy: 'demoAdmin',
  },
  {
    title: 'Island Hurricane Recovery',
    shortDescription:
      'Debris clearing and supply distribution after a Category 3 hurricane.',
    fullDescription:
      'A Category 3 hurricane caused significant damage across the island chain. Volunteers cleared debris and distributed emergency supplies to isolated communities. Recovery phase complete.',
    disasterType: 'cyclone',
    urgency: 'low',
    status: 'resolved',
    location: 'Nassau, Bahamas',
    volunteersNeeded: 40,
    imageSeed: 'island-hurricane',
    postedBy: 'oceanCleanup',
  },
  {
    title: 'Jamalpur Winter Cold Wave Relief',
    shortDescription:
      'Blanket and warm clothing distribution during an unusually severe cold wave.',
    fullDescription:
      'An unusually severe cold wave put vulnerable riverside communities in Jamalpur at risk. Volunteers distributed blankets and warm clothing to over 500 families. Mission complete.',
    disasterType: 'other',
    urgency: 'low',
    status: 'resolved',
    location: 'Jamalpur, Bangladesh',
    volunteersNeeded: 18,
    imageSeed: 'jamalpur-coldwave',
    postedBy: 'redCrescent',
  },
];

const TESTIMONIAL_SEEDS = [
  {
    quote:
      'The real-time coordination during the Sylhet floods let us mobilize volunteers twice as fast as we could before.',
    authorName: 'Nasrin Akter',
    authorRole: 'Volunteer Coordinator, Bangladesh Red Crescent',
    avatarUrl: img('nasrin-akter', 200, 200),
  },
  {
    quote:
      "RescueLink's live mission board meant our crews always knew exactly where help was needed most.",
    authorName: 'Kamal Hossain',
    authorRole: 'Field Officer, Bangladesh Fire Service',
    avatarUrl: img('kamal-hossain', 200, 200),
  },
  {
    quote:
      'We tracked cleanup progress across three coastal sites in real time — something spreadsheets never let us do.',
    authorName: 'Farhana Rahman',
    authorRole: 'Program Lead, Ocean Cleanup BD',
    avatarUrl: img('farhana-rahman', 200, 200),
  },
  {
    quote:
      'As a first-time volunteer, sign-up took under two minutes and I was matched to a mission the same day.',
    authorName: 'Tanvir Ahmed',
    authorRole: 'Volunteer',
    avatarUrl: img('tanvir-ahmed', 200, 200),
  },
];

function randomDateWithinLastMonths(months: number): Date {
  const now = Date.now();
  const past = now - months * 30 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const userIds = await getSeedUserIds();
  const allUserIds = Object.values(userIds);

  // Wipe app-data collections only — never touches Better Auth's collections.
  await Promise.all([
    Mission.deleteMany({}),
    VolunteerSignup.deleteMany({}),
    Update.deleteMany({}),
    Testimonial.deleteMany({}),
    Subscriber.deleteMany({}),
  ]);
  console.log('Cleared existing app data');

  const missions = await Mission.insertMany(
    MISSION_SEEDS.map((m) => ({
      title: m.title,
      shortDescription: m.shortDescription,
      fullDescription: m.fullDescription,
      disasterType: m.disasterType,
      urgency: m.urgency,
      status: m.status,
      location: m.location,
      volunteersNeeded: m.volunteersNeeded,
      volunteersJoined: 0, // filled in below once signups are generated
      imageUrl: img(m.imageSeed),
      images: [
        img(m.imageSeed),
        img(`${m.imageSeed}-2`),
        img(`${m.imageSeed}-3`),
      ],
      postedBy: userIds[m.postedBy],
    })),
  );
  console.log(`Seeded ${missions.length} missions`);

  // Volunteer signups: each mission gets 2-4 random volunteers from the
  // seeded user pool, joined at random points over the last 6 months.
  const signupDocs: { missionId: string; userId: string; joinedAt: Date }[] =
    [];
  const joinedCountByMission = new Map<string, number>();

  for (const mission of missions) {
    const volunteerCount = 2 + Math.floor(Math.random() * 3); // 2-4
    const shuffled = [...allUserIds].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, volunteerCount);

    for (const userId of chosen) {
      signupDocs.push({
        missionId: String(mission._id),
        userId,
        joinedAt: randomDateWithinLastMonths(6),
      });
    }
    joinedCountByMission.set(String(mission._id), chosen.length);
  }

  await VolunteerSignup.insertMany(signupDocs);
  console.log(`Seeded ${signupDocs.length} volunteer signups`);

  // Keep volunteersJoined on each mission consistent with the signups above.
  await Promise.all(
    missions.map((mission) =>
      Mission.updateOne(
        { _id: mission._id },
        {
          $set: {
            volunteersJoined:
              joinedCountByMission.get(String(mission._id)) ?? 0,
          },
        },
      ),
    ),
  );

  // A couple of progress updates for a handful of active, higher-profile missions.
  const posterNames: Record<string, string> = {
    [userIds.redCrescent]: 'Bangladesh Red Crescent',
    [userIds.fireService]: 'Bangladesh Fire Service',
    [userIds.oceanCleanup]: 'Ocean Cleanup BD',
    [userIds.demoAdmin]: 'Demo Admin',
  };

  const updateTargets = missions
    .filter((m) => m.status === 'active')
    .slice(0, 6);
  const updateDocs = updateTargets.flatMap((mission) => [
    {
      missionId: String(mission._id),
      userId: mission.postedBy,
      authorName: posterNames[mission.postedBy] ?? 'Mission Coordinator',
      message: 'Initial response team deployed and assessment underway.',
    },
    {
      missionId: String(mission._id),
      userId: mission.postedBy,
      authorName: posterNames[mission.postedBy] ?? 'Mission Coordinator',
      message: `Volunteer count now at ${mission.volunteersJoined}/${mission.volunteersNeeded}. More hands still needed.`,
    },
  ]);
  await Update.insertMany(updateDocs);
  console.log(`Seeded ${updateDocs.length} mission updates`);
  console.log('App data seeding complete.');
}

seed()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
