const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authController = require('../controllers/authController');

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Routes
router.post('/register/mechanic',
    upload.fields([
        { name: 'idDoc', maxCount: 1 },
        { name: 'certDoc', maxCount: 1 },
        { name: 'profilePhoto', maxCount: 1 }
    ]),
    authController.registerMechanic
);

router.get('/mechanic/profile/:phone', authController.getMechanicProfile);

router.get('/status/:phone', authController.getMechanicStatus);

router.put('/mechanic/profile/:phone',
    upload.single('profilePhoto'),
    authController.updateMechanicProfile
);

module.exports = router;
