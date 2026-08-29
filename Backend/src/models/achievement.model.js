const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ['SILVER', 'GOLD', 'PLATINUM'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    reward: {
      type: String,
      required: true,
    },
    requiredEvents: {
      type: Number,
      required: true,
    },
    verifiedCountAtUnlock: {
      type: Number,
      default: 0,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
    certificateId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: ['unlocked', 'pending_approval', 'approved', 'completed'],
      default: 'unlocked',
    },
    fulfillmentNotes: {
      type: String,
      trim: true,
      default: '',
    },
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Idempotency: Exactly one tier achievement per user
AchievementSchema.index({ user: 1, tier: 1 }, { unique: true });

const AchievementModel = mongoose.model('Achievement', AchievementSchema);

module.exports = AchievementModel;
