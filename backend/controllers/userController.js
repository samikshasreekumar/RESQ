const User = require('../models/User');

exports.updateProfile = async (req, res) => {
    const { phone, name, dob, address, bio, email } = req.body;
    let profilePhoto = null;
    if (req.file) {
        profilePhoto = 'uploads/' + req.file.filename;
    }

    if (!phone || !name) {
        return res.status(400).json({ message: 'Phone and Name are required' });
    }

    try {
        const user = await User.findByPk(phone);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name;
        user.dob = dob;
        user.address = address;
        user.bio = bio;
        user.email = email;
        if (profilePhoto) user.profilePhoto = profilePhoto;
        await user.save();

        res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const { phone } = req.params;
        const user = await User.findByPk(phone);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
