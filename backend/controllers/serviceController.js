const Mechanic = require('../models/Mechanic');

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

exports.findNearestMechanics = async (req, res) => {
    try {
        const { lat, lng, serviceType, district } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ message: 'User location required' });
        }

        const basePrices = {
            "Flat Tyre": 299,
            "Battery": 349,
            "Fuel": 399,
            "Breakdown": 449
        };
        const perKmRate = 15;

        // Base query - only approved mechanics (districts are no longer strictly filtered to show nearest across borders)
        const whereClause = { status: 'approved' };

        const mechanics = await Mechanic.findAll({
            where: whereClause
        });

        // Calculate distances and sort
        const results = mechanics.map(m => {
            const distance = getDistance(parseFloat(lat), parseFloat(lng), parseFloat(m.latitude), parseFloat(m.longitude));
            const basePrice = basePrices[serviceType] || 0;
            const estimatedPrice = basePrice > 0 ? Math.round(basePrice + (distance * perKmRate)) : 0;

            return {
                ...m.toJSON(),
                distance: parseFloat(distance.toFixed(2)),
                estimatedPrice
            };
        }).sort((a, b) => a.distance - b.distance);

        res.json(results);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
