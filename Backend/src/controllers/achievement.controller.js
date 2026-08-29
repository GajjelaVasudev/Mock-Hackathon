const achievementService = require('../services/achievement.service');
const AchievementModel = require('../models/achievement.model');
const UserModel = require('../models/user.model');

class AchievementController {
  /**
   * GET /api/user/achievements
   * Authenticated user's achievement summary, progress, and tiers
   */
  async getUserAchievements(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const summary = await achievementService.getUserAchievementSummary(userId);
      return res.status(200).json(summary);
    } catch (error) {
      console.error('getUserAchievements error:', error);
      return res.status(500).json({ message: error.message || 'Failed to fetch achievements' });
    }
  }

  /**
   * GET /api/user/attendance-summary
   * Breakdown of verified attended activities
   */
  async getUserAttendanceSummary(req, res) {
    try {
      const userId = req.user.id || req.user._id;
      const breakdown = await achievementService.getUserAttendanceSummary(userId);
      return res.status(200).json(breakdown);
    } catch (error) {
      console.error('getUserAttendanceSummary error:', error);
      return res.status(500).json({ message: error.message || 'Failed to fetch attendance summary' });
    }
  }

  /**
   * GET /api/user/achievements/certificate/:certId
   * Fetch certificate data by certificate reference ID or achievement ID
   */
  async getCertificateDetails(req, res) {
    try {
      const { certId } = req.params;
      const achievement = await AchievementModel.findOne({
        $or: [{ certificateId: certId }, { _id: certId.match(/^[0-9a-fA-F]{24}$/) ? certId : null }],
      }).populate('user', 'name username email');

      if (!achievement) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      return res.status(200).json({
        certificateId: achievement.certificateId,
        tier: achievement.tier,
        title: achievement.title,
        recipientName: achievement.user?.name || achievement.user?.username || 'BNHS Nature Enthusiast',
        verifiedEventsCount: achievement.verifiedCountAtUnlock || achievement.requiredEvents,
        unlockedAt: achievement.unlockedAt,
        organization: 'Bombay Natural History Society',
        seal: 'Official BNHS Conservation Recognition',
      });
    } catch (error) {
      console.error('getCertificateDetails error:', error);
      return res.status(500).json({ message: error.message || 'Failed to fetch certificate' });
    }
  }

  /**
   * GET /api/admin/achievements
   * Staff / Admin list of unlocked achievements
   */
  async getAdminAchievements(req, res) {
    try {
      const { page, limit, tier, status } = req.query;
      const data = await achievementService.getAdminAchievementsList({ page, limit, tier, status });
      return res.status(200).json(data);
    } catch (error) {
      console.error('getAdminAchievements error:', error);
      return res.status(500).json({ message: error.message || 'Failed to fetch achievements list' });
    }
  }

  /**
   * PATCH /api/admin/achievements/:id/fulfillment
   * Staff / Admin update fulfillment status
   */
  async updateFulfillment(req, res) {
    try {
      const { id } = req.params;
      const adminUserId = req.user.id || req.user._id;
      const { fulfillmentStatus, fulfillmentNotes } = req.body;

      if (!fulfillmentStatus) {
        return res.status(400).json({ message: 'fulfillmentStatus is required' });
      }

      const updated = await achievementService.updateFulfillment(id, adminUserId, {
        fulfillmentStatus,
        fulfillmentNotes,
      });

      return res.status(200).json({
        message: 'Achievement fulfillment status updated successfully',
        achievement: updated,
      });
    } catch (error) {
      console.error('updateFulfillment error:', error);
      return res.status(500).json({ message: error.message || 'Failed to update fulfillment' });
    }
  }
}

module.exports = new AchievementController();
