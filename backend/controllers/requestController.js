const { Op } = require('sequelize');
const ServiceRequest = require('../models/ServiceRequest');
const Mechanic = require('../models/Mechanic');
const User = require('../models/User');

exports.createRequest = async (req, res) => {
    try {
        const { userPhone, issueType, userLat, userLng, userAddress, district, description, mechanicPhone } = req.body;

        let imageUrl = null;
        if (req.file) {
            imageUrl = 'uploads/' + req.file.filename;
        }

        const request = await ServiceRequest.create({
            userPhone,
            issueType,
            userLat,
            userLng,
            userAddress,
            district,
            description,
            mechanicPhone,
            imageUrl
        });

        res.status(201).json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPendingRequests = async (req, res) => {
    try {
        let { district, mechanicPhone } = req.query; // Optional filter
        const whereClause = { status: 'Pending' };

        if (mechanicPhone && !district) {
            const mechanic = await Mechanic.findOne({ where: { phone: mechanicPhone } });
            if (mechanic && mechanic.district) {
                district = mechanic.district;
            }
        }

        if (mechanicPhone && district) {
            whereClause[Op.or] = [
                { mechanicPhone: mechanicPhone },
                { mechanicPhone: null, district: district }
            ];
        } else if (mechanicPhone) {
            whereClause[Op.or] = [
                { mechanicPhone: mechanicPhone },
                { mechanicPhone: null }
            ];
        } else if (district) {
            whereClause.district = district;
            whereClause.mechanicPhone = null;
        } else {
            whereClause.mechanicPhone = null;
        }

        const requests = await ServiceRequest.findAll({ where: whereClause });
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { mechanicPhone } = req.body;

        const request = await ServiceRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = 'Approved';
        request.mechanicPhone = mechanicPhone;
        await request.save();

        // Emit live update
        const io = req.app.get('io');
        if (io) {
            io.emit('request_status_updated', {
                requestId: id,
                status: 'Approved',
                phone: request.userPhone
            });
        }

        res.json({ message: 'Request approved', request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.submitFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, feedback } = req.body;

        const request = await ServiceRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.rating = rating;
        request.feedback = feedback;
        await request.save();

        res.json({ message: 'Feedback submitted successfully', request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await ServiceRequest.findByPk(id);

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Fetch mechanic details if mechanicPhone is present (even if status is Pending)
        let mechanic = null;
        if (request.mechanicPhone) {
            mechanic = await Mechanic.findOne({ where: { phone: request.mechanicPhone } });
        }

        // Fetch previous mechanic details if reassignedFrom is present
        let previousMechanic = null;
        if (request.reassignedFrom) {
            previousMechanic = await Mechanic.findOne({ where: { phone: request.reassignedFrom } });
        }

        res.json({ request, mechanic, previousMechanic });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const request = await ServiceRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = status;
        await request.save();

        // Emit live update
        const io = req.app.get('io');
        if (io) {
            io.emit('request_status_updated', {
                requestId: id,
                status: status,
                phone: request.userPhone
            });
        }

        res.json({ message: `Status updated to ${status}`, request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateEstimatedTime = async (req, res) => {
    try {
        const { id } = req.params;
        const { estimatedTime, repairDays } = req.body;

        const request = await ServiceRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (estimatedTime !== undefined) request.estimatedTime = estimatedTime;
        if (repairDays !== undefined) request.repairDays = repairDays;
        await request.save();

        res.json({ message: 'Estimated time updated', request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.enableCabService = async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled, cabDriverName, cabVehicleNumber, cabETA } = req.body;

        const request = await ServiceRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.cabServiceEnabled = enabled;

        if (enabled) {
            // Save cab details when enabling
            request.cabDriverName = cabDriverName || null;
            request.cabVehicleNumber = cabVehicleNumber || null;
            request.cabETA = cabETA || null;
        } else {
            // Clear cab details when disabling
            request.cabDriverName = null;
            request.cabVehicleNumber = null;
            request.cabETA = null;
        }

        await request.save();

        res.json({ message: `Cab service ${enabled ? 'enabled' : 'disabled'}`, request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.reassignRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { failureReason, newMechanicPhone } = req.body;

        const request = await ServiceRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        const previousMechanicPhone = request.mechanicPhone;

        request.status = 'Pending'; // Back to pending so new mechanic can accept, or we assign directly
        request.failureReason = failureReason;
        request.reassignedFrom = previousMechanicPhone;

        if (newMechanicPhone) {
            request.mechanicPhone = newMechanicPhone;
            request.status = 'Pending'; // Set to pending so they must approve
        } else {
            request.mechanicPhone = null;
            request.status = 'Pending';
        }

        await request.save();

        res.json({ message: 'Request reassigned successfully', request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await ServiceRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = 'Rejected';
        await request.save();

        // Emit live update
        const io = req.app.get('io');
        if (io) {
            io.emit('request_status_updated', {
                requestId: id,
                status: 'Rejected',
                phone: request.userPhone
            });
        }

        console.log(`[REJECT] Request ${id} rejected by mechanic`);
        res.json({ message: 'Request rejected successfully', request });
    } catch (err) {
        console.error(`[REJECT] Error rejecting request ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMechanicWorkHistory = async (req, res) => {
    try {
        const { phone } = req.params;
        const history = await ServiceRequest.findAll({
            where: { mechanicPhone: phone, status: 'Completed' },
            order: [['updatedAt', 'DESC']]
        });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllWorkHistory = async (req, res) => {
    try {
        const history = await ServiceRequest.findAll({
            where: { status: 'Completed' },
            include: [{ model: Mechanic, attributes: ['name', 'phone'] }],
            order: [['updatedAt', 'DESC']]
        });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserHistory = async (req, res) => {
    try {
        const { phone } = req.params;
        const history = await ServiceRequest.findAll({
            where: { userPhone: phone },
            include: [{ model: Mechanic, attributes: ['name', 'phone'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[DELETE] Attempting to delete request: ${id}`);
        const request = await ServiceRequest.findByPk(id);
        if (!request) {
            console.log(`[DELETE] Request ${id} not found`);
            return res.status(404).json({ message: 'Request not found' });
        }

        await request.destroy();
        console.log(`[DELETE] Request ${id} deleted successfully`);
        res.json({ message: 'Request deleted successfully' });
    } catch (err) {
        console.error(`[DELETE] Error deleting request ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
