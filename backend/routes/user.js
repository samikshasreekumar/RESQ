const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'user-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.post('/profile', upload.single('photo'), userController.updateProfile);
router.get('/profile/:phone', userController.getUserProfile);

module.exports = router;
