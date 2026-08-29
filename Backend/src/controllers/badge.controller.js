const BadgeModel = require('../models/badge.model');

async function getBadges(req, res) {
    const badges = await BadgeModel.find();
    res.json(badges);
}

async function createBadge(req, res) {
    const { name, description, criteriaKey, icon } = req.body;
    const badge = await BadgeModel.create({ name, description, criteriaKey, icon });
    res.status(201).json(badge);
}

async function updateBadge(req, res) {
    const { id } = req.params;
    const { name, description, criteriaKey, icon } = req.body;
    const badge = await BadgeModel.findByIdAndUpdate(
        id,
        { name, description, criteriaKey, icon },
        { new: true, runValidators: true }
    );
    if (!badge) return res.status(404).json({ message: 'Badge not found' });
    res.json(badge);
}

async function deleteBadge(req, res) {
    const { id } = req.params;
    const badge = await BadgeModel.findByIdAndDelete(id);
    if (!badge) return res.status(404).json({ message: 'Badge not found' });
    res.json({ message: 'Badge deleted' });
}

module.exports = {
    getBadges,
    createBadge,
    updateBadge,
    deleteBadge
};