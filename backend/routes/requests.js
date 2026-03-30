const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, 'req-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.post('/', upload.single('image'), requestController.createRequest);
router.get('/pending', requestController.getPendingRequests);
router.post('/:id/approve', requestController.approveRequest);
router.post('/:id/decline', requestController.rejectRequest);
router.post('/:id/status', requestController.updateRequestStatus);
router.get('/:id', requestController.getRequestStatus);
router.get('/history/all', requestController.getAllWorkHistory);
router.get('/history/user/:phone', requestController.getUserHistory);
router.get('/history/:phone', requestController.getMechanicWorkHistory);
router.post('/:id/feedback', requestController.submitFeedback);
router.post('/:id/estimated-time', requestController.updateEstimatedTime);
router.post('/:id/enable-cab', requestController.enableCabService);
router.post('/:id/reassign', requestController.reassignRequest);
router.delete('/:id', requestController.deleteRequest);

module.exports = router;
