const mongoose = require('mongoose');

const CommunityReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  reporterName: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['post', 'comment', 'message'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExperiencePost'
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  },
  reason: {
    type: String,
    enum: ['Spam', 'Harassment', 'Inappropriate content', 'Misleading information', 'Other'],
    required: true
  },
  details: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
    default: 'pending',
    index: true
  },
  adminNotes: {
    type: String
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

CommunityReportSchema.index({ status: 1, createdAt: -1 });

const CommunityReportModel = mongoose.model('CommunityReport', CommunityReportSchema);

module.exports = CommunityReportModel;
