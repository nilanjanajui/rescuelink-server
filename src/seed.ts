/**
 * Seeds app data: missions, volunteer signups, updates, and testimonials.
 *
 * This is separate from auth seeding on purpose — Better Auth owns the
 * user/account/session collections and lives in the Next.js app, so this
 * script only *reads* user IDs (by email) from that shared collection and
 * never writes to it.
 *
 * Prerequisite: run `npm run seed:auth` in rescuelink-client first, so the
 * org/demo accounts AND the 100 volunteer.001..volunteer.100 accounts
 * already exist in the shared MongoDB database.
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

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const ORG_EMAILS = {
  demoAdmin: 'demo.admin@rescuelink.org',
  redCrescent: 'org.redcrescent@rescuelink.org',
  fireService: 'org.fireservice@rescuelink.org',
  oceanCleanup: 'org.oceancleanup@rescuelink.org',
} as const;

type OrgKey = keyof typeof ORG_EMAILS;

const DEMO_USER_EMAIL = 'demo.user@rescuelink.org';

const VOLUNTEER_COUNT = 100;
const volunteerEmail = (n: number) => `volunteer.${String(n).padStart(3, '0')}@rescuelink.org`;
const VOLUNTEER_EMAILS = Array.from({ length: VOLUNTEER_COUNT }, (_, i) => volunteerEmail(i + 1));

async function getSeedUsers(): Promise<{
  orgIds: Record<OrgKey, string>;
  demoUserId: string;
  volunteerIds: string[];
}> {
  // Better Auth owns the `user` collection; we read it directly rather than
  // through a Mongoose model since Express doesn't (and shouldn't) own it.
  const db = mongoose.connection.db;
  if (!db) throw new Error('No active Mongo connection');

  const allEmails = [...Object.values(ORG_EMAILS), DEMO_USER_EMAIL, ...VOLUNTEER_EMAILS];

  const users = await db
    .collection('user')
    .find({ email: { $in: allEmails } })
    .toArray();

  const byEmail = new Map(users.map((u) => [u.email as string, String(u._id)]));

  const orgIds = {} as Record<OrgKey, string>;
  for (const [key, email] of Object.entries(ORG_EMAILS) as [OrgKey, string][]) {
    const id = byEmail.get(email);
    if (!id) {
      throw new Error(`Could not find a user for ${email}. Run "npm run seed:auth" first.`);
    }
    orgIds[key] = id;
  }

  const demoUserId = byEmail.get(DEMO_USER_EMAIL);
  if (!demoUserId) {
    throw new Error(`Could not find a user for ${DEMO_USER_EMAIL}. Run "npm run seed:auth" first.`);
  }

  const volunteerIds = VOLUNTEER_EMAILS.map((email) => byEmail.get(email)).filter(
    (id): id is string => Boolean(id)
  );

  if (volunteerIds.length < VOLUNTEER_COUNT) {
    throw new Error(
      `Expected ${VOLUNTEER_COUNT} volunteer accounts but found ${volunteerIds.length}. ` +
      `Add the volunteer.001..volunteer.${VOLUNTEER_COUNT} accounts to your seed:auth script first.`
    );
  }

  return { orgIds, demoUserId, volunteerIds };
}

// ---------------------------------------------------------------------------
// Images — real Unsplash photos grouped by disaster theme (free Unsplash
// License, verified live at seed-authoring time). Reused per theme rather
// than faking uniqueness with random picsum seeds.
// ---------------------------------------------------------------------------

const PHOTO = {
  flood: '1741081288260-877057e3fa27',
  cyclone: '1773592612651-9669e67366c3',
  earthquake: '1564662655264-f818dde0c6cf',
  fire: '1632844275482-418744f357d8',
  wildfire: '1663703096369-f0acd9c2c2b3',
  aid: '1593113646773-028c64a8f1b8',
} as const;

type PhotoCategory = keyof typeof PHOTO;

const unsplash = (id: string, w = 900, h = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

const missionImages = (category: PhotoCategory) => [
  unsplash(PHOTO[category]),
  unsplash(PHOTO[category], 1200, 800),
  unsplash(PHOTO.aid, 900, 600),
];

const avatar = (id: string) => unsplash(id, 200, 200);

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

type DisasterType = 'flood' | 'earthquake' | 'fire' | 'cyclone' | 'other';
type Urgency = 'critical' | 'moderate' | 'low';
type Status = 'active' | 'resolved';

type MissionSeed = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  disasterType: DisasterType;
  urgency: Urgency;
  status: Status;
  location: string;
  volunteersNeeded: number;
  photoCategory: PhotoCategory;
  postedBy: OrgKey;
};

// 18 hand-authored flagship missions — kept as-is for narrative quality.
const CURATED_MISSIONS: MissionSeed[] = [
  {
    title: 'Sylhet Flash Flood Response',
    shortDescription: 'Emergency boat rescues and clean water distribution across flooded wards.',
    fullDescription:
      'Sudden upstream rainfall has left large parts of Sylhet submerged, cutting off several neighborhoods. Teams need volunteers for boat-based rescues, distributing purified water, and setting up temporary shelter points for displaced families.',
    disasterType: 'flood',
    urgency: 'critical',
    status: 'active',
    location: 'Sylhet, Bangladesh',
    volunteersNeeded: 60,
    photoCategory: 'flood',
    postedBy: 'redCrescent',
  },
  {
    title: 'Dhaka Ward 12 Waterlogging Relief',
    shortDescription: 'Pumping stagnant water and distributing hygiene kits in low-lying wards.',
    fullDescription:
      'Heavy monsoon rain has waterlogged several low-lying blocks in Ward 12. Volunteers are needed to help operate portable pumps, distribute hygiene kits, and support families with mobility issues in relocating temporarily.',
    disasterType: 'flood',
    urgency: 'moderate',
    status: 'active',
    location: 'Dhaka, Bangladesh',
    volunteersNeeded: 30,
    photoCategory: 'flood',
    postedBy: 'redCrescent',
  },
  {
    title: 'Kurigram Riverbank Erosion & Flood Aid',
    shortDescription: 'Relocating riverside families and distributing emergency food supplies.',
    fullDescription:
      'Continued erosion along the Brahmaputra has claimed several homes in Kurigram. This mission coordinates safe relocation of affected families and distribution of dry food rations and tarpaulin shelter kits.',
    disasterType: 'flood',
    urgency: 'critical',
    status: 'active',
    location: 'Kurigram, Bangladesh',
    volunteersNeeded: 45,
    photoCategory: 'flood',
    postedBy: 'redCrescent',
  },
  {
    title: 'Chittagong Hill Tracts Landslide Recovery',
    shortDescription: 'Debris clearing and road access restoration after seasonal landslides.',
    fullDescription:
      'Monsoon-triggered landslides blocked several access roads in the Hill Tracts. This mission focused on clearing debris, restoring safe road access, and assessing structural damage to nearby homes. Recovery phase complete.',
    disasterType: 'other',
    urgency: 'moderate',
    status: 'resolved',
    location: 'Chittagong, Bangladesh',
    volunteersNeeded: 25,
    photoCategory: 'earthquake',
    postedBy: 'fireService',
  },
  {
    title: "Cox's Bazar Cyclone Shelter Support",
    shortDescription: 'Staffing emergency shelters ahead of an approaching coastal cyclone.',
    fullDescription:
      "A tropical cyclone is tracking toward the coast near Cox's Bazar. Volunteers are urgently needed to help staff shelter points, distribute emergency supplies, and assist with evacuation logistics for coastal communities.",
    disasterType: 'cyclone',
    urgency: 'critical',
    status: 'active',
    location: "Cox's Bazar, Bangladesh",
    volunteersNeeded: 80,
    photoCategory: 'cyclone',
    postedBy: 'redCrescent',
  },
  {
    title: 'Bhola Cyclone Rebuild Initiative',
    shortDescription: 'Rebuilding damaged homes and restoring embankments post-cyclone.',
    fullDescription:
      "Following last season's cyclone, this mission coordinated the rebuilding of over 40 homes and reinforced coastal embankments in Bhola. Rebuild phase is now complete.",
    disasterType: 'cyclone',
    urgency: 'moderate',
    status: 'resolved',
    location: 'Bhola, Bangladesh',
    volunteersNeeded: 35,
    photoCategory: 'cyclone',
    postedBy: 'redCrescent',
  },
  {
    title: 'Barguna Coastal Cyclone Preparedness',
    shortDescription: 'Pre-season shelter drills and supply pre-positioning for coastal villages.',
    fullDescription:
      'Ahead of cyclone season, this mission runs evacuation drills and pre-positions emergency supplies in vulnerable coastal villages around Barguna, reducing response time when storms do arrive.',
    disasterType: 'cyclone',
    urgency: 'low',
    status: 'active',
    location: 'Barguna, Bangladesh',
    volunteersNeeded: 20,
    photoCategory: 'cyclone',
    postedBy: 'redCrescent',
  },
  {
    title: 'Rangpur Earthquake Structural Assessment',
    shortDescription: 'Volunteer engineers assessing building safety after a moderate tremor.',
    fullDescription:
      'A moderate earthquake left cracks in several older buildings in Rangpur. This mission coordinates volunteer engineers and surveyors conducting rapid structural safety assessments for residents.',
    disasterType: 'earthquake',
    urgency: 'moderate',
    status: 'active',
    location: 'Rangpur, Bangladesh',
    volunteersNeeded: 15,
    photoCategory: 'earthquake',
    postedBy: 'fireService',
  },
  {
    title: 'Mymensingh Minor Earthquake Relief',
    shortDescription: 'Distributed emergency kits after a minor tremor caused localized damage.',
    fullDescription:
      'A minor earthquake caused localized damage in Mymensingh. Volunteers distributed emergency kits and helped affected families with temporary repairs. Mission complete.',
    disasterType: 'earthquake',
    urgency: 'low',
    status: 'resolved',
    location: 'Mymensingh, Bangladesh',
    volunteersNeeded: 12,
    photoCategory: 'earthquake',
    postedBy: 'fireService',
  },
  {
    title: 'Dhaka Garment Factory Fire Response',
    shortDescription: 'Emergency medical support and family assistance after a factory fire.',
    fullDescription:
      "A fire broke out at a garment factory on the outskirts of Dhaka. Volunteers are needed for emergency medical support, coordinating with fire services, and assisting affected workers' families.",
    disasterType: 'fire',
    urgency: 'critical',
    status: 'active',
    location: 'Dhaka, Bangladesh',
    volunteersNeeded: 40,
    photoCategory: 'fire',
    postedBy: 'fireService',
  },
  {
    title: 'Chattogram Ship-Breaking Yard Fire Relief',
    shortDescription: 'Supported worker evacuation and medical triage after a yard fire.',
    fullDescription:
      'A fire at a ship-breaking yard required rapid evacuation and medical triage for workers. Volunteers assisted fire crews and provided first aid on-site. Mission resolved.',
    disasterType: 'fire',
    urgency: 'moderate',
    status: 'resolved',
    location: 'Chattogram, Bangladesh',
    volunteersNeeded: 20,
    photoCategory: 'fire',
    postedBy: 'fireService',
  },
  {
    title: 'Sundarbans Wildfire Containment',
    shortDescription: 'Containing a dry-season brushfire near the mangrove forest edge.',
    fullDescription:
      'Unusually dry conditions sparked a brushfire near the edge of the Sundarbans mangrove forest. Volunteers are assisting fire crews with containment lines and monitoring wildlife impact.',
    disasterType: 'fire',
    urgency: 'moderate',
    status: 'active',
    location: 'Khulna, Bangladesh',
    volunteersNeeded: 25,
    photoCategory: 'wildfire',
    postedBy: 'oceanCleanup',
  },
  {
    title: 'Rohingya Refugee Camp Health Support',
    shortDescription: 'Volunteer medical staff and supply runs for camp health posts.',
    fullDescription:
      "Camp health posts near Cox's Bazar are stretched thin. This mission coordinates volunteer medical staff, medicine supply runs, and basic health screenings for camp residents.",
    disasterType: 'other',
    urgency: 'critical',
    status: 'active',
    location: "Cox's Bazar, Bangladesh",
    volunteersNeeded: 50,
    photoCategory: 'aid',
    postedBy: 'redCrescent',
  },
  {
    title: 'Central Anatolia Earthquake Relief',
    shortDescription: 'International relief coordination after a major regional earthquake.',
    fullDescription:
      'A major earthquake struck central Anatolia, displacing thousands. This mission coordinates international volunteer logistics teams supporting search-and-rescue and emergency shelter setup.',
    disasterType: 'earthquake',
    urgency: 'critical',
    status: 'active',
    location: 'Kahramanmaraş, Turkey',
    volunteersNeeded: 100,
    photoCategory: 'earthquake',
    postedBy: 'demoAdmin',
  },
  {
    title: 'Eastern Seaboard Flood Response',
    shortDescription: 'Logistics and water purification support for displaced coastal families.',
    fullDescription:
      'Storm surge flooding displaced thousands of families along the eastern seaboard. Volunteers are needed for logistics coordination and operating portable water purification units.',
    disasterType: 'flood',
    urgency: 'critical',
    status: 'active',
    location: 'Coastal Louisiana, USA',
    volunteersNeeded: 70,
    photoCategory: 'flood',
    postedBy: 'demoAdmin',
  },
  {
    title: 'Canyon Wildfire Containment',
    shortDescription: 'Temporary shelter and animal rescue services for a fast-moving wildfire.',
    fullDescription:
      'A fast-moving canyon wildfire has forced evacuations. This mission coordinates temporary shelter for displaced residents and rescue/care for stranded pets and livestock.',
    disasterType: 'fire',
    urgency: 'moderate',
    status: 'active',
    location: 'California, USA',
    volunteersNeeded: 55,
    photoCategory: 'wildfire',
    postedBy: 'demoAdmin',
  },
  {
    title: 'Island Hurricane Recovery',
    shortDescription: 'Debris clearing and supply distribution after a Category 3 hurricane.',
    fullDescription:
      'A Category 3 hurricane caused significant damage across the island chain. Volunteers cleared debris and distributed emergency supplies to isolated communities. Recovery phase complete.',
    disasterType: 'cyclone',
    urgency: 'low',
    status: 'resolved',
    location: 'Nassau, Bahamas',
    volunteersNeeded: 40,
    photoCategory: 'cyclone',
    postedBy: 'oceanCleanup',
  },
  {
    title: 'Jamalpur Winter Cold Wave Relief',
    shortDescription: 'Blanket and warm clothing distribution during an unusually severe cold wave.',
    fullDescription:
      'An unusually severe cold wave put vulnerable riverside communities in Jamalpur at risk. Volunteers distributed blankets and warm clothing to over 500 families. Mission complete.',
    disasterType: 'other',
    urgency: 'low',
    status: 'resolved',
    location: 'Jamalpur, Bangladesh',
    volunteersNeeded: 18,
    photoCategory: 'aid',
    postedBy: 'redCrescent',
  },
  {
    title: 'Cumilla Dengue Outbreak Response',
    shortDescription: 'Volunteer health screening and mosquito-control support during a dengue surge.',
    fullDescription:
      'A sharp rise in dengue cases has overwhelmed the local health post in Cumilla during peak monsoon season. This mission coordinates volunteer health screening teams, door-to-door mosquito-breeding-site inspections, and supply runs for oral rehydration salts and basic medication to relieve pressure on overstretched clinics.',
    disasterType: 'other',
    urgency: 'critical',
    status: 'active',
    location: 'Cumilla, Bangladesh',
    volunteersNeeded: 35,
    photoCategory: 'aid',
    postedBy: 'redCrescent',
  },

];

// ---------------------------------------------------------------------------
// Generated missions — fill out to 50 total (32 more) via templates.
// Trade-off: these read more formulaically than the curated set above.
// Fine for load-testing/demo volume; if you need 32 more hand-written
// narratives instead, replace this block with literal MissionSeed objects.
// ---------------------------------------------------------------------------

type ScenarioTemplate = {
  disasterType: DisasterType;
  photoCategory: PhotoCategory;
  postedBy: OrgKey;
  shortDescription: (loc: string) => string;
  fullDescription: (loc: string, detail: string) => string;
  locations: { name: string; detail: string }[];
};

const GENERATED_TEMPLATES: ScenarioTemplate[] = [
  {
    disasterType: 'flood',
    photoCategory: 'flood',
    postedBy: 'redCrescent',
    shortDescription: (loc) => `Boat rescues and water purification support for flood-hit ${loc}.`,
    fullDescription: (loc, detail) =>
      `Sustained heavy rainfall has flooded low-lying areas of ${loc}. ${detail} Volunteers are needed for boat-based rescues, distributing purified drinking water, and helping displaced families reach temporary shelter.`,
    locations: [
      { name: 'Faridpur, Bangladesh', detail: 'Several riverside villages are cut off from the main road.' },
      { name: 'Bogura, Bangladesh', detail: 'Crop fields and several homesteads are underwater.' },
      { name: 'Sirajganj, Bangladesh', detail: 'Embankment breaches have flooded three unions overnight.' },
      { name: 'Assam, India', detail: 'The Brahmaputra has overtopped its banks near several tea estates.' },
      { name: 'Jakarta, Indonesia', detail: 'Monsoon drains are overwhelmed across several city districts.' },
      { name: 'Manila, Philippines', detail: 'Typhoon runoff has flooded low-lying residential blocks.' },
      { name: 'Mekong Delta, Vietnam', detail: 'Seasonal flooding has submerged rice paddies and access roads.' },
    ],
  },
  {
    disasterType: 'cyclone',
    photoCategory: 'cyclone',
    postedBy: 'redCrescent',
    shortDescription: (loc) => `Shelter staffing and evacuation support ahead of a cyclone nearing ${loc}.`,
    fullDescription: (loc, detail) =>
      `A tropical cyclone is tracking toward ${loc}. ${detail} Volunteers are needed to help staff shelters, distribute emergency supplies, and support evacuation logistics for at-risk households.`,
    locations: [
      { name: 'Patuakhali, Bangladesh', detail: 'Coastal embankments here have failed in past storms.' },
      { name: 'Noakhali, Bangladesh', detail: 'Several char islands have no direct evacuation route.' },
      { name: 'Odisha, India', detail: 'Fishing communities along the coast are on alert.' },
      { name: 'Key West, Florida, USA', detail: 'Mandatory evacuation zones have been declared.' },
      { name: 'Guangdong, China', detail: 'Port operations have suspended ahead of landfall.' },
      { name: 'Chattogram coastal belt, Bangladesh', detail: 'Storm surge is expected to affect low-lying wards.' },
    ],
  },
  {
    disasterType: 'earthquake',
    photoCategory: 'earthquake',
    postedBy: 'fireService',
    shortDescription: (loc) => `Structural assessments and rescue support following a tremor in ${loc}.`,
    fullDescription: (loc, detail) =>
      `An earthquake has caused visible structural damage across parts of ${loc}. ${detail} Volunteer engineers and rescue crews are coordinating rapid building assessments and resident safety checks.`,
    locations: [
      { name: 'Kathmandu, Nepal', detail: 'Several older masonry buildings have visible cracking.' },
      { name: 'Sichuan, China', detail: 'Mountain roads to affected villages remain partially blocked.' },
      { name: 'Antakya, Turkey', detail: 'Aftershocks are complicating search-and-rescue work.' },
      { name: 'Ambon, Indonesia', detail: 'Coastal areas are also being checked for tsunami risk.' },
      { name: 'Bogotá, Colombia', detail: 'Older neighborhoods on the city outskirts are worst affected.' },
      { name: 'Christchurch, New Zealand', detail: 'Heritage buildings downtown are undergoing priority inspection.' },
    ],
  },
  {
    disasterType: 'fire',
    photoCategory: 'fire',
    postedBy: 'fireService',
    shortDescription: (loc) => `Emergency response and worker support after an industrial fire in ${loc}.`,
    fullDescription: (loc, detail) =>
      `A fire broke out at an industrial facility in ${loc}. ${detail} Volunteers are needed for emergency medical support, coordination with fire crews, and assistance to affected workers and their families.`,
    locations: [
      { name: 'Narsingdi, Bangladesh', detail: 'A textile mill has sustained significant structural damage.' },
      { name: 'Gazipur, Bangladesh', detail: 'An industrial park warehouse fire has displaced nearby residents.' },
    ],
  },
  {
    disasterType: 'fire',
    photoCategory: 'wildfire',
    postedBy: 'oceanCleanup',
    shortDescription: (loc) => `Containment support and evacuee shelter for a wildfire near ${loc}.`,
    fullDescription: (loc, detail) =>
      `A fast-moving wildfire is burning near ${loc}. ${detail} Volunteers are assisting fire crews with containment lines, evacuee shelter, and care for displaced pets and livestock.`,
    locations: [
      { name: 'New South Wales, Australia', detail: 'Dry bushland conditions are driving rapid spread.' },
      { name: 'Peloponnese, Greece', detail: 'Strong coastal winds are pushing the fire toward hillside villages.' },
      { name: 'Central Portugal', detail: 'Pine forest terrain is slowing ground crew access.' },
      { name: 'Oregon, USA', detail: 'Smoke has closed several forest access roads.' },
    ],
  },
  {
    disasterType: 'other',
    photoCategory: 'aid',
    postedBy: 'redCrescent',
    shortDescription: (loc) => `Volunteer-run health and relief support for vulnerable communities in ${loc}.`,
    fullDescription: (loc, detail) =>
      `${detail} This mission coordinates volunteer medical staff, supply distribution, and basic health screenings for residents of ${loc}.`,
    locations: [
      { name: 'Khulna, Bangladesh', detail: 'An unusually severe cold wave is putting riverside communities at risk.' },
      { name: 'Panchagarh, Bangladesh', detail: 'Overnight temperatures have dropped sharply in this northern district.' },
      { name: 'Rangamati, Bangladesh', detail: 'A landslide has blocked road access to several hillside settlements.' },
      { name: 'Bandarban, Bangladesh', detail: 'Monsoon landslides have damaged homes along the hill slopes.' },
      { name: 'Dhaka informal settlements', detail: 'A mobile health outreach is needed for underserved slum residents.' },
      { name: 'Sylhet tea gardens, Bangladesh', detail: 'Tea garden worker communities lack easy access to health posts.' },
    ],
  },
];

function urgencyFor(index: number): Urgency {
  const cycle: Urgency[] = ['critical', 'moderate', 'low'];
  return cycle[index % cycle.length];
}

function statusFor(index: number): Status {
  // Roughly 1 in 4 generated missions is resolved, matching the curated set's ratio.
  return index % 4 === 3 ? 'resolved' : 'active';
}

function volunteersNeededFor(urgency: Urgency, index: number): number {
  const base = urgency === 'critical' ? 55 : urgency === 'moderate' ? 30 : 15;
  return base + ((index * 7) % 20);
}

function buildGeneratedMissions(): MissionSeed[] {
  const missions: MissionSeed[] = [];
  let i = 0;
  for (const template of GENERATED_TEMPLATES) {
    for (const { name, detail } of template.locations) {
      const urgency = urgencyFor(i);
      missions.push({
        title: `${name.split(',')[0]} ${template.disasterType === 'other' ? 'Relief' : 'Response'} Mission`,
        shortDescription: template.shortDescription(name),
        fullDescription: template.fullDescription(name, detail),
        disasterType: template.disasterType,
        urgency,
        status: statusFor(i),
        location: name,
        volunteersNeeded: volunteersNeededFor(urgency, i),
        photoCategory: template.photoCategory,
        postedBy: template.postedBy,
      });
      i++;
    }
  }
  return missions;
}

const MISSION_SEEDS: MissionSeed[] = [...CURATED_MISSIONS, ...buildGeneratedMissions()];

if (MISSION_SEEDS.length !== 50) {
  throw new Error(
    `Expected exactly 50 missions, got ${MISSION_SEEDS.length}. Adjust CURATED_MISSIONS or GENERATED_TEMPLATES locations.`
  );
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

const TESTIMONIAL_SEEDS = [
  {
    quote:
      'The real-time coordination during the Sylhet floods let us mobilize volunteers twice as fast as we could before.',
    authorName: 'Nasrin Akter',
    authorRole: 'Volunteer Coordinator, Bangladesh Red Crescent',
    avatarUrl: avatar('1758518727888-ffa196002e59'),
  },
  {
    quote:
      "RescueLink's live mission board meant our crews always knew exactly where help was needed most.",
    authorName: 'Kamal Hossain',
    authorRole: 'Field Officer, Bangladesh Fire Service',
    avatarUrl: avatar('1758598497192-15ffa411c3de'),
  },
  {
    quote:
      'We tracked cleanup progress across three coastal sites in real time — something spreadsheets never let us do.',
    authorName: 'Farhana Rahman',
    authorRole: 'Program Lead, Ocean Cleanup BD',
    avatarUrl: avatar('1613023158271-4b1094000d5e'),
  },
  {
    quote:
      'As a first-time volunteer, sign-up took under two minutes and I was matched to a mission the same day.',
    authorName: 'Tanvir Ahmed',
    authorRole: 'Volunteer',
    avatarUrl: avatar('1549043671-1e4550948355'),
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

function randomDateWithinLastMonths(months: number): Date {
  const now = Date.now();
  const past = now - months * 30 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

async function seed() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const { orgIds, demoUserId, volunteerIds } = await getSeedUsers();

  // Volunteers are the 100 dedicated accounts plus the demo user (so
  // "my missions" has something to show for demoUser). Org/admin accounts
  // post missions but no longer sign up as volunteers for their own work.
  const signupPool = [...volunteerIds, demoUserId];

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
      imageUrl: unsplash(PHOTO[m.photoCategory]),
      images: missionImages(m.photoCategory),
      postedBy: orgIds[m.postedBy],
    }))
  );
  console.log(`Seeded ${missions.length} missions`);

  // Volunteer signups: each mission gets a random slice of the 101-person
  // signup pool, sized loosely off how many volunteers the mission needs.
  const signupDocs: { missionId: string; userId: string; joinedAt: Date }[] = [];
  const joinedCountByMission = new Map<string, number>();

  for (const mission of missions) {
    const target = Math.max(3, Math.min(20, Math.round(mission.volunteersNeeded / 4)));
    const shuffled = [...signupPool].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, target);

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
  console.log(`Seeded ${signupDocs.length} volunteer signups across ${signupPool.length} volunteers`);

  // Keep volunteersJoined on each mission consistent with the signups above.
  await Promise.all(
    missions.map((mission) =>
      Mission.updateOne(
        { _id: mission._id },
        { $set: { volunteersJoined: joinedCountByMission.get(String(mission._id)) ?? 0 } }
      )
    )
  );

  // A couple of progress updates for a handful of active, higher-profile missions.
  const posterNames: Record<string, string> = {
    [orgIds.redCrescent]: 'Bangladesh Red Crescent',
    [orgIds.fireService]: 'Bangladesh Fire Service',
    [orgIds.oceanCleanup]: 'Ocean Cleanup BD',
    [orgIds.demoAdmin]: 'Demo Admin',
  };

  const updateTargets = missions.filter((m) => m.status === 'active').slice(0, 12);
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

  await Testimonial.insertMany(TESTIMONIAL_SEEDS);
  console.log(`Seeded ${TESTIMONIAL_SEEDS.length} testimonials`);

  await Subscriber.insertMany([
    { email: 'alerts.subscriber1@example.com' },
    { email: 'alerts.subscriber2@example.com' },
  ]);
  console.log('Seeded 2 newsletter subscribers');

  console.log('\nApp data seeding complete.');
}

seed()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });