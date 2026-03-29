const Mechanic = require('../models/Mechanic');
const User = require('../models/User');

exports.registerMechanic = async (req, res) => {
    try {
        const { name, jobTitle, phone, address, district, experience, latitude, longitude } = req.body;

        // Files
        const idDoc = req.files['idDoc'] ? req.files['idDoc'][0].path : null;
        const certDoc = req.files['certDoc'] ? req.files['certDoc'][0].path : null;
        const profilePhoto = req.files['profilePhoto'] ? req.files['profilePhoto'][0].path : null;

        if (!name || !jobTitle || !phone || !address || !district || !experience || !idDoc || !certDoc) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Create Mechanic
        const mechanic = await Mechanic.create({
            name,
            jobTitle,
            phone,
            address,
            district,
            experience,
            idDoc,
            certDoc,
            profilePhoto,
            latitude: latitude || null,
            longitude: longitude || null,
            status: 'pending'
        });

        // Update User Role to Mechanic
        // Assuming user already validated OTP and exists in User table
        await User.upsert({ phone, role: 'mechanic' });

        res.status(201).json({ message: 'Mechanic registered successfully', mechanic });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getMechanicStatus = async (req, res) => {
    try {
        const { phone } = req.params;
        const mechanic = await Mechanic.findOne({ where: { phone } });

        if (!mechanic) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }

        res.json({ status: mechanic.status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMechanicProfile = async (req, res) => {
    try {
        const { phone } = req.params;
        const mechanic = await Mechanic.findOne({ where: { phone } });

        if (!mechanic) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }

        res.json(mechanic);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateMechanicProfile = async (req, res) => {
    try {
        const { phone } = req.params;
        const { name, jobTitle, address, district, experience } = req.body;

        const mechanic = await Mechanic.findOne({ where: { phone } });
        if (!mechanic) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }

        // Update fields
        if (name) mechanic.name = name;
        if (jobTitle) mechanic.jobTitle = jobTitle;
        if (address) mechanic.address = address;
        if (district) mechanic.district = district;
        if (experience) mechanic.experience = experience;

        // Update photo if uploaded
        if (req.file) {
            mechanic.profilePhoto = req.file.path;
        }

        await mechanic.save();

        // Also update User Table name if provided
        if (name) {
            await User.upsert({ phone, name });
        }

        res.json({ message: 'Profile updated successfully', mechanic });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
