const Mechanic = require('../models/Mechanic');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

exports.getPendingMechanics = async (req, res) => {
    try {
        const mechanics = await Mechanic.findAll({ where: { status: 'pending' } });
        res.json(mechanics);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.approveMechanic = async (req, res) => {
    try {
        const { phone } = req.params;
        const mechanic = await Mechanic.findOne({ where: { phone } });

        if (!mechanic) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }

        mechanic.status = 'approved';
        await mechanic.save();

        // Ensure user role is mechanic if not already (should be)
        await User.upsert({ phone, role: 'mechanic' });

        res.json({ message: 'Mechanic approved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.rejectMechanic = async (req, res) => {
    try {
        const { phone } = req.params;
        const mechanic = await Mechanic.findOne({ where: { phone } });

        if (!mechanic) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }

        // Option 1: Delete
        await mechanic.destroy();

        // Option 2: Set status 'rejected'
        // mechanic.status = 'rejected';
        // await mechanic.save();

        res.json({ message: 'Mechanic rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.getDashboardStats = async (req, res) => {
    try {
        const active = await ServiceRequest.count({
            where: { status: ['Approved', 'Arrived', 'Work Started'] }
        });
        const pending = await ServiceRequest.count({ where: { status: 'Pending' } });
        const completed = await ServiceRequest.count({ where: { status: 'Completed' } });

        res.json({ active, pending, completed });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const requests = await ServiceRequest.findAll({
            order: [['createdAt', 'DESC']],
            limit: 50 // Limit to last 50 for now
        });
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllMechanics = async (req, res) => {
    try {
        const mechanics = await Mechanic.findAll({
            where: { status: ['approved', 'suspended'] }
        });
        res.json(mechanics);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.suspendMechanic = async (req, res) => {
    try {
        const { phone } = req.params;
        const mechanic = await Mechanic.findOne({ where: { phone } });
        if (!mechanic) return res.status(404).json({ message: 'Mechanic not found' });

        mechanic.status = 'suspended';
        await mechanic.save();
        res.json({ message: 'Mechanic suspended' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.unsuspendMechanic = async (req, res) => {
    try {
        const { phone } = req.params;
        const mechanic = await Mechanic.findOne({ where: { phone } });
        if (!mechanic) return res.status(404).json({ message: 'Mechanic not found' });

        mechanic.status = 'approved';
        await mechanic.save();
        res.json({ message: 'Mechanic unsuspended' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
