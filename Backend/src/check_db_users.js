const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/BNHS');
  const db = mongoose.connection.db;
  const users = await db.collection('users').find().toArray();
  console.log('Total users:', users.length);
  for (const u of users) {
    console.log(`User: ${u.username}, email: ${u.email}, role: ${u.role}, hasPassword: ${!!u.password}, isEmailVerified: ${u.isEmailVerified}`);
  }
  process.exit(0);
}

check().catch(console.error);
