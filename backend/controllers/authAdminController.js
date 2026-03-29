const Admin = require('../models/Admin');

exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ where: { username } });

        if (!admin || admin.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // In a real app, send a token. For now, just success.
        res.json({ message: 'Login successful', username: admin.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
