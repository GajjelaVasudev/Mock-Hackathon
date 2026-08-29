const mongoose = require('mongoose');
const UserModel = require('../models/user.model');
const ActivityModel = require('../models/activity.model');
const RegistrationModel = require('../models/registration.model');
const EventLeadInvitation = require('../models/eventLeadInvitation.model');
const imageSearchService = require('../services/imageSearch.service');

// Helper to get raw MongoDB db handle for collections
function getDb() {
    return mongoose.connection.db;
}

function formatDisplayName(user) {
    if (!user) return 'BNHS Member';
    const raw = user.name || user.fullName || user.username || 'BNHS Member';
    if (raw.includes('_') || raw.includes('.')) {
        return raw.split(/[_.]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return raw;
}

// 1. GET PLATFORM OVERVIEW METRICS
async function getOverview(req, res) {
    try {
        const db = getDb();
        const [totalUsers, activeUsers, staffCount, totalEvents, totalRegistrations, totalParticipations] = await Promise.all([
            UserModel.countDocuments(),
            UserModel.countDocuments({ isActive: true }),
            UserModel.countDocuments({ role: { $in: ['staff', 'admin'] } }),
            ActivityModel.countDocuments(),
            db.collection('registrations').countDocuments(),
            db.collection('participation_history').countDocuments()
        ]);

        // Calculate eligible leaders count (>5 attended events)
        const participations = await db.collection('participation_history').find().toArray();
        const userAttendMap = {};
        for (const p of participations) {
            const uid = p.user_id ? p.user_id.toString() : '';
            if (uid) userAttendMap[uid] = (userAttendMap[uid] || 0) + 1;
        }

        const users = await UserModel.find().select('_id username email');
        let eligibleLeadersCount = 0;
        for (const u of users) {
            const count = (userAttendMap[u._id.toString()] || 0) +
                          (userAttendMap[u.username] || 0) +
                          (userAttendMap[u.email] || 0);
            if (count > 5) eligibleLeadersCount++;
        }

        res.json({
            totalUsers,
            activeUsers,
            staffCount,
            totalEvents,
            totalRegistrations,
            totalParticipations,
            eligibleLeadersCount
        });
    } catch (err) {
        console.error('getOverview error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 2. GET ELIGIBLE EVENT LEADERS (Attended > 5 events)
async function getEligibleLeaders(req, res) {
    try {
        const db = getDb();
        const participations = await db.collection('participation_history').find().toArray();
        const userAttendMap = {};
        const userHistoryMap = {};

        for (const p of participations) {
            const uid = p.user_id ? p.user_id.toString() : '';
            if (uid) {
                userAttendMap[uid] = (userAttendMap[uid] || 0) + 1;
                if (!userHistoryMap[uid]) userHistoryMap[uid] = [];
                userHistoryMap[uid].push(p.activity_name || p.activity_id);
            }
        }

        const users = await UserModel.find().select('-password');
        const eligibleLeaders = [];

        for (const u of users) {
            const uid = u._id.toString();
            const count = (userAttendMap[uid] || 0) +
                          (userAttendMap[u.username] || 0) +
                          (userAttendMap[u.email] || 0);

            const pastActivities = [
                ...(userHistoryMap[uid] || []),
                ...(userHistoryMap[u.username] || []),
                ...(userHistoryMap[u.email] || [])
            ];

            if (count > 5) {
                // Check if user already has an active invitation
                const activeInv = await EventLeadInvitation.findOne({
                    $or: [{ userId: uid }, { userName: u.username }, { userEmail: u.email }],
                    status: 'pending'
                });

                eligibleLeaders.push({
                    userId: uid,
                    id: uid,
                    name: formatDisplayName(u),
                    username: u.username,
                    email: u.email,
                    role: u.role || 'user',
                    location: u.location || 'Mumbai',
                    interests: u.interests || ['birds', 'wetlands', 'conservation'],
                    experienceLevel: u.experienceLevel || 'intermediate',
                    attendedEvents: count,
                    previous_activities: pastActivities,
                    hasPendingInvitation: !!activeInv,
                    pendingInvitationId: activeInv ? activeInv._id : null
                });
            }
        }

        // Sort by attended events descending
        eligibleLeaders.sort((a, b) => b.attendedEvents - a.attendedEvents);

        res.json({
            count: eligibleLeaders.length,
            eligibleLeaders
        });
    } catch (err) {
        console.error('getEligibleLeaders error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 3. SEND EVENT LEAD INVITATION
async function sendEventLeadInvitation(req, res) {
    try {
        const { userId, eventId, message } = req.body;
        if (!userId || !eventId) {
            return res.status(400).json({ message: 'userId and eventId are required' });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the event in MongoDB
        const event = await ActivityModel.findOne({
            $or: [{ _id: eventId.length === 24 ? eventId : null }, { id: eventId }]
        });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const invMessage = message || `We'd like to invite you to lead "${event.name || event.title}". Please confirm your availability.`;

        const invitation = await EventLeadInvitation.create({
            userId: user._id.toString(),
            userName: user.name || user.username,
            userEmail: user.email,
            eventId: event.id || event._id.toString(),
            eventTitle: event.name || event.title,
            eventLocation: event.location,
            eventDate: event.date ? new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Upcoming',
            invitedBy: req.user.username || 'BNHS Staff',
            message: invMessage,
            status: 'pending'
        });

        res.status(201).json({
            message: 'Invitation sent successfully',
            invitation
        });
    } catch (err) {
        console.error('sendEventLeadInvitation error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 4. GET ALL EVENT LEAD INVITATIONS
async function getAllInvitations(req, res) {
    try {
        const invitations = await EventLeadInvitation.find().sort({ createdAt: -1 });
        res.json({
            count: invitations.length,
            invitations
        });
    } catch (err) {
        console.error('getAllInvitations error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 5. GET ALL USERS (with attendance, registration count & filters)
async function getUsersList(req, res) {
    try {
        const db = getDb();
        const { search, role, location } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (location) filter.location = location;
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await UserModel.find(filter).select('-password').sort({ createdAt: -1 });

        // Aggregate attendance and registration counts
        const participations = await db.collection('participation_history').find().toArray();
        const registrations = await db.collection('registrations').find().toArray();

        const attendMap = {};
        for (const p of participations) {
            const uid = p.user_id ? p.user_id.toString() : '';
            if (uid) attendMap[uid] = (attendMap[uid] || 0) + 1;
        }

        const regMap = {};
        for (const r of registrations) {
            const uid = r.user_id || (r.user ? r.user.toString() : '');
            if (uid) regMap[uid] = (regMap[uid] || 0) + 1;
        }

        const enrichedUsers = users.map(u => {
            const uid = u._id.toString();
            const attendedCount = (attendMap[uid] || 0) + (attendMap[u.username] || 0) + (attendMap[u.email] || 0);
            const registeredCount = (regMap[uid] || 0) + (regMap[u.username] || 0) + (regMap[u.email] || 0);

            // Compute an engagement score (0-100)
            const engagementScore = Math.min(100, Math.round(attendedCount * 14 + registeredCount * 5 + (u.badges?.length || 0) * 8 + 10));

            return {
                id: uid,
                _id: uid,
                name: formatDisplayName(u),
                username: u.username,
                email: u.email,
                role: u.role || 'user',
                location: u.location || 'Mumbai',
                interests: u.interests || [],
                isActive: u.isActive !== false,
                isEmailVerified: u.isEmailVerified || false,
                attendedEvents: attendedCount,
                registeredEvents: registeredCount,
                engagementScore,
                isEligibleLeader: attendedCount > 5,
                createdAt: u.createdAt
            };
        });

        res.json({
            count: enrichedUsers.length,
            users: enrichedUsers
        });
    } catch (err) {
        console.error('getUsersList error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 6. GET STAFF MEMBERS
async function getStaffList(req, res) {
    try {
        const staffUsers = await UserModel.find({ role: { $in: ['staff', 'admin'] } }).select('-password');
        const activities = await ActivityModel.find();

        const staffList = staffUsers.map(s => {
            const managed = activities.filter(a => a.createdBy?.toString() === s._id.toString() || a.createdBy === s.username).length;
            const led = activities.filter(a => a.leader === s.name || a.leader === s.username).length;

            return {
                id: s._id.toString(),
                name: formatDisplayName(s),
                username: s.username,
                email: s.email,
                role: s.role,
                eventsManaged: managed,
                eventsLed: led,
                status: s.isActive !== false ? 'Active' : 'Inactive'
            };
        });

        res.json({
            count: staffList.length,
            staff: staffList
        });
    } catch (err) {
        console.error('getStaffList error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 7. GET ALL EVENTS FOR STAFF
async function getEventsList(req, res) {
    try {
        const db = getDb();
        const events = await ActivityModel.find().sort({ date: 1 });
        const registrations = await db.collection('registrations').find().toArray();

        const regCountMap = {};
        for (const r of registrations) {
            const aid = r.activity_id || (r.activity ? r.activity.toString() : '');
            if (aid) regCountMap[aid] = (regCountMap[aid] || 0) + 1;
        }

        const enrichedEvents = events.map(e => {
            const aid = e.id || e._id.toString();
            const regCount = regCountMap[aid] || regCountMap[e._id.toString()] || regCountMap[e.name] || 0;

            return {
                id: aid,
                _id: e._id.toString(),
                title: e.title || e.name,
                name: e.name || e.title,
                description: e.description,
                type: e.type,
                tags: e.tags?.length ? e.tags : (e.interests || []),
                interests: e.interests || [],
                date: e.date,
                location: e.location,
                capacity: e.capacity || 30,
                registeredCount: regCount,
                leader: e.leader || null,
                status: e.status || 'upcoming',
                difficulty: e.difficulty || 'moderate',
                duration: e.duration || '2-3 hours',
                image: e.image || null,
                imageUrl: e.imageUrl || (e.image?.url) || null
            };
        });

        res.json({
            count: enrichedEvents.length,
            events: enrichedEvents
        });
    } catch (err) {
        console.error('getEventsList error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 8. CREATE EVENT
async function createEvent(req, res) {
    try {
        const { title, name, description, type, tags, interests, date, location, capacity, status, difficulty, duration, image, imageUrl } = req.body;

        const eventTitle = title || name;
        if (!eventTitle || !description || !type || !location) {
            return res.status(400).json({ message: 'Title, description, type, and location are required.' });
        }

        const eventTags = tags && tags.length ? tags : (interests || ['nature', 'conservation']);
        const eventDate = date ? new Date(date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Standardize image object
        let finalImage = null;
        if (image && typeof image === 'object' && image.url) {
            finalImage = {
                url: image.url,
                smallUrl: image.smallUrl || image.url,
                source: image.source || 'pexels',
                photographer: image.photographer || 'Pexels Contributor',
                attributionUrl: image.attributionUrl || 'https://www.pexels.com',
                alt: image.alt || eventTitle
            };
        } else if (imageUrl && typeof imageUrl === 'string') {
            finalImage = {
                url: imageUrl,
                smallUrl: imageUrl,
                source: 'custom',
                photographer: 'BNHS',
                attributionUrl: '',
                alt: eventTitle
            };
        }

        // If no image was explicitly selected, automatically find and assign the best matching image
        if (!finalImage) {
            try {
                const autoImg = await imageSearchService.findBestEventImage({
                    title: eventTitle,
                    description,
                    type,
                    tags: eventTags,
                    location
                });
                if (autoImg && autoImg.bestImage) {
                    finalImage = autoImg.bestImage;
                }
            } catch (imgErr) {
                console.warn('Auto image search during createEvent failed:', imgErr.message);
            }
        }

        const newEvent = await ActivityModel.create({
            title: eventTitle,
            name: eventTitle,
            description,
            type: type.toLowerCase(),
            tags: eventTags,
            interests: eventTags,
            date: eventDate,
            location,
            capacity: Number(capacity) || 30,
            status: status || 'upcoming',
            difficulty: difficulty || 'moderate',
            duration: duration || '2-3 hours',
            image: finalImage,
            imageUrl: finalImage ? finalImage.url : null,
            createdBy: req.user.id
        });

        res.status(201).json({
            message: 'Event created successfully',
            event: newEvent
        });
    } catch (err) {
        console.error('createEvent error:', err);
        res.status(500).json({ message: err.message || 'Failed to create event' });
    }
}

// 9. UPDATE EVENT
async function updateEvent(req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.title && !updateData.name) updateData.name = updateData.title;
        if (updateData.name && !updateData.title) updateData.title = updateData.name;
        if (updateData.tags && (!updateData.interests || !updateData.interests.length)) updateData.interests = updateData.tags;
        if (updateData.date) updateData.date = new Date(updateData.date);

        if (updateData.image && typeof updateData.image === 'object') {
            updateData.imageUrl = updateData.image.url;
        }

        const updated = await ActivityModel.findOneAndUpdate(
            { $or: [{ _id: id.length === 24 ? id : null }, { id }] },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(404).json({ message: 'Event not found' });

        res.json({
            message: 'Event updated successfully',
            event: updated
        });
    } catch (err) {
        console.error('updateEvent error:', err);
        res.status(500).json({ message: err.message || 'Failed to update event' });
    }
}

// 9b. SEARCH EVENT IMAGES VIA PEXELS API (Single Best Match)
async function searchEventImage(req, res) {
    try {
        const { title, name, description, type, tags, location, excludeUrls = [] } = req.body;
        const result = await imageSearchService.findBestEventImage({
            title: title || name,
            description,
            type,
            tags,
            location
        }, { excludeUrls });

        res.json({
            success: true,
            image: result.bestImage,
            query: result.query,
            automaticallySelected: true,
            relevanceScore: result.relevanceScore
        });
    } catch (err) {
        console.error('searchEventImage error:', err);
        res.status(500).json({ message: 'Failed to search event imagery' });
    }
}

// 9c. BACKFILL MISSING EVENT IMAGES MIGRATION
async function backfillEventImages(req, res) {
    try {
        const activities = await ActivityModel.find({
            $or: [
                { image: { $exists: false } },
                { image: null },
                { 'image.url': { $exists: false } },
                { 'image.url': null },
                { 'image.url': '' }
            ]
        });

        const updated = [];
        for (const act of activities) {
            if (act.imageUrl && typeof act.imageUrl === 'string' && act.imageUrl.startsWith('http')) {
                act.image = {
                    url: act.imageUrl,
                    smallUrl: act.imageUrl,
                    source: 'custom',
                    photographer: 'BNHS',
                    attributionUrl: '',
                    alt: act.title || act.name || 'BNHS Activity'
                };
                await act.save();
                updated.push({ id: act.id || act._id, title: act.title || act.name, image: act.image });
                continue;
            }

            const result = await imageSearchService.findBestEventImage({
                title: act.title || act.name,
                description: act.description,
                type: act.type,
                tags: act.tags?.length ? act.tags : (act.interests || []),
                location: act.location
            });

            if (result.bestImage) {
                act.image = result.bestImage;
                act.imageUrl = result.bestImage.url;
                await act.save();
                updated.push({ id: act.id || act._id, title: act.title || act.name, image: act.image });
            }
        }

        res.json({
            success: true,
            message: `Successfully backfilled ${updated.length} activities with automatic event images.`,
            count: updated.length,
            activities: updated
        });
    } catch (err) {
        console.error('backfillEventImages error:', err);
        res.status(500).json({ message: err.message || 'Failed to backfill event images' });
    }
}

// 10. CANCEL / DELETE EVENT
async function deleteEvent(req, res) {
    try {
        const { id } = req.params;
        const cancelled = await ActivityModel.findOneAndUpdate(
            { $or: [{ _id: id.length === 24 ? id : null }, { id }] },
            { status: 'cancelled' },
            { new: true }
        );

        if (!cancelled) return res.status(404).json({ message: 'Event not found' });

        res.json({
            message: 'Event cancelled successfully',
            event: cancelled
        });
    } catch (err) {
        console.error('deleteEvent error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 11. GET EVENT PARTICIPANTS
async function getEventParticipants(req, res) {
    try {
        const { id } = req.router ? req.params : req.params;
        const db = getDb();

        const registrations = await db.collection('registrations').find({
            $or: [{ activity_id: id }, { activity: id }]
        }).toArray();

        // Enrich with user information
        const userIds = registrations.map(r => r.user_id || (r.user ? r.user.toString() : ''));
        const users = await UserModel.find({
            $or: [{ _id: { $in: userIds.filter(x => x.length === 24) } }, { username: { $in: userIds } }, { email: { $in: userIds } }]
        }).select('name username email location');

        const userMap = {};
        for (const u of users) {
            userMap[u._id.toString()] = u;
            userMap[u.username] = u;
            userMap[u.email] = u;
        }

        const participants = registrations.map(r => {
            const uid = r.user_id || (r.user ? r.user.toString() : '');
            const matchedUser = userMap[uid];
            return {
                id: r._id.toString(),
                name: matchedUser ? (matchedUser.name || matchedUser.username) : (r.user_name || uid),
                email: matchedUser ? matchedUser.email : (r.user_email || 'N/A'),
                registrationStatus: r.status || 'registered',
                registeredAt: r.createdAt || r.registeredAt || new Date()
            };
        });

        res.json({
            count: participants.length,
            participants
        });
    } catch (err) {
        console.error('getEventParticipants error:', err);
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getOverview,
    getEligibleLeaders,
    sendEventLeadInvitation,
    getAllInvitations,
    getUsersList,
    getStaffList,
    getEventsList,
    createEvent,
    updateEvent,
    searchEventImage,
    backfillEventImages,
    deleteEvent,
    getEventParticipants
};
