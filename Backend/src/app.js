const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const adminUsersRoutes = require('./routes/adminUsers.routes');
const badgeRoutes = require('./routes/badge.routes');
const activityRoutes = require('./routes/activity.routes');
const aiRoutes = require('./routes/ai.routes');
const registrationRoutes = require('./routes/registration.routes');
const communityRoutes = require('./routes/community.routes');
const errorHandler = require('./middlewares/error.middleware');

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Static files for uploaded community photographs
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Authentication
app.use('/api/auth', authRoutes);

// User
app.use('/api/user', userRoutes);

// Admin & Staff Platform Management
app.use('/api/admin', adminRoutes);
app.use('/api/admin/user', adminUsersRoutes);

// Activity Management
app.use('/api/activities', activityRoutes);

// Badges & Registrations
app.use('/api/badge', badgeRoutes);
app.use('/api/registrations', registrationRoutes);

// Community Feed, Experience Sharing & Group Chat
app.use('/api/community', communityRoutes);

// Mount Python AI Integration Gateway Routes
app.use('/api/ai', aiRoutes);

app.use(errorHandler);

module.exports = app;