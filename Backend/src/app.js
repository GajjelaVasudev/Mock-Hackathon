const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminUsersRoutes = require('./routes/adminUsers.routes');
const badgeRoutes = require('./routes/badge.routes');

const activityRoutes = require('./routes/activity.routes');
const aiRoutes = require('./routes/ai.routes');
const registrationRoutes =require('./routes/registration.routes');

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());


// Authentication
app.use('/api/auth', authRoutes);

// User
app.use('/api/user', userRoutes);

// Activity Management
app.use('/api/activities', activityRoutes);

// Mount Existing MERN Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin/user', adminUsersRoutes);
app.use('/api/badge', badgeRoutes);
app.use('/api/registrations', registrationRoutes);


// Mount Python AI Integration Gateway Routes
app.use('/api/ai', aiRoutes);

module.exports = app;