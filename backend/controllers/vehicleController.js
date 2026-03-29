const Vehicle = require('../models/Vehicle');

exports.addVehicle = async (req, res) => {
    try {
        const { userPhone, model, number, type, brand, color } = req.body;

        if (!userPhone || !model || !number || !type || !brand || !color) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const vehicle = await Vehicle.create({
            userPhone,
            model,
            number,
            type,
            brand,
            color
        });

        res.status(201).json({ message: 'Vehicle added', vehicle });
    } catch (err) {
        console.error("Error adding vehicle:", err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Vehicle with this Number Plate is already registered.' });
        }
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ message: 'Invalid user session. Please log in again.' });
        }
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

exports.getVehicles = async (req, res) => {
    try {
        const { userPhone } = req.params;
        const vehicles = await Vehicle.findAll({ where: { userPhone } });
        res.json(vehicles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
