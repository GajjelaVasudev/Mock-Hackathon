/**
 * AI Controller for Express.
 * Proxies and orchestrates AI requests between React and Python FastAPI,
 * including conversational RAG, personalized recommendations, and advanced Chat-to-Register functionality.
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const pythonAIService = require('../services/pythonAIService');
const registrationService = require('../services/registration.service');
const ActivityModel = require('../models/activity.model');
const RegistrationModel = require('../models/registration.model');
const UserModel = require('../models/user.model');

function parseOptionalUser(req) {
  let token = req.cookies && req.cookies.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token && req.body && req.body.token) {
    token = req.body.token;
  }
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'bnhs_default_secret_jwt');
  } catch {
    return null;
  }
}

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

class AIController {
  /**
   * Health Check
   */
  async getHealth(req, res) {
    try {
      const health = await pythonAIService.checkHealth();
      return res.status(200).json(health);
    } catch (error) {
      return res.status(error.status || 503).json({
        status: 'error',
        message: error.message || 'AI service unavailable.',
      });
    }
  }

  /**
   * Advanced Conversational RAG & Chat-to-Register Query Orchestrator
   */
  async queryChat(req, res) {
    try {
      const { query, session_id, user_profile, active_activities, pending_activity_id, confirm_action } = req.body;
      if (!query || !query.trim()) {
        return res.status(400).json({ error: 'Query string is required.' });
      }

      const q = query.trim().toLowerCase();
      const authUser = parseOptionalUser(req);
      const userId = authUser ? (authUser.id || authUser._id) : (user_profile && (user_profile.id || user_profile.user_id));

      let profile = {};
      let userRegistrations = [];
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        try {
          const userDoc = await UserModel.findById(userId);
          if (userDoc) {
            profile = { ...userDoc.toObject(), ...(user_profile || {}) };
          } else {
            profile = user_profile || {};
          }
          userRegistrations = await RegistrationModel.find({ user: userId, status: { $ne: 'cancelled' } });
        } catch {
          profile = user_profile || {};
        }
      } else {
        profile = user_profile || {};
      }

      const registeredActivityIds = new Set(userRegistrations.map(r => r.activity ? r.activity.toString() : ''));

      // ----------------------------------------------------
      // 1. INTENT DETECTION LAYER
      // ----------------------------------------------------

      const isConfirmation = confirm_action === true ||
        /^(yes|confirm|proceed|ok|sure|please do|yeah|yep|confirm registration|book it|register now|sign me up|yes please|do it)$/i.test(q);

      const isCancellation = confirm_action === false ||
        /^(no|cancel|stop|never mind|don't|not now|abort|cancel registration)$/i.test(q);

      const isRegistrationIntent = /register|book|sign up|enroll|join this|attend|reserve/i.test(q) ||
        /\b(first one|1st one|second one|2nd one|third one|3rd one|fourth one|4th one|that one|this one)\b/i.test(q);

      const isRecommendationIntent = /recommend|best (match|for me|activity|pick)|suggest|what should i (do|join|attend|register)|match(es)? my (interests?|profile)|personalized|top pick|suitable for me/i.test(q);

      const isActivitySearchIntent = /(what|which|show|find|list|explore|any)\s+(.*)?(events|activities|walks|camps|workshops|trails|trips)|(can i register|what can i do|activities near|events in|bird watching|this weekend|saturday|sunday|beginner activities|nature trails|workshops|upcoming)/i.test(q);

      const isVolunteerIntent =
        /volunteer/i.test(q) ||
        /volunteering/i.test(q) ||
        /give back/i.test(q) ||
        /which events? need volunteers?/i.test(q) ||
        /what can i volunteer/i.test(q) ||
        /volunteer opportunit/i.test(q) ||
        /conservation work/i.test(q) ||
        /field assistant/i.test(q) ||
        /help out with (bnhs|nature|conservation)/i.test(q);

      // ----------------------------------------------------
      // INTENT A: REGISTRATION CONFIRMATION
      // ----------------------------------------------------
      if (isConfirmation && (pending_activity_id || (active_activities && active_activities.length === 1))) {
        const targetActId = pending_activity_id || (active_activities && active_activities[0]?.id);

        if (!authUser || !authUser.id) {
          return res.status(200).json({
            session_id,
            query,
            intent: 'REGISTRATION_UNAUTHORIZED',
            answer: "⚠️ **Your session has expired or you are not signed in.** Please sign in to your BNHS account to complete your activity booking.",
          });
        }

        if (authUser.role === 'admin' || authUser.role === 'staff') {
          return res.status(200).json({
            session_id,
            query,
            intent: 'REGISTRATION_ROLE_RESTRICTED',
            answer: "⚠️ **Activity registrations are only open to member/user accounts.** Staff and Administrators can manage events and volunteers from the platform Dashboard.",
          });
        }

        const secureUserId = authUser.id || authUser._id;

        try {
          const regResult = await registrationService.registerForActivity(secureUserId, targetActId);
          return res.status(200).json({
            session_id,
            query,
            intent: 'REGISTRATION_CONFIRMATION',
            answer: `🎉 **Registration Confirmed!**\n\nYou are successfully registered for **${regResult.activityTitle}**.\n\n📅 **Date:** ${formatDate(regResult.date)}\n📍 **Location:** ${regResult.location}\n🔖 **Booking Reference:** ${regResult.bookingId}\n\nYour registration has been saved to your Nature Passport and My Activities.`,
            registrationResult: {
              status: 'confirmed',
              bookingId: regResult.bookingId,
              activityId: targetActId,
              activityTitle: regResult.activityTitle,
              date: formatDate(regResult.date),
              location: regResult.location,
            },
          });
        } catch (err) {
          const errMsg = err.message || 'Failed to complete registration';
          return res.status(200).json({
            session_id,
            query,
            intent: 'REGISTRATION_FAILED',
            answer: `⚠️ Could not complete registration: **${errMsg}**`,
            registrationResult: {
              status: 'failed',
              activityId: targetActId,
              message: errMsg,
            },
          });
        }
      }

      // ----------------------------------------------------
      // INTENT B: REGISTRATION CANCELLATION
      // ----------------------------------------------------
      if (isCancellation && pending_activity_id) {
        return res.status(200).json({
          session_id,
          query,
          intent: 'REGISTRATION_CANCEL',
          answer: "No problem! I have cancelled this registration request. Let me know if you would like to explore other BNHS activities, trails, or workshops!",
        });
      }

      // ----------------------------------------------------
      // INTENT C: REGISTRATION REQUEST (Explicit or Contextual)
      // ----------------------------------------------------
      if (isRegistrationIntent) {
        // 1. Resolve activity target from positional reference or name
        let targetActivity = null;

        if (active_activities && Array.isArray(active_activities) && active_activities.length > 0) {
          if (/first|1st|number 1|#1/i.test(q)) {
            targetActivity = active_activities[0];
          } else if (/second|2nd|number 2|#2/i.test(q)) {
            targetActivity = active_activities[1] || active_activities[0];
          } else if (/third|3rd|number 3|#3/i.test(q)) {
            targetActivity = active_activities[2] || active_activities[0];
          } else if (/last|that one|this one/i.test(q)) {
            targetActivity = active_activities[active_activities.length - 1];
          } else {
            // Check active_activities by name match first
            for (const act of active_activities) {
              const actName = (act.name || act.title || '').toLowerCase();
              if (actName && (q.includes(actName) || actName.split(/\s+/).some(w => w.length > 3 && q.includes(w)))) {
                targetActivity = act;
                break;
              }
            }
          }
        }

        // 2. Search MongoDB by keywords if not resolved positionally
        if (!targetActivity) {
          const allDbActivities = await ActivityModel.find({ status: { $ne: 'cancelled' } });
          let bestScore = 0;
          const searchTokens = q.replace(/register|me|for|the|a|an|please|sign|up|book|event|activity|i|want|to/gi, ' ').trim().split(/\s+/).filter(w => w.length > 2);

          for (const act of allDbActivities) {
            const titleStr = (act.name || act.title || '').toLowerCase();
            const idStr = (act.id || '').toLowerCase();
            let matchCount = 0;
            for (const token of searchTokens) {
              if (titleStr.includes(token) || idStr.includes(token)) {
                matchCount += token.length;
              }
            }
            if (matchCount > bestScore) {
              bestScore = matchCount;
              targetActivity = act.toObject();
            }
          }
        }

        // If target activity identified
        if (targetActivity) {
          const actId = targetActivity.id || (targetActivity._id ? targetActivity._id.toString() : '');
          const actTitle = targetActivity.name || targetActivity.title || 'BNHS Activity';
          const actDateStr = formatDate(targetActivity.date);
          const actLoc = targetActivity.location || 'Mumbai';

          // Check if already registered
          if (userId && registeredActivityIds.has(targetActivity._id ? targetActivity._id.toString() : actId)) {
            return res.status(200).json({
              session_id,
              query,
              intent: 'REGISTRATION_ALREADY_REGISTERED',
              answer: `You are already registered for **${actTitle}**! You can view and manage your participation in **My Activities**.`,
              activities: [targetActivity],
            });
          }

          // Check if event is full
          if (targetActivity.status === 'full' || (targetActivity.registeredCount && targetActivity.capacity && targetActivity.registeredCount >= targetActivity.capacity)) {
            return res.status(200).json({
              session_id,
              query,
              intent: 'REGISTRATION_EVENT_FULL',
              answer: `Sorry, **${actTitle}** is currently at full capacity (${targetActivity.capacity}/${targetActivity.capacity}). Would you like me to recommend another similar walk?`,
              activities: [targetActivity],
            });
          }

          // Return pending confirmation payload
          return res.status(200).json({
            session_id,
            query,
            intent: 'REGISTRATION_REQUEST',
            answer: `You're about to register for **${actTitle}** on **${actDateStr}** at **${actLoc}**.\n\nWould you like me to confirm this registration?`,
            pendingRegistration: {
              activityId: actId,
              activityTitle: actTitle,
              date: actDateStr,
              location: actLoc,
              type: targetActivity.type || 'walk',
              difficulty: targetActivity.difficulty || 'moderate',
            },
            activities: [targetActivity],
          });
        }
      }

      // ----------------------------------------------------
      // INTENT D: ACTIVITY SEARCH / RECOMMENDATION
      // ----------------------------------------------------
      // ----------------------------------------------------
      // INTENT D-1: VOLUNTEER_SEARCH
      // ----------------------------------------------------
      if (isVolunteerIntent) {
        let userRole = profile.role || (authUser && authUser.role) || (user_profile && user_profile.role) || 'user';
        let attendedEvents = 0;
        const requiredEvents = 6;

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
          try {
            const db = mongoose.connection.db;
            const userDoc = await UserModel.findById(userId);
            if (userDoc && userDoc.role) userRole = userDoc.role;

            const uid = userId.toString();
            const username = userDoc ? (userDoc.username || '') : '';
            const email = userDoc ? ((userDoc.email || '').toLowerCase()) : '';

            const participations = await db.collection('participation_history').find({
              $or: [
                { user_id: uid },
                { user_id: username },
                { user_id: email },
                { username: username },
                { user_email: email },
              ]
            }).toArray();
            attendedEvents = participations.length;
          } catch {
            // proceed with defaults
          }
        } else if (authUser) {
          // Signed-in user via JWT but no MongoDB ID found
          userRole = authUser.role || userRole;
        }

        const isEligible = userRole === 'staff' || userRole === 'admin' || attendedEvents > 5;

        if (!isEligible && userRole === 'user') {
          const remaining = Math.max(0, requiredEvents - attendedEvents);
          return res.status(200).json({
            session_id,
            query,
            intent: 'VOLUNTEER_INELIGIBLE',
            answer: `🔒 **Volunteering is reserved for experienced BNHS members.**\n\nYou've completed **${attendedEvents} of ${requiredEvents}** required activities. Attend **${remaining} more** ${remaining === 1 ? 'activity' : 'activities'} to unlock volunteering opportunities.\n\nKeep participating in our nature walks and field camps to build your BNHS journey!`,
            eligibility: { attendedEvents, requiredEvents, remaining },
          });
        }

        // Eligible — return static volunteer opportunities list
        const volunteerOpportunities = [
          {
            id: 'vol_bird_ringing',
            title: 'AI & Bird-Ringing Digitisation',
            category: 'Citizen Science & Research',
            type: 'volunteer',
            location: 'Hornbill House, Mumbai / Remote',
            duration: '4 hours / week (Remote/Hybrid)',
            description: 'Support digitisation of historical bird-ringing recovery records and assist scientific researchers with taxonomic metadata.',
            tags: ['data', 'bird-ringing', 'research', 'digitisation'],
            matchPercentage: 94,
            matchReasons: [
              'Combines technology & citizen science',
              'Remote-friendly commitment',
              'Contributes to BNHS archival research',
              'Great for students & tech enthusiasts',
            ],
          },
          {
            id: 'vol_library_archives',
            title: 'Library, Archives & Publications',
            category: 'Conservation Outreach',
            type: 'volunteer',
            location: 'Hornbill House, Mumbai',
            duration: '6 hours / week (On-Site)',
            description: 'Preserve 140+ years of BNHS natural history heritage, digitize rare botanical journals, and support educational publications.',
            tags: ['archives', 'history', 'publishing', 'digitisation'],
            matchPercentage: 91,
            matchReasons: [
              'Preserves 140+ years of BNHS heritage',
              'Ideal for archivists & literature lovers',
              'Works with rare botanical journals',
              'Educational publications outreach',
            ],
          },
          {
            id: 'vol_habitat_restoration',
            title: 'Habitat Restoration & Plantation',
            category: 'On-Ground Conservation',
            type: 'volunteer',
            location: 'CEC Goregaon / Navi Mumbai Mangroves',
            duration: 'Weekend Drives',
            description: 'Participate in native tree sapling plantations, mangrove cleanup drives, and invasive species removal across Mumbai reserves.',
            tags: ['plantation', 'mangroves', 'habitat', 'conservation'],
            matchPercentage: 89,
            matchReasons: [
              'Hands-on field conservation',
              'Native tree sapling plantation',
              'Mangrove cleanup & restoration',
              'Corporate CSR & youth groups welcome',
            ],
          },
          {
            id: 'vol_vulture_monitoring',
            title: 'Vulture Conservation & Nest Monitoring',
            category: 'Species Recovery',
            type: 'volunteer',
            location: 'Pinjore / Raigad Vulture Safe Zones',
            duration: 'Monthly Field Trips',
            description: 'Monitor breeding colonies of critically endangered White-rumped and Indian Vultures and conduct community awareness.',
            tags: ['vulture', 'conservation', 'field', 'species-recovery'],
            matchPercentage: 88,
            matchReasons: [
              'Monitor critically endangered vulture colonies',
              'Community awareness & education',
              'Monthly field trip commitment',
              'Real conservation impact',
            ],
          },
          {
            id: 'vol_wetland_nest_guardian',
            title: 'Indian Skimmer & Wetland Guardian',
            category: 'Riverine Bird Conservation',
            type: 'volunteer',
            location: 'Chambal / Mahanadi River Sites',
            duration: 'Seasonal Sandbar Patrols',
            description: 'Help safeguard ground-nesting Indian Skimmers and Black-bellied Terns from livestock and anthropogenic disturbance.',
            tags: ['skimmer', 'wetland', 'riverine', 'nest-guardian'],
            matchPercentage: 86,
            matchReasons: [
              'Protect ground-nesting Indian Skimmers',
              'Riverine bird conservation',
              'Seasonal patrol commitment',
              'Field observer role',
            ],
          },
        ];

        return res.status(200).json({
          session_id,
          query,
          intent: 'VOLUNTEER_SEARCH',
          answer: `Here are **${volunteerOpportunities.length} BNHS volunteer opportunities** you can apply for. Click **[Volunteer]** on any card to submit your request for admin review:`,
          activities: volunteerOpportunities,
        });
      }

      // ----------------------------------------------------
      // INTENT D-2: ACTIVITY SEARCH & RECOMMENDATION
      // ----------------------------------------------------
      if (isActivitySearchIntent || isRecommendationIntent) {
        // Fetch all active MongoDB activities
        const rawActivities = await ActivityModel.find({ status: { $ne: 'cancelled' } });
        const userInterests = (profile.interests || ['birds', 'wildlife', 'conservation']).map(i => i.toLowerCase());
        const userLocation = (profile.location || 'Mumbai').toLowerCase();
        const userExp = (profile.experience_level || profile.experienceLevel || 'beginner').toLowerCase();

        // Extract query criteria
        const isBird = /bird|avian|flamingo|wetland/i.test(q);
        const isCamp = /camp|overnight|wildlife camp/i.test(q);
        const isMarine = /marine|coastal|sea|tide/i.test(q);
        const isFlora = /tree|plant|botany|flora|forest/i.test(q);
        const isBeginner = /beginner|easy|first time|family|kids/i.test(q);
        const isMumbai = /mumbai/i.test(q);
        const isPune = /pune/i.test(q);

        // Score and rank activities
        const scoredActivities = rawActivities.map((doc) => {
          const act = doc.toObject();
          const actTitle = (act.name || act.title || '').toLowerCase();
          const actLoc = (act.location || '').toLowerCase();
          const actTags = (act.tags || act.interests || []).map(t => t.toLowerCase());
          const actType = (act.type || 'walk').toLowerCase();
          const actDiff = (act.difficulty || 'moderate').toLowerCase();

          let score = 50; // base score
          const reasons = [];

          // Query matching
          if (isBird && (actTags.some(t => t.includes('bird')) || actTitle.includes('bird') || actTitle.includes('flamingo'))) {
            score += 25;
            reasons.push('Matches your interest in birds & birdwatching');
          }
          if (isCamp && actType.includes('camp')) {
            score += 25;
            reasons.push('Overnight field camp experience');
          }
          if (isMarine && (actTags.some(t => t.includes('marine') || t.includes('coastal')) || actLoc.includes('juhu') || actLoc.includes('coast'))) {
            score += 25;
            reasons.push('Marine biodiversity exploration');
          }
          if (isFlora && (actTags.some(t => t.includes('tree') || t.includes('flora') || t.includes('botan')) || actTitle.includes('tree'))) {
            score += 20;
            reasons.push('Urban botanical & flora heritage trail');
          }
          if (isMumbai && (actLoc.includes('mumbai') || actLoc.includes('sgnp') || actLoc.includes('cec'))) {
            score += 15;
            reasons.push('Convenient location in Mumbai region');
          }
          if (isPune && actLoc.includes('pune')) {
            score += 20;
            reasons.push('Located in Pune');
          }
          if (isBeginner && (actDiff.includes('easy') || actDiff.includes('beginner'))) {
            score += 15;
            reasons.push('Beginner friendly trail');
          }

          // User Profile matching
          const interestOverlap = userInterests.filter(ui =>
            actTags.some(t => t.includes(ui) || ui.includes(t)) ||
            actTitle.includes(ui) ||
            (act.category && act.category.toLowerCase().includes(ui)) ||
            (act.description && act.description.toLowerCase().includes(ui))
          );
          if (interestOverlap.length > 0) {
            score += 30;
            if (!reasons.some(r => r.toLowerCase().includes('interest'))) {
              reasons.push(`Matches your interest in ${interestOverlap.slice(0, 2).join(' & ')}`);
            }
          } else if (userInterests.length > 0) {
            reasons.push('Tailored to your naturalist interests');
          }

          if (userLocation && actLoc.includes(userLocation)) {
            if (!reasons.some(r => r.includes('location'))) {
              reasons.push(`Near your preferred location (${profile.location || 'Mumbai'})`);
            }
          }

          if (userExp.includes('beginner') && actDiff.includes('easy')) {
            if (!reasons.some(r => r.includes('Beginner'))) {
              reasons.push('Beginner friendly pace');
            }
          }

          reasons.push('Available for instant registration');

          const finalMatchPct = Math.min(98, Math.max(72, score));
          const isRegistered = registeredActivityIds.has(act._id.toString()) || registeredActivityIds.has(act.id);
          const isFull = act.status === 'full' || (act.capacity && act.registeredCount && act.registeredCount >= act.capacity);

          return {
            id: act.id || act._id.toString(),
            _id: act._id.toString(),
            name: act.name || act.title,
            title: act.title || act.name,
            category: act.category || 'Nature Activities',
            type: act.type || 'walk',
            location: act.location || 'Mumbai',
            date: formatDate(act.date),
            difficulty: act.difficulty || 'moderate',
            duration: act.duration || '2-3 hours',
            description: act.description || '',
            tags: act.tags || act.interests || [],
            capacity: act.capacity || 30,
            registeredCount: act.registeredCount || 0,
            status: act.status || 'upcoming',
            matchPercentage: finalMatchPct,
            matchReasons: reasons.slice(0, 4),
            isRegistered,
            isFull,
          };
        });

        // Sort by match score descending
        scoredActivities.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
        const topActivities = scoredActivities.slice(0, 4);

        const introText = isRecommendationIntent
          ? `Based on your naturalist profile and interests, here are my **top recommended BNHS activities** for you:`
          : `Here are **${topActivities.length} upcoming BNHS activities** available for registration matching your query:`;

        return res.status(200).json({
          session_id,
          query,
          intent: isRecommendationIntent ? 'ACTIVITY_RECOMMENDATION' : 'ACTIVITY_SEARCH',
          answer: introText,
          activities: topActivities,
        });
      }

      // ----------------------------------------------------
      // INTENT E: GENERAL KNOWLEDGE & RAG QUERY (Default)
      // ----------------------------------------------------
      const ragResult = await pythonAIService.askRAG(query, session_id);
      return res.status(200).json({
        session_id: ragResult.session_id || session_id,
        query: ragResult.query || query,
        rewritten_query: ragResult.rewritten_query,
        intent: 'KNOWLEDGE_QUERY',
        answer: ragResult.answer || "I could not find sufficient information about this in the BNHS knowledge base.",
        sources: ragResult.sources || [],
      });

    } catch (error) {
      console.error('Chat orchestrator error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to process chat query.',
      });
    }
  }

  /**
   * Get Chat Session History
   */
  async getChatHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const history = await pythonAIService.getChatHistory(sessionId);
      return res.status(200).json(history);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch chat history.',
      });
    }
  }

  /**
   * Clear Chat Session
   */
  async clearChatHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const result = await pythonAIService.clearChatHistory(sessionId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to clear chat history.',
      });
    }
  }

  /**
   * Personalized Recommendations
   */
  async getRecommendations(req, res) {
    try {
      const payload = req.body || {};
      const topN = parseInt(req.query.top_n || '5', 10);
      const recommendations = await pythonAIService.getRecommendations(payload, topN);
      return res.status(200).json(recommendations);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch activity recommendations.',
      });
    }
  }

  /**
   * User Engagement Analysis
   */
  async getUserEngagement(req, res) {
    try {
      const { userId } = req.params;
      const engagement = await pythonAIService.getUserEngagement(userId);
      return res.status(200).json(engagement);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch user engagement report.',
      });
    }
  }

  /**
   * Platform Aggregate Analytics
   */
  async getPlatformAnalytics(req, res) {
    try {
      const analytics = await pythonAIService.getPlatformAnalytics();
      return res.status(200).json(analytics);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch platform analytics.',
      });
    }
  }

  /**
   * Activities Catalog
   */
  async getActivities(req, res) {
    try {
      const activities = await pythonAIService.getActivities(req.query);
      return res.status(200).json(activities);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch activities catalog.',
      });
    }
  }

  /**
   * Activity Detail by ID
   */
  async getActivityById(req, res) {
    try {
      const { id } = req.params;
      
      // 1. Try Python AI service
      try {
        const activity = await pythonAIService.getActivityById(id);
        if (activity && (activity.id || activity.name || activity.title)) {
          return res.status(200).json(activity);
        }
      } catch (err) {
        // Fallback to MongoDB ActivityModel directly
      }

      // 2. Query MongoDB ActivityModel
      const mongoose = require('mongoose');
      const queryConditions = [
        { id: id },
        { name: id },
        { title: id },
      ];
      if (mongoose.Types.ObjectId.isValid(id)) {
        queryConditions.push({ _id: id });
      }

      const doc = await ActivityModel.findOne({ $or: queryConditions });
      if (doc) {
        const activityObj = doc.toObject();
        return res.status(200).json({
          id: activityObj.id || activityObj._id.toString(),
          name: activityObj.name || activityObj.title,
          title: activityObj.title || activityObj.name,
          category: activityObj.category || activityObj.type || 'walk',
          type: activityObj.type || 'walk',
          location: activityObj.location || 'Mumbai',
          difficulty: activityObj.difficulty || 'moderate',
          duration: activityObj.duration || '2-3 hours',
          description: activityObj.description || '',
          tags: activityObj.tags || activityObj.interests || [],
          interests: activityObj.interests || activityObj.tags || [],
          capacity: activityObj.capacity || 30,
          registeredCount: activityObj.registeredCount || 0,
          leader: activityObj.leader || null,
          status: activityObj.status || 'upcoming',
          date: activityObj.date || null,
        });
      }

      return res.status(404).json({ error: `Activity '${id}' not found.` });
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch activity detail.',
      });
    }
  }

  /**
   * User Profile Operations
   */
  async getUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await pythonAIService.getUser(userId);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch user profile.',
      });
    }
  }

  async createUser(req, res) {
    try {
      const user = await pythonAIService.createUser(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to create user profile.',
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await pythonAIService.updateUser(userId, req.body);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to update user profile.',
      });
    }
  }

  /**
   * Activity Registrations
   */
  async getUserRegistrations(req, res) {
    try {
      const { userId } = req.params;
      const registrations = await pythonAIService.getUserRegistrations(userId);
      return res.status(200).json(registrations);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch user registrations.',
      });
    }
  }

  async createRegistration(req, res) {
    try {
      const authUser = parseOptionalUser(req);
      if (!authUser || !authUser.id) {
        return res.status(401).json({ message: 'Unauthorized. Please sign in.' });
      }

      if (authUser.role === 'admin' || authUser.role === 'staff') {
        return res.status(403).json({ message: 'Staff and Admin accounts cannot register for activities.' });
      }

      const userId = authUser.id || authUser._id;
      const activityId = req.body.activity_id || req.body.activityId;

      if (!activityId) {
        return res.status(400).json({ message: 'Activity ID is required.' });
      }

      const result = await registrationService.registerForActivity(userId, activityId);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(error.status || 400).json({
        message: error.message || 'Failed to create activity registration.',
      });
    }
  }

  /**
   * Participation History
   */
  async getUserParticipation(req, res) {
    try {
      const { userId } = req.params;
      const participation = await pythonAIService.getUserParticipation(userId);
      return res.status(200).json(participation);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch user participation history.',
      });
    }
  }

  async recordParticipation(req, res) {
    try {
      const { userId } = req.params;
      const participation = await pythonAIService.recordParticipation(userId, req.body);
      return res.status(200).json(participation);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to record user participation.',
      });
    }
  }
}

module.exports = new AIController();
