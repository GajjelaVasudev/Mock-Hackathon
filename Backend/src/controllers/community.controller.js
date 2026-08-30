const mongoose = require('mongoose');
const ExperiencePost = require('../models/experiencePost.model');
const CommunityMessage = require('../models/communityMessage.model');
const CommunityReport = require('../models/communityReport.model');
const CommunityReadState = require('../models/communityReadState.model');
const Registration = require('../models/registration.model');
const Activity = require('../models/activity.model');
const User = require('../models/user.model');

const {
  CANONICAL_CATEGORIES,
  normalizeHashtag,
  extractAndNormalizeHashtags,
  normalizeCategoryName,
  determinePostCategory,
} = require('../utils/communityTaxonomy');

// Helper to resolve activity by ObjectId or string id
async function findActivity(activityId) {
  if (!activityId) return null;
  if (mongoose.Types.ObjectId.isValid(activityId)) {
    return await Activity.findOne({
      $or: [{ _id: activityId }, { id: activityId }]
    });
  }
  return await Activity.findOne({ id: activityId });
}

// Helper to format date
function formatDate(dateVal) {
  if (!dateVal) return 'Upcoming';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(dateVal);
  }
}

class CommunityController {
  /**
   * 1. Get Community Feed with Filtering & Sorting
   */
  async getFeed(req, res) {
    try {
      const { category, theme, hashtag, myPosts, saved, sort = 'recent', page = 1, limit = 20, search } = req.query;
      const currentUserId = req.user ? (req.user.id || req.user._id) : null;

      // Fetch saved post IDs if user is logged in
      let savedPostIds = [];
      if (currentUserId) {
        const currentUser = await User.findById(currentUserId).select('savedPosts');
        if (currentUser && currentUser.savedPosts) {
          savedPostIds = currentUser.savedPosts;
        }
      }

      // Base query: only active posts
      const queryConditions = { status: 'active' };

      // Filter by My Posts
      if (myPosts === 'true') {
        if (!currentUserId) {
          return res.status(200).json({
            total: 0,
            page: 1,
            totalPages: 1,
            posts: []
          });
        }
        queryConditions.user = currentUserId;
      }

      // Filter by Saved Posts
      if (saved === 'true') {
        if (!currentUserId || savedPostIds.length === 0) {
          return res.status(200).json({
            total: 0,
            page: 1,
            totalPages: 1,
            posts: []
          });
        }
        queryConditions._id = { $in: savedPostIds };
      }

      // Exact Canonical Category Matching
      if (category && category !== 'all' && category !== 'All') {
        const canonicalCat = normalizeCategoryName(category) || category.trim();
        queryConditions.$or = [
          { category: canonicalCat },
          { activityCategory: canonicalCat }
        ];
      }

      // Independent Hashtag Filtering (CATEGORY != HASHTAG)
      if (hashtag && hashtag.trim()) {
        const cleanTag = normalizeHashtag(hashtag); // e.g. "#flora"
        const rawTag = cleanTag.replace(/^#/, '');  // e.g. "flora"
        queryConditions.$or = [
          { hashtags: cleanTag },
          { hashtags: rawTag },
          { content: new RegExp('#' + rawTag + '(?![a-zA-Z0-9_-])', 'i') }
        ];
      }

      if (theme) {
        const canonicalTheme = normalizeCategoryName(theme) || theme.trim();
        queryConditions.$or = [
          { category: canonicalTheme },
          { activityCategory: canonicalTheme }
        ];
      }

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        queryConditions.$or = [
          { content: searchRegex },
          { activityName: searchRegex },
          { userName: searchRegex },
          { hashtags: searchRegex }
        ];
      }

      let sortOptions = { createdAt: -1 };
      if (sort === 'most_liked') {
        sortOptions = { reactionsCount: -1, createdAt: -1 };
      } else if (sort === 'most_discussed') {
        sortOptions = { commentsCount: -1, createdAt: -1 };
      }

      const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
      const take = Math.min(50, parseInt(limit, 10));

      const [posts, total, allActivePosts] = await Promise.all([
        ExperiencePost.find(queryConditions)
          .sort(sortOptions)
          .skip(skip)
          .limit(take)
          .populate('user', 'name username role avatar'),
        ExperiencePost.countDocuments(queryConditions),
        ExperiencePost.find({ status: 'active' }, { content: 1, hashtags: 1, category: 1 }).lean()
      ]);

      // Calculate genuine, real-time hashtag frequencies from actual active MongoDB posts
      const tagFrequencyMap = {};
      allActivePosts.forEach(p => {
        const postTags = extractAndNormalizeHashtags(p.content, p.hashtags || []);
        postTags.forEach(tag => {
          const raw = tag.replace(/^#/, '');
          tagFrequencyMap[raw] = (tagFrequencyMap[raw] || 0) + 1;
        });
      });

      // Format dynamic hashtags list sorted by count
      const dynamicHashtags = Object.entries(tagFrequencyMap)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => ({ tag, count }));

      const formattedPosts = posts.map(post => {
        const p = post.toObject();
        const userReaction = currentUserId
          ? p.reactions?.find(r => r.user?.toString() === currentUserId.toString())
          : null;

        const isSaved = currentUserId
          ? savedPostIds.some(s => s.toString() === p._id.toString())
          : false;

        return {
          ...p,
          isLiked: !!userReaction,
          userReactionType: userReaction?.type || null,
          isSaved,
          isOwner: currentUserId ? p.user?._id?.toString() === currentUserId.toString() || p.user?.toString() === currentUserId.toString() : false
        };
      });

      return res.status(200).json({
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / take),
        hashtags: dynamicHashtags,
        posts: formattedPosts
      });
    } catch (error) {
      console.error('getFeed error:', error);
      return res.status(500).json({ message: 'Failed to fetch community feed' });
    }
  }

  /**
   * Toggle Bookmark / Save Post
   */
  async toggleSavePost(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const { id } = req.params;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const savedList = (user.savedPosts || []).map(s => s.toString());
      const idStr = id.toString();
      const isSaved = savedList.includes(idStr);

      if (isSaved) {
        await User.findByIdAndUpdate(userId, {
          $pull: { savedPosts: id }
        });
      } else {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { savedPosts: id }
        });
      }

      return res.status(200).json({
        isSaved: !isSaved,
        savedCount: isSaved ? Math.max(0, savedList.length - 1) : savedList.length + 1,
        message: !isSaved ? 'Post saved to your bookmarks' : 'Post removed from saved'
      });
    } catch (err) {
      console.error('toggleSavePost error:', err);
      return res.status(500).json({ message: 'Failed to toggle save post' });
    }
  }

  /**
   * 2. Get User's Attended Activities for Experience Sharing
   */
  async getAttendedActivities(req, res) {
    try {
      const userId = req.user.id || req.user._id;

      // Query MongoDB registrations for attended status
      const registrations = await Registration.find({
        user: userId,
        status: 'attended'
      }).populate('activity');

      const attendedMap = new Map();

      for (const reg of registrations) {
        if (reg.activity) {
          const act = reg.activity;
          const actId = act.id || act._id.toString();
          if (!attendedMap.has(actId)) {
            attendedMap.set(actId, {
              id: actId,
              _id: act._id.toString(),
              name: act.name || act.title,
              title: act.title || act.name,
              category: act.category || 'Nature Activities',
              type: act.type || 'walk',
              location: act.location || 'Mumbai',
              date: formatDate(act.date),
              rawDate: act.date,
              status: act.status
            });
          }
        }
      }

      // If user is Staff or Admin, also allow selecting recent activities for field posts
      if (req.user.role === 'staff' || req.user.role === 'admin') {
        const recentActivities = await Activity.find({ status: { $ne: 'cancelled' } })
          .sort({ date: -1 })
          .limit(10);
        for (const act of recentActivities) {
          const actId = act.id || act._id.toString();
          if (!attendedMap.has(actId)) {
            attendedMap.set(actId, {
              id: actId,
              _id: act._id.toString(),
              name: act.name || act.title,
              title: act.title || act.name,
              category: act.category || 'Nature Activities',
              type: act.type || 'walk',
              location: act.location || 'Mumbai',
              date: formatDate(act.date),
              rawDate: act.date,
              status: act.status
            });
          }
        }
      }

      return res.status(200).json({
        count: attendedMap.size,
        activities: Array.from(attendedMap.values())
      });
    } catch (error) {
      console.error('getAttendedActivities error:', error);
      return res.status(500).json({ message: 'Failed to fetch attended activities' });
    }
  }

  /**
   * 3. Create Experience Post (Open to all authenticated naturalists)
   */
  async createExperiencePost(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const userRole = req.user.role || 'user';
      const userName = req.user.name || req.user.username || 'BNHS Naturalist';
      const { activityId, category, content, imageUrls = [] } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Experience content is required' });
      }

      // 1. Resolve activity if provided (Optional)
      let activity = null;
      let isAttendedVerified = false;

      if (activityId) {
        activity = await findActivity(activityId);
        if (activity) {
          // Check if user attended this activity for verified badge
          if (userRole === 'admin' || userRole === 'staff') {
            isAttendedVerified = true;
          } else {
            const attendanceRecord = await Registration.findOne({
              user: userId,
              activity: activity._id,
              status: 'attended'
            });
            if (attendanceRecord) {
              isAttendedVerified = true;
            }
          }
        }
      }

      // 2. Process uploaded files if passed via multer
      let finalImageUrls = Array.isArray(imageUrls) ? [...imageUrls] : [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const uploadedPaths = req.files.map(f => `/uploads/${f.filename}`);
        finalImageUrls = [...finalImageUrls, ...uploadedPaths];
      }

      // 3. Normalize hashtags and determine canonical category
      const normalizedTags = extractAndNormalizeHashtags(content, req.body.hashtags || []);
      const canonicalCategory = determinePostCategory({
        explicitCategory: category,
        content: content.trim(),
        hashtags: normalizedTags,
        activityCategory: activity ? activity.category : null,
      });

      // 4. Create Post
      const post = await ExperiencePost.create({
        user: userId,
        userName,
        userRole,
        activity: activity ? activity._id : null,
        activityIdString: activity ? (activity.id || activity._id.toString()) : null,
        activityName: activity ? (activity.name || activity.title) : 'Nature Field Observation',
        activityDate: activity ? formatDate(activity.date) : formatDate(new Date()),
        activityLocation: activity ? activity.location : 'BNHS Habitat Field Site',
        category: canonicalCategory,
        hashtags: normalizedTags,
        activityCategory: canonicalCategory,
        activityType: activity ? (activity.type || 'walk') : 'observation',
        isAttendedVerified,
        content: content.trim(),
        imageUrls: finalImageUrls,
        reactions: [],
        reactionsCount: 0,
        comments: [],
        commentsCount: 0,
        status: 'active'
      });

      const populatedPost = await ExperiencePost.findById(post._id).populate('user', 'name username role avatar');

      return res.status(201).json({
        message: 'Experience post published successfully',
        post: {
          ...populatedPost.toObject(),
          isLiked: false,
          isOwner: true
        }
      });
    } catch (error) {
      console.error('createExperiencePost error:', error);
      return res.status(500).json({ message: error.message || 'Failed to publish experience post' });
    }
  }

  /**
   * 4. Get Single Experience Post
   */
  async getExperiencePostById(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.user ? (req.user.id || req.user._id) : null;

      const post = await ExperiencePost.findById(id).populate('user', 'name username role avatar');
      if (!post || post.status === 'removed') {
        return res.status(404).json({ message: 'Experience post not found' });
      }

      const p = post.toObject();
      const userReaction = currentUserId
        ? p.reactions?.find(r => r.user?.toString() === currentUserId.toString())
        : null;

      return res.status(200).json({
        ...p,
        isLiked: !!userReaction,
        userReactionType: userReaction?.type || null,
        isOwner: currentUserId ? p.user?._id?.toString() === currentUserId.toString() : false
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch experience post' });
    }
  }

  /**
   * 5. Add Comment to Experience Post
   */
  async addComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id || req.user._id;
      const userName = req.user.name || req.user.username || 'Naturalist';
      const userRole = req.user.role || 'user';
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Comment text is required' });
      }

      const post = await ExperiencePost.findById(id);
      if (!post || post.status === 'removed') {
        return res.status(404).json({ message: 'Experience post not found' });
      }

      const newComment = {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        userName,
        userRole,
        content: content.trim(),
        createdAt: new Date()
      };

      post.comments.push(newComment);
      post.commentsCount = post.comments.length;
      await post.save();

      return res.status(201).json({
        message: 'Comment added successfully',
        comment: newComment,
        commentsCount: post.commentsCount
      });
    } catch (error) {
      console.error('addComment error:', error);
      return res.status(500).json({ message: 'Failed to add comment' });
    }
  }

  /**
   * 6. Toggle Reaction (Like / Heart / Nature / Bird)
   */
  async toggleReaction(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id || req.user._id;
      const { type = 'like' } = req.body;

      const post = await ExperiencePost.findById(id);
      if (!post || post.status === 'removed') {
        return res.status(404).json({ message: 'Experience post not found' });
      }

      const existingIndex = post.reactions.findIndex(
        r => r.user && r.user.toString() === userId.toString()
      );

      let isLiked = false;

      if (existingIndex > -1) {
        if (post.reactions[existingIndex].type === type) {
          // Un-react
          post.reactions.splice(existingIndex, 1);
          isLiked = false;
        } else {
          // Switch reaction type
          post.reactions[existingIndex].type = type;
          isLiked = true;
        }
      } else {
        // Add new reaction
        post.reactions.push({
          user: userId,
          type,
          createdAt: new Date()
        });
        isLiked = true;
      }

      post.reactionsCount = post.reactions.length;
      await post.save();

      return res.status(200).json({
        isLiked,
        reactionType: isLiked ? type : null,
        reactionsCount: post.reactionsCount
      });
    } catch (error) {
      console.error('toggleReaction error:', error);
      return res.status(500).json({ message: 'Failed to update reaction' });
    }
  }

  /**
   * 7. Delete Experience Post (Owner or Admin)
   */
  async deleteExperiencePost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id || req.user._id;
      const userRole = req.user.role || 'user';

      const post = await ExperiencePost.findById(id);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (post.user.toString() !== userId.toString() && userRole !== 'admin') {
        return res.status(403).json({ message: 'You are not authorized to delete this post' });
      }

      post.status = 'removed';
      await post.save();

      return res.status(200).json({ message: 'Post removed successfully', postId: id });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete post' });
    }
  }

  /**
   * 8. Get User's Own Shared Experiences
   */
  async getMyExperiences(req, res) {
    try {
      const userId = req.user.id || req.user._id;

      const posts = await ExperiencePost.find({
        user: userId,
        status: { $ne: 'removed' }
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        count: posts.length,
        posts
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch user experiences' });
    }
  }

  /**
   * 9. Get Activity Group Chat Info & Access Permissions
   */
  async getActivityChatInfo(req, res) {
    try {
      const { activityId } = req.params;
      const userId = req.user ? (req.user.id || req.user._id) : null;
      const userRole = req.user ? req.user.role : null;

      const activity = await findActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      const actMongoId = activity._id;

      // Count registered / attended participants
      const participantCount = await Registration.countDocuments({
        activity: actMongoId,
        status: { $in: ['registered', 'attended'] }
      });

      // Check user access permissions
      let canChat = false;
      let isRegistered = false;
      let isAttended = false;

      if (userRole === 'admin' || userRole === 'staff') {
        canChat = true;
      } else if (userId) {
        const userReg = await Registration.findOne({
          user: userId,
          activity: actMongoId,
          status: { $in: ['registered', 'attended'] }
        });
        if (userReg) {
          canChat = true;
          isRegistered = true;
          isAttended = userReg.status === 'attended';
        }
      }

      return res.status(200).json({
        activity: {
          id: activity.id || activity._id.toString(),
          _id: activity._id.toString(),
          name: activity.name || activity.title,
          title: activity.title || activity.name,
          category: activity.category || 'Nature Activities',
          type: activity.type || 'walk',
          location: activity.location || 'Mumbai',
          date: formatDate(activity.date),
          rawDate: activity.date,
          difficulty: activity.difficulty || 'moderate',
          capacity: activity.capacity || 30,
          participantCount,
          status: activity.status || 'upcoming',
          description: activity.description || ''
        },
        permissions: {
          canChat,
          isRegistered,
          isAttended,
          isStaffOrAdmin: userRole === 'staff' || userRole === 'admin'
        }
      });
    } catch (error) {
      console.error('getActivityChatInfo error:', error);
      return res.status(500).json({ message: 'Failed to fetch activity chat information' });
    }
  }

  /**
   * 10. Get Activity Group Chat Messages (with Pagination)
   */
  async getActivityMessages(req, res) {
    try {
      const { activityId } = req.params;
      const { limit = 50, before } = req.query;
      const userId = req.user.id || req.user._id;
      const userRole = req.user.role;

      const activity = await findActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      const actMongoId = activity._id;

      // Access Check: Must be registered/attended OR staff/admin
      if (userRole !== 'admin' && userRole !== 'staff') {
        const userReg = await Registration.findOne({
          user: userId,
          activity: actMongoId,
          status: { $in: ['registered', 'attended'] }
        });
        if (!userReg) {
          return res.status(403).json({
            message: 'You must be registered for this activity to view or participate in the group discussion.'
          });
        }
      }

      const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const queryConditions = {
        $or: [
          { activity: actMongoId },
          { activityIdString: activity.id || activityId },
          { activityIdString: activity._id.toString() },
          { activityIdString: activityId }
        ],
        status: 'active'
      };

      if (before) {
        queryConditions.createdAt = { $lt: new Date(before) };
      }

      // Fetch the latest 'take' messages (or before cursor)
      const rawMessages = await CommunityMessage.find(queryConditions)
        .sort({ createdAt: -1 })
        .limit(take)
        .populate('user', 'name username role avatar');

      // Reverse so frontend receives strictly chronological order (oldest to newest)
      const chronologicalMessages = rawMessages.reverse();

      let hasMore = false;
      if (chronologicalMessages.length > 0) {
        const oldestTime = chronologicalMessages[0].createdAt;
        const olderCount = await CommunityMessage.countDocuments({
          $or: [
            { activity: actMongoId },
            { activityIdString: activity.id || activityId },
            { activityIdString: activity._id.toString() },
            { activityIdString: activityId }
          ],
          status: 'active',
          createdAt: { $lt: oldestTime }
        });
        hasMore = olderCount > 0;
      }

      const formattedMessages = chronologicalMessages.map(m => {
        const msgObj = m.toObject();
        return {
          ...msgObj,
          isCurrentUser: msgObj.user?._id?.toString() === userId.toString() || msgObj.user?.toString() === userId.toString()
        };
      });

      // Update read state for authenticated user
      if (userId && actMongoId) {
        CommunityReadState.findOneAndUpdate(
          { user: userId, activity: actMongoId },
          { lastReadAt: new Date(), activityIdString: activity.id || activityId },
          { upsert: true, new: true }
        ).catch(() => {});
      }

      return res.status(200).json({
        activityId: activity.id || activity._id.toString(),
        count: formattedMessages.length,
        hasMore,
        messages: formattedMessages
      });
    } catch (error) {
      console.error('getActivityMessages error:', error);
      return res.status(500).json({ message: 'Failed to fetch activity messages' });
    }
  }

  /**
   * 11. Send Message to Activity Group Chat
   */
  async sendActivityMessage(req, res) {
    try {
      const { activityId } = req.params;
      const userId = req.user.id || req.user._id;
      const userName = req.user.name || req.user.username || 'Naturalist';
      const userRole = req.user.role || 'user';
      const { message, imageUrls = [] } = req.body;

      if ((!message || !message.trim()) && (!imageUrls || imageUrls.length === 0) && (!req.files || req.files.length === 0)) {
        return res.status(400).json({ message: 'Message text or image is required' });
      }

      const activity = await findActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      const actMongoId = activity._id;

      // Access Check: Must be registered/attended OR staff/admin
      if (userRole !== 'admin' && userRole !== 'staff') {
        const userReg = await Registration.findOne({
          user: userId,
          activity: actMongoId,
          status: { $in: ['registered', 'attended'] }
        });
        if (!userReg) {
          return res.status(403).json({
            message: 'You must be registered for this activity to send messages in the group discussion.'
          });
        }
      }

      let finalImageUrls = Array.isArray(imageUrls) ? [...imageUrls] : [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const uploadedPaths = req.files.map(f => `/uploads/${f.filename}`);
        finalImageUrls = [...finalImageUrls, ...uploadedPaths];
      }

      const newMsg = await CommunityMessage.create({
        activity: actMongoId,
        activityIdString: activity.id || activity._id.toString(),
        user: userId,
        userName,
        userRole,
        message: (message || '').trim(),
        imageUrls: finalImageUrls,
        reactions: [],
        status: 'active'
      });

      const populatedMsg = await CommunityMessage.findById(newMsg._id).populate('user', 'name username role avatar');

      return res.status(201).json({
        message: 'Message sent successfully',
        chatMessage: {
          ...populatedMsg.toObject(),
          isCurrentUser: true
        }
      });
    } catch (error) {
      console.error('sendActivityMessage error:', error);
      return res.status(500).json({ message: 'Failed to send activity message' });
    }
  }

  /**
   * 12. Upload Images Handler
   */
  async uploadImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded' });
      }

      const urls = req.files.map(f => `/uploads/${f.filename}`);
      return res.status(201).json({
        message: 'Images uploaded successfully',
        urls
      });
    } catch (error) {
      return res.status(500).json({ message: error.message || 'Image upload failed' });
    }
  }

  /**
   * 13. Create Report (Spam, Harassment, Inappropriate Content)
   */
  async createReport(req, res) {
    try {
      const reporterId = req.user.id || req.user._id;
      const reporterName = req.user.name || req.user.username || 'User';
      const { targetType, targetId, reason, details, postId, activityId } = req.body;

      if (!targetType || !targetId || !reason) {
        return res.status(400).json({ message: 'Target type, target ID, and reason are required' });
      }

      const report = await CommunityReport.create({
        reporter: reporterId,
        reporterName,
        targetType,
        targetId,
        post: postId || null,
        activity: activityId || null,
        reason,
        details: details ? details.trim() : '',
        status: 'pending'
      });

      // Increment reportsCount if target is an ExperiencePost
      if (targetType === 'post' && mongoose.Types.ObjectId.isValid(targetId)) {
        await ExperiencePost.findByIdAndUpdate(targetId, { $inc: { reportsCount: 1 } });
      }

      return res.status(201).json({
        message: 'Report submitted for review. Thank you for keeping the BNHS community safe.',
        reportId: report._id
      });
    } catch (error) {
      console.error('createReport error:', error);
      return res.status(500).json({ message: 'Failed to submit report' });
    }
  }

  /**
   * 14. Admin Moderation: Get Reports
   */
  async getAdminReports(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { status = 'pending' } = req.query;
      const queryConditions = {};
      if (status !== 'all') {
        queryConditions.status = status;
      }

      const reports = await CommunityReport.find(queryConditions)
        .sort({ createdAt: -1 })
        .populate('reporter', 'name username email')
        .populate('post');

      return res.status(200).json({
        count: reports.length,
        reports
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch community reports' });
    }
  }

  /**
   * 15. Admin Moderation: Resolve Report
   */
  async resolveReport(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { action, adminNotes } = req.body; // action: 'dismiss', 'remove_post', 'hide_post'
      const adminId = req.user.id || req.user._id;

      const report = await CommunityReport.findById(id);
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }

      if (action === 'remove_post' && report.targetType === 'post') {
        await ExperiencePost.findByIdAndUpdate(report.targetId, { status: 'removed' });
        report.status = 'actioned';
      } else if (action === 'hide_post' && report.targetType === 'post') {
        await ExperiencePost.findByIdAndUpdate(report.targetId, { status: 'hidden' });
        report.status = 'actioned';
      } else {
        report.status = 'dismissed';
      }

      report.adminNotes = adminNotes || '';
      report.resolvedBy = adminId;
      report.resolvedAt = new Date();
      await report.save();

      return res.status(200).json({
        message: `Report ${report.status} successfully`,
        report
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to resolve report' });
    }
  }

  /**
   * 16. Get My Active Activity Discussions (My Conversations)
   */
  async getMyConversations(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const userRole = req.user.role;

      // Find activities where user sent a message
      const messagedActivityIds = await CommunityMessage.distinct('activity', {
        user: userId,
        status: 'active'
      });

      // Also find registered / attended activities
      const registeredActivityIds = await Registration.distinct('activity', {
        user: userId,
        status: { $in: ['registered', 'attended'] }
      });

      // If user is staff or admin, include all activities with messages
      let candidateActivityObjectIds = [];
      if (userRole === 'admin' || userRole === 'staff') {
        const allMessagedActivities = await CommunityMessage.distinct('activity', {
          status: 'active'
        });
        candidateActivityObjectIds = allMessagedActivities;
      } else {
        candidateActivityObjectIds = Array.from(
          new Set([...messagedActivityIds, ...registeredActivityIds].map(id => id.toString()))
        ).filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
      }

      if (!candidateActivityObjectIds || candidateActivityObjectIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          conversations: []
        });
      }

      // Check which of these candidate activities actually have active messages
      const activeActivityIds = await CommunityMessage.distinct('activity', {
        activity: { $in: candidateActivityObjectIds },
        status: 'active'
      });

      if (!activeActivityIds || activeActivityIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          conversations: []
        });
      }

      // Load activities in batch
      const activities = await Activity.find({
        _id: { $in: activeActivityIds }
      }).lean();

      const activityMap = new Map();
      activities.forEach(a => activityMap.set(a._id.toString(), a));

      // Load user's read states in batch
      const readStates = await CommunityReadState.find({
        user: userId,
        activity: { $in: activeActivityIds }
      }).lean();

      const readStateMap = new Map();
      readStates.forEach(rs => readStateMap.set(rs.activity.toString(), rs.lastReadAt));

      const conversations = [];

      for (const actId of activeActivityIds) {
        const actMongoIdStr = actId.toString();
        const activity = activityMap.get(actMongoIdStr);
        if (!activity) continue;

        const lastReadAt = readStateMap.get(actMongoIdStr) || new Date(0);

        // Retrieve latest message in activity
        const lastMsg = await CommunityMessage.findOne({
          activity: actId,
          status: 'active'
        })
          .sort({ createdAt: -1 })
          .populate('user', 'name username role')
          .lean();

        if (!lastMsg) continue;

        // Count total messages
        const messageCount = await CommunityMessage.countDocuments({
          activity: actId,
          status: 'active'
        });

        // Count unread messages (messages sent by others after lastReadAt)
        const unreadCount = await CommunityMessage.countDocuments({
          activity: actId,
          user: { $ne: userId },
          status: 'active',
          createdAt: { $gt: lastReadAt }
        });

        // Count registered participants
        const participantCount = await Registration.countDocuments({
          activity: actId,
          status: { $in: ['registered', 'attended'] }
        });

        const isMe =
          lastMsg.user?._id?.toString() === userId.toString() ||
          lastMsg.user?.toString() === userId.toString();

        const senderName = isMe
          ? 'You'
          : (lastMsg.userName || lastMsg.user?.name || lastMsg.user?.username || 'Naturalist');

        const hasImages = Array.isArray(lastMsg.imageUrls) && lastMsg.imageUrls.length > 0;
        const imageCount = hasImages ? lastMsg.imageUrls.length : 0;

        conversations.push({
          activityId: activity.id || activity._id.toString(),
          activityMongoId: activity._id.toString(),
          activityTitle: activity.name || activity.title || 'Nature Activity',
          activityDate: formatDate(activity.date),
          rawDate: activity.date,
          location: activity.location || 'Mumbai',
          category: activity.category || 'Nature Activities',
          type: activity.type || 'walk',
          status: activity.status || 'upcoming',
          participantCount,
          messageCount,
          unreadCount,
          lastMessage: {
            id: lastMsg._id.toString(),
            text: lastMsg.message || '',
            senderName,
            senderRole: lastMsg.userRole || (lastMsg.user?.role) || 'user',
            isCurrentUser: isMe,
            hasImages,
            imageCount,
            firstImageUrl: hasImages ? lastMsg.imageUrls[0] : null,
            createdAt: lastMsg.createdAt
          }
        });
      }

      // Sort conversations latest first (newest message at top)
      conversations.sort(
        (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );

      return res.status(200).json({
        success: true,
        count: conversations.length,
        conversations
      });
    } catch (error) {
      console.error('getMyConversations error:', error);
      return res.status(500).json({ message: 'Failed to fetch personal conversations' });
    }
  }

  /**
   * 17. Mark Conversation As Read
   */
  async markConversationRead(req, res) {
    try {
      const { activityId } = req.params;
      const userId = req.user.id || req.user._id;

      const activity = await findActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: 'Activity not found' });
      }

      await CommunityReadState.findOneAndUpdate(
        { user: userId, activity: activity._id },
        { lastReadAt: new Date(), activityIdString: activity.id || activityId },
        { upsert: true, new: true }
      );

      return res.status(200).json({ success: true, message: 'Conversation marked as read' });
    } catch (error) {
      console.error('markConversationRead error:', error);
      return res.status(500).json({ message: 'Failed to mark conversation read' });
    }
  }
}

module.exports = new CommunityController();
