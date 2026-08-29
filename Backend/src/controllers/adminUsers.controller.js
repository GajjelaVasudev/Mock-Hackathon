const UserModel = require('../models/user.model');

async function listUsers(req, res) {
    const { role, isActive, search } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const users = await UserModel.find(filter).select('-password');
    res.json(users);
}

async function updateUserRole(req, res) {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ['user', 'staff', 'admin'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: `role must be one of: ${allowedRoles.join(', ')}` });
    }
    if (id === req.user.id) {
        return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
}

async function updateUserStatus(req, res) {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be true or false' });
    }
    if (id === req.user.id) {
        return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const user = await UserModel.findByIdAndUpdate(id, { isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
}

module.exports = {
    listUsers,
    updateUserRole,
    updateUserStatus
};