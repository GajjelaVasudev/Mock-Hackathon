const mongoose = require('mongoose');
const UserModel = require('../models/user.model');
const ActivityModel = require('../models/activity.model');
const VolunteerRequestModel = require('../models/volunteerRequest.model');

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

/**
 * Reusable helper to calculate real attendance records from MongoDB participation_history.
 */
async function calculateUserAttendance(user) {
    if (!user) return 0;
    const db = getDb();
    const uid = user._id ? user._id.toString() : (user.id || '');
    const username = user.username || '';
    const email = user.email ? user.email.toLowerCase() : '';

    const participations = await db.collection('participation_history').find({
        $or: [
            { user_id: uid },
            { user_id: username },
            { user_id: email },
            { username: username },
            { user_email: email }
        ]
    }).toArray();

    return participations.length;
}

/**
 * Calculates volunteer eligibility strictly based on attendedEvents > 5.
 */
async function getVolunteerEligibility(user) {
    const role = user.role || 'user';
    const attendedEvents = await calculateUserAttendance(user);
    const requiredEvents = 6;
    // Staff and Admin are bypass-authorized; regular users require > 5 attended activities
    const eligible = role === 'staff' || role === 'admin' || attendedEvents > 5;
    const remainingEvents = Math.max(0, requiredEvents - attendedEvents);

    return {
        userId: user._id ? user._id.toString() : user.id,
        userName: formatDisplayName(user),
        username: user.username,
        email: user.email,
        role,
        attendedEvents,
        requiredEvents,
        eligible,
        remainingEvents
    };
}

async function findUserByReq(req) {
    if (!req.user) return null;
    const uid = req.user.id || req.user._id || '';
    if (mongoose.Types.ObjectId.isValid(uid) && uid.length === 24) {
        const byId = await UserModel.findById(uid);
        if (byId) return byId;
    }
    const username = req.user.username || uid;
    const email = req.user.email || uid;
    return await UserModel.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    });
}

// 1. GET /api/user/volunteer/eligibility
async function getUserEligibility(req, res) {
    try {
        const user = await findUserByReq(req);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const eligibility = await getVolunteerEligibility(user);
        res.json(eligibility);
    } catch (err) {
        console.error('getUserEligibility error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 2. GET /api/user/volunteer/opportunities
async function getVolunteerOpportunities(req, res) {
    try {
        const defaultOpportunities = [
            {
                id: 'vol_bird_ringing',
                title: 'AI & Bird-Ringing Digitisation',
                theme: 'Citizen Science & Research',
                role: 'Archive & Quality Assistant',
                skills: ['Data verification', 'Bird ID basics', 'Tech-savvy'],
                commitment: '4 hours / week (Remote/Hybrid)',
                location: 'Hornbill House, Mumbai / Remote',
                idealFor: 'Students, tech enthusiasts, zoology researchers',
                activityId: 'bnhs_bird_ringing_digitisation',
                description: 'Support digitisation of historical bird-ringing recovery records and assist scientific researchers with taxonomic metadata.'
            },
            {
                id: 'vol_library_archives',
                title: 'Library, Archives & Publications',
                theme: 'Conservation Outreach',
                role: 'Archival Researcher',
                skills: ['Cataloguing', 'Historical research', 'Content editing'],
                commitment: '6 hours / week (On-Site)',
                location: 'Hornbill House, Mumbai',
                idealFor: 'Literature lovers, archivists, history buffs',
                activityId: 'bnhs_seva_volunteer_program',
                description: 'Preserve 140+ years of BNHS natural history heritage, digitize rare botanical journals, and support educational publications.'
            },
            {
                id: 'vol_habitat_restoration',
                title: 'Habitat Restoration & Plantation',
                theme: 'On-Ground Conservation',
                role: 'Field Conservationist',
                skills: ['Physical fitness', 'Plantation basics', 'Teamwork'],
                commitment: 'Weekend Drives',
                location: 'CEC Goregaon / Navi Mumbai Mangroves',
                idealFor: 'Corporate CSR, youth groups, active volunteers',
                activityId: 'bnhs_corporate_csr_plantation',
                description: 'Participate in native tree sapling plantations, mangrove cleanup drives, and invasive species removal across Mumbai reserves.'
            },
            {
                id: 'vol_vulture_monitoring',
                title: 'Vulture Conservation & Nest Monitoring',
                theme: 'Species Recovery',
                role: 'Field Observer & Community Liaison',
                skills: ['Bird ID', 'Field notes', 'Community communication'],
                commitment: 'Monthly Field Trips',
                location: 'Pinjore / Raigad Vulture Safe Zones',
                idealFor: 'Avian enthusiasts, conservationists, researchers',
                activityId: 'bnhs_vulture_safe_zone_survey',
                description: 'Monitor breeding colonies of critically endangered White-rumped and Indian Vultures and conduct community awareness.'
            },
            {
                id: 'vol_wetland_nest_guardian',
                title: 'Indian Skimmer & Wetland Guardian',
                theme: 'Riverine Bird Conservation',
                role: 'Nest Guardian Assistant',
                skills: ['Observation', 'Patience', 'Data logging'],
                commitment: 'Seasonal Sandbar Patrols',
                location: 'Chambal / Mahanadi River Sites',
                idealFor: 'Wetland researchers, birders, conservation volunteers',
                activityId: 'bnhs_chambal_skimmer_survey',
                description: 'Help safeguard ground-nesting Indian Skimmers and Black-bellied Terns from livestock and anthropogenic disturbance.'
            }
        ];

        res.json({
            count: defaultOpportunities.length,
            opportunities: defaultOpportunities
        });
    } catch (err) {
        console.error('getVolunteerOpportunities error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 3. POST /api/user/volunteer/apply (User or Staff applies)
async function applyVolunteer(req, res) {
    try {
        const user = await findUserByReq(req);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { opportunityId, opportunityTitle, opportunityLocation, opportunityTheme, message } = req.body;
        if (!opportunityId || !opportunityTitle) {
            return res.status(400).json({ message: 'Opportunity ID and Title are required.' });
        }

        const eligibility = await getVolunteerEligibility(user);

        // Enforce > 5 rule for regular users
        if (user.role === 'user' && !eligibility.eligible) {
            return res.status(403).json({
                message: `You need to attend ${eligibility.remainingEvents} more activity before you can apply for volunteering.`,
                eligibility
            });
        }

        // Check if an application for this opportunity already exists
        const uid = user._id ? user._id.toString() : user.id;
        const existing = await VolunteerRequestModel.findOne({
            $or: [
                { userId: uid, opportunityId, status: { $in: ['pending', 'accepted'] } },
                { userEmail: user.email, opportunityId, status: { $in: ['pending', 'accepted'] } }
            ]
        });

        if (existing) {
            return res.status(400).json({
                message: `You already have an active application (${existing.status}) for this opportunity.`,
                application: existing
            });
        }

        const volunteerReq = await VolunteerRequestModel.create({
            userId: uid,
            userName: formatDisplayName(user),
            userEmail: user.email,
            userRole: user.role || 'user',
            opportunityId,
            opportunityTitle,
            opportunityLocation: opportunityLocation || 'BNHS Mumbai',
            opportunityTheme: opportunityTheme || 'Conservation',
            message: message || 'I would like to contribute as a volunteer for this opportunity.',
            type: 'user_application',
            attendedEvents: eligibility.attendedEvents,
            status: 'pending'
        });

        res.status(201).json({
            message: 'Volunteer application submitted successfully for Admin review.',
            application: volunteerReq
        });
    } catch (err) {
        console.error('applyVolunteer error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 4. GET /api/user/volunteer/my-requests
async function getMyVolunteerRequests(req, res) {
    try {
        const user = await findUserByReq(req);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const uid = user._id ? user._id.toString() : user.id;

        const requests = await VolunteerRequestModel.find({
            $or: [
                { userId: uid },
                { userEmail: user.email.toLowerCase() },
                { userName: user.username }
            ]
        }).sort({ createdAt: -1 });

        res.json({
            count: requests.length,
            requests
        });
    } catch (err) {
        console.error('getMyVolunteerRequests error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 5. POST /api/user/volunteer/requests/:id/accept (User accepts Admin Request)
async function userAcceptVolunteerRequest(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const request = await VolunteerRequestModel.findById(id);
        if (!request) return res.status(404).json({ message: 'Volunteer request not found' });

        if (request.userId !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to accept this request.' });
        }

        request.status = 'accepted';
        request.respondedAt = new Date();
        await request.save();

        res.json({
            message: 'Volunteer invitation accepted successfully.',
            request
        });
    } catch (err) {
        console.error('userAcceptVolunteerRequest error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 6. POST /api/user/volunteer/requests/:id/decline (User declines Admin Request)
async function userDeclineVolunteerRequest(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const request = await VolunteerRequestModel.findById(id);
        if (!request) return res.status(404).json({ message: 'Volunteer request not found' });

        if (request.userId !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to decline this request.' });
        }

        request.status = 'declined';
        request.respondedAt = new Date();
        await request.save();

        res.json({
            message: 'Volunteer invitation declined.',
            request
        });
    } catch (err) {
        console.error('userDeclineVolunteerRequest error:', err);
        res.status(500).json({ message: err.message });
    }
}

// =========================================================================
// ADMIN ENDPOINTS
// =========================================================================

// 7. GET /api/admin/volunteer/eligible-users (Admin only: strictly attendedEvents > 5)
async function getAdminEligibleUsers(req, res) {
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

        const users = await UserModel.find({ role: 'user' }).select('-password');
        const eligibleUsers = [];

        for (const u of users) {
            const uid = u._id.toString();
            const count = (userAttendMap[uid] || 0) +
                          (userAttendMap[u.username] || 0) +
                          (userAttendMap[u.email] || 0);

            // Strictly attendedEvents > 5
            if (count > 5) {
                const pendingReq = await VolunteerRequestModel.findOne({
                    userId: uid,
                    type: 'admin_request',
                    status: 'pending'
                });

                eligibleUsers.push({
                    id: uid,
                    userId: uid,
                    name: formatDisplayName(u),
                    username: u.username,
                    email: u.email,
                    role: u.role || 'user',
                    location: u.location || 'Mumbai',
                    interests: u.interests || ['birds', 'wetlands', 'conservation'],
                    attendedEvents: count,
                    eligible: true,
                    hasPendingRequest: !!pendingReq,
                    pendingRequestId: pendingReq ? pendingReq._id : null
                });
            }
        }

        eligibleUsers.sort((a, b) => b.attendedEvents - a.attendedEvents);

        res.json({
            count: eligibleUsers.length,
            eligibleUsers
        });
    } catch (err) {
        console.error('getAdminEligibleUsers error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 8. GET /api/admin/volunteer/requests (Admin reviews all user applications & requests)
async function getAdminVolunteerRequests(req, res) {
    try {
        const requests = await VolunteerRequestModel.find().sort({ createdAt: -1 });
        res.json({
            count: requests.length,
            requests
        });
    } catch (err) {
        console.error('getAdminVolunteerRequests error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 9. POST /api/admin/volunteer/requests (Admin sends "Request for Volunteering" to eligible member)
async function adminSendVolunteerRequest(req, res) {
    try {
        const { userId, opportunityId, opportunityTitle, opportunityLocation, message } = req.body;
        if (!userId || !opportunityId || !opportunityTitle) {
            return res.status(400).json({ message: 'User ID, Opportunity ID, and Opportunity Title are required.' });
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: 'Target user not found' });

        const eligibility = await getVolunteerEligibility(user);
        if (!eligibility.eligible) {
            return res.status(400).json({
                message: `User has only attended ${eligibility.attendedEvents} activities. Minimum 6 required to request volunteering.`,
                eligibility
            });
        }

        const requestMessage = message || `You have demonstrated strong participation in BNHS activities (${eligibility.attendedEvents} events attended). We would like to invite you to contribute as a volunteer.`;

        const newRequest = await VolunteerRequestModel.create({
            userId: user._id.toString(),
            userName: formatDisplayName(user),
            userEmail: user.email,
            userRole: user.role || 'user',
            opportunityId,
            opportunityTitle,
            opportunityLocation: opportunityLocation || 'BNHS Mumbai',
            opportunityTheme: 'Conservation & Research',
            message: requestMessage,
            type: 'admin_request',
            invitedBy: req.user.username || 'BNHS Admin',
            attendedEvents: eligibility.attendedEvents,
            status: 'pending'
        });

        res.status(201).json({
            message: `Volunteering request sent successfully to ${formatDisplayName(user)}.`,
            request: newRequest
        });
    } catch (err) {
        console.error('adminSendVolunteerRequest error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 10. POST /api/admin/volunteer/requests/:id/accept (Admin accepts user application)
async function adminAcceptVolunteerRequest(req, res) {
    try {
        const { id } = req.params;
        const request = await VolunteerRequestModel.findById(id);
        if (!request) return res.status(404).json({ message: 'Volunteer application not found' });

        request.status = 'accepted';
        request.respondedAt = new Date();
        await request.save();

        res.json({
            message: `Volunteer application for ${request.userName} (${request.opportunityTitle}) accepted.`,
            request
        });
    } catch (err) {
        console.error('adminAcceptVolunteerRequest error:', err);
        res.status(500).json({ message: err.message });
    }
}

// 11. POST /api/admin/volunteer/requests/:id/decline (Admin declines user application)
async function adminDeclineVolunteerRequest(req, res) {
    try {
        const { id } = req.params;
        const request = await VolunteerRequestModel.findById(id);
        if (!request) return res.status(404).json({ message: 'Volunteer application not found' });

        request.status = 'declined';
        request.respondedAt = new Date();
        await request.save();

        res.json({
            message: `Volunteer application for ${request.userName} declined.`,
            request
        });
    } catch (err) {
        console.error('adminDeclineVolunteerRequest error:', err);
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    getVolunteerEligibility,
    getUserEligibility,
    getVolunteerOpportunities,
    applyVolunteer,
    getMyVolunteerRequests,
    userAcceptVolunteerRequest,
    userDeclineVolunteerRequest,
    getAdminEligibleUsers,
    getAdminVolunteerRequests,
    adminSendVolunteerRequest,
    adminAcceptVolunteerRequest,
    adminDeclineVolunteerRequest
};
