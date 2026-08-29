globalThis.crypto = require('crypto').webcrypto;
require('dotenv').config({ path: 'Backend/.env' });
const mongoose = require('mongoose');

const ExperiencePost = require('../models/experiencePost.model');
const Activity = require('../models/activity.model');
const User = require('../models/user.model');
const { extractAndNormalizeHashtags, determinePostCategory } = require('../utils/communityTaxonomy');

async function seedCommunityContent() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  // 1. Fetch legitimate existing users
  const existingUsers = await User.find({}).lean();
  
  // 2. Fetch existing activities
  const existingActivities = await Activity.find({}).lean();

  // 3. Count existing community posts
  const existingPosts = await ExperiencePost.find({ status: { $ne: 'removed' } }).lean();

  // Build a lookup map of activities by ID or name substring
  const actMap = new Map();
  existingActivities.forEach(a => {
    if (a.id) actMap.set(a.id, a);
    if (a._id) actMap.set(a._id.toString(), a);
  });

  // Build lookup of users by persona or username or role
  const findUserByUsername = (uname) => existingUsers.find(u => u.username === uname);
  const findUserByInterest = (interest) => existingUsers.find(u => u.interests && u.interests.includes(interest));
  const fallbackUser = existingUsers.find(u => u.role === 'user') || existingUsers[0];

  // Candidates for high quality authentic BNHS community observations
  const candidatePostBlueprints = [
    {
      targetUsername: 'persona_aarav',
      interestFallback: 'trees',
      activityId: 'bnhs_heritage_tree_walk_kala_ghoda',
      category: 'Trees & Flora',
      content: "Found an impressive old banyan tree during today's heritage walk near Kala Ghoda. The canopy was full of bird activity. #TreesAndFlora #Botany #MumbaiTrees",
      imageUrl: 'https://images.pexels.com/photos/32235394/pexels-photo-32235394.jpeg?auto=compress&cs=tinysrgb&w=1280',
      createdAt: new Date('2026-08-27T08:30:00Z')
    },
    {
      targetUsername: 'test_multi_user_f6db40',
      interestFallback: 'birds',
      activityId: 'bnhs_flamingo_watch_chanakya',
      category: 'Birds',
      content: 'Spotted a White-throated Kingfisher during the morning walk. Beautiful sighting near the wetlands. #Birds #Birdwatching #Wetlands',
      imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date('2026-08-27T09:15:00Z')
    },
    {
      targetUsername: 'test_single_user_5180e5',
      interestFallback: 'marine',
      activityId: 'bnhs_marine_walk_juhu',
      category: 'Marine',
      content: 'Observed several intertidal species and shore organisms during the low-tide walk at Juhu. #MarineLife #OceanConservation #CoastalWalk',
      imageUrl: 'https://images.pexels.com/photos/5116289/pexels-photo-5116289.jpeg?auto=compress&cs=tinysrgb&w=1280',
      createdAt: new Date('2026-08-27T11:45:00Z')
    },
    {
      targetUsername: 'persona_neha',
      interestFallback: 'butterflies',
      activityId: 'bnhs_butterfly_festival',
      category: 'Insects',
      content: 'Captured this Common Mormon butterfly feeding near the garden trail. #Insects #Butterflies #Entomology',
      imageUrl: 'https://images.pexels.com/photos/12894312/pexels-photo-12894312.jpeg?auto=compress&cs=tinysrgb&w=1280',
      createdAt: new Date('2026-08-28T07:20:00Z')
    },
    {
      targetUsername: 'persona_siddharth',
      interestFallback: 'volunteering',
      activityId: 'bnhs_corporate_csr_plantation',
      category: 'Conservation',
      content: "Joined today's cleanup activity and habitat restoration drive. Proud of the collective effort! #Conservation #Volunteering #CleanIndia",
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date('2026-08-28T10:00:00Z')
    },
    {
      targetUsername: 'persona_rohan',
      interestFallback: 'reptiles',
      activityId: 'bnhs_matheran_herpetofauna_camp',
      category: 'Field Camps',
      content: 'Early morning field session with some beautiful herpetofauna observations before sunrise. #FieldCamps #Herpetology #WesternGhats',
      imageUrl: 'https://images.pexels.com/photos/30835534/pexels-photo-30835534.jpeg?auto=compress&cs=tinysrgb&w=1280',
      createdAt: new Date('2026-08-28T14:30:00Z')
    },
    {
      targetUsername: 'persona_priya',
      interestFallback: 'botany',
      activityId: 'bnhs_reserve_monsoon_walk',
      category: 'Trees & Flora',
      content: 'The Western Ghats monsoon canopy is bursting with fresh moss, ferns, and active canopy life. #TreesAndFlora #Flora #NatureReserve',
      imageUrl: 'https://images.pexels.com/photos/581321/pexels-photo-581321.jpeg?auto=compress&cs=tinysrgb&w=1280',
      createdAt: new Date('2026-08-29T06:45:00Z')
    },
    {
      targetUsername: 'test_user_f5ac7f',
      interestFallback: 'wildlife',
      activityId: 'bnhs_sgnp_bird_monitoring',
      category: 'Wildlife',
      content: 'Spotted deer herd moving through the teak forest canopy during the SGNP field monitoring session. #Wildlife #Mammals #SGNP',
      imageUrl: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date('2026-08-29T08:10:00Z')
    },
    {
      targetUsername: 'abhiramch018',
      interestFallback: 'conservation',
      activityId: 'bnhs_seva_volunteer_program',
      category: 'Volunteering',
      content: 'Great day coordinating with fellow naturalists and archiving native plant specimens. #Volunteering #Conservation #CitizenScience',
      imageUrl: 'https://images.pexels.com/photos/16894419/pexels-photo-16894419.jpeg?auto=compress&cs=tinysrgb&w=1280',
      createdAt: new Date('2026-08-29T11:00:00Z')
    }
  ];

  // Check which posts actually need to be created
  const postsToCreate = [];

  for (const blueprint of candidatePostBlueprints) {
    // Resolve user
    let user = findUserByUsername(blueprint.targetUsername);
    if (!user) {
      user = findUserByInterest(blueprint.interestFallback);
    }
    if (!user) {
      user = fallbackUser;
    }
    if (!user) continue;

    // Resolve activity
    const activity = actMap.get(blueprint.activityId) || existingActivities[0];
    if (!activity) continue;

    // Check if duplicate already exists (by user, activity, and seedSource)
    const existingMatch = existingPosts.find(p => 
      p.user?.toString() === user._id.toString() &&
      (p.activity?.toString() === activity._id.toString() || p.activityIdString === activity.id) &&
      p.seedSource === 'community_visual_seed'
    );

    if (!existingMatch) {
      const normalizedTags = extractAndNormalizeHashtags(blueprint.content, []);
      const canonicalCategory = determinePostCategory({
        explicitCategory: blueprint.category,
        content: blueprint.content,
        hashtags: normalizedTags,
        activityCategory: activity.category,
      });

      postsToCreate.push({
        user: user._id,
        userName: user.name || user.username,
        userRole: user.role || 'user',
        activity: activity._id,
        activityIdString: activity.id,
        activityName: activity.name || activity.title,
        category: canonicalCategory,
        hashtags: normalizedTags,
        activityCategory: canonicalCategory,
        activityType: activity.type || 'walk',
        activityLocation: activity.location,
        activityDate: '2026-08-27',
        isAttendedVerified: true,
        content: blueprint.content,
        imageUrls: [blueprint.imageUrl],
        reactionsCount: 0,
        commentsCount: 0,
        comments: [],
        status: 'active',
        isSeeded: true,
        seedSource: 'community_visual_seed',
        createdAt: blueprint.createdAt
      });
    }
  }

  // Count distinct images
  const usableImagesCount = candidatePostBlueprints.length + existingActivities.filter(a => a.image || a.imageUrl).length;

  console.log(`Existing users found: ${existingUsers.length}`);
  console.log(`Existing activities found: ${existingActivities.length}`);
  console.log(`Existing usable images found: ${usableImagesCount}`);
  console.log(`Existing community posts: ${existingPosts.length}`);
  console.log(`New community posts to create: ${postsToCreate.length}`);

  if (postsToCreate.length > 0) {
    // First remove any old un-tagged demo posts if they existed from preliminary testing
    await ExperiencePost.deleteMany({ seedSource: { $ne: 'community_visual_seed' }, isAttendedVerified: false });
    
    // Insert new posts
    const inserted = await ExperiencePost.insertMany(postsToCreate);
    console.log(`Successfully created ${inserted.length} authentic community posts for existing users.`);
  } else {
    console.log('Database is already up to date. No new posts created.');
  }

  await mongoose.disconnect();
}

seedCommunityContent().catch(err => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
