const mongoose = require('mongoose');

async function connectDB() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/BNHS';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
}

module.exports = connectDB;