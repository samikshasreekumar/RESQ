const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authAdminController = require('../controllers/authAdminController');

// Auth
router.post('/login', authAdminController.adminLogin);

// Mechanics
router.get('/mechanics/pending', adminController.getPendingMechanics);
router.get('/mechanics/all', adminController.getAllMechanics);
router.post('/mechanics/:phone/approve', adminController.approveMechanic);
router.post('/mechanics/:phone/reject', adminController.rejectMechanic);
router.post('/mechanics/:phone/suspend', adminController.suspendMechanic);
router.post('/mechanics/:phone/unsuspend', adminController.unsuspendMechanic);

// Monitoring / Dashboard
router.get('/stats', adminController.getDashboardStats);
router.get('/requests', adminController.getAllRequests);

module.exports = router;
