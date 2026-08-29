const mongoose = require('mongoose');

const CommunityReadStateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
    index: true
  },
  activityIdString: {
    type: String,
    trim: true,
    index: true
  },
  lastReadAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

CommunityReadStateSchema.index({ user: 1, activity: 1 }, { unique: true });

const CommunityReadStateModel = mongoose.model('CommunityReadState', CommunityReadStateSchema);

module.exports = CommunityReadStateModel;
