const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const aiRoutes = require('./routes/ai.routes');

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Mount Existing MERN Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Mount Python AI Integration Gateway Routes
app.use('/api/ai', aiRoutes);

module.exports = app;