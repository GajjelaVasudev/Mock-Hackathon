const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const activityRoutes = require('./routes/activity.routes');

app.use(cors({
    origin: "http://localhost:5173",
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


module.exports = app;