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
    required: false,
    default: null,
    index: true
  },
  activityIdString: {
    type: String,
    default: null
  },
  activityName: {
    type: String,
    required: false,
    default: 'Nature Field Observation'
  },
  activityDate: {
    type: String
  },
  activityLocation: {
    type: String
  },
  category: {
    type: String,
    enum: [
      'Birds',
      'Marine',
      'Trees & Flora',
      'Conservation',
      'Field Camps',
      'Volunteering',
      'Insects',
      'General Nature'
    ],
    default: 'General Nature',
    index: true
  },
  hashtags: {
    type: [String],
    default: [],
    index: true
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
  },
  isSeeded: {
    type: Boolean,
    default: false
  },
  seedSource: {
    type: String,
    default: null
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
