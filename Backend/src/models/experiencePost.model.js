const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
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
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ReactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'heart', 'nature', 'bird'],
    default: 'like'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ExperiencePostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    default: 'user'
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
    index: true
  },
  activityIdString: {
    type: String
  },
  activityName: {
    type: String,
    required: true
  },
  activityDate: {
    type: String
  },
  activityLocation: {
    type: String
  },
  activityCategory: {
    type: String,
    default: 'Nature Activities'
  },
  activityType: {
    type: String,
    default: 'walk'
  },
  isAttendedVerified: {
    type: Boolean,
    default: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000
  },
  imageUrls: {
    type: [String],
    default: []
  },
  reactions: [ReactionSchema],
  reactionsCount: {
    type: Number,
    default: 0
  },
  comments: [CommentSchema],
  commentsCount: {
    type: Number,
    default: 0
  },
  reportsCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'removed'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Indexes for high performance feed retrieval and filtering
ExperiencePostSchema.index({ createdAt: -1 });
ExperiencePostSchema.index({ activity: 1, createdAt: -1 });
ExperiencePostSchema.index({ user: 1, createdAt: -1 });
ExperiencePostSchema.index({ reactionsCount: -1 });
ExperiencePostSchema.index({ commentsCount: -1 });

const ExperiencePostModel = mongoose.model('ExperiencePost', ExperiencePostSchema);

module.exports = ExperiencePostModel;
