const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminUsersRoutes = require('./routes/adminUsers.routes');
const badgeRoutes = require('./routes/badge.routes');

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin/user', adminUsersRoutes);
app.use('/api/badge', badgeRoutes);






module.exports = app;