const mongoose = require('mongoose');

const CommunityMessageSchema = new mongoose.Schema({
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
    index: true
  },
  activityIdString: {
    type: String,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    default: 'user'
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  imageUrls: {
    type: [String],
    default: []
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    type: {
      type: String,
      default: 'like'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'removed'],
    default: 'active'
  }
}, {
  timestamps: true
});

CommunityMessageSchema.index({ activity: 1, createdAt: 1 });
CommunityMessageSchema.index({ activityIdString: 1, createdAt: 1 });

const CommunityMessageModel = mongoose.model('CommunityMessage', CommunityMessageSchema);

module.exports = CommunityMessageModel;
