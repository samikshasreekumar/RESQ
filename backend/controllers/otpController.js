const OTP = require('../models/OTP');
const User = require('../models/User');
const { Op } = require('sequelize');
const axios = require('axios');
const nodemailer = require('nodemailer');

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Fast2SMS API Key
const fast2SmsKey = process.env.FAST2SMS_API_KEY ? process.env.FAST2SMS_API_KEY.trim() : null;

if (fast2SmsKey && fast2SmsKey !== 'your_fast2sms_api_key_here') {
    console.log("🟢 Fast2SMS API Key Detected. SMS will be sent.");
} else {
    console.warn("🟡 FAST2SMS_API_KEY missing from .env. Falling back to console simulation.");
}

// Set to true to allow developers to see OTP in browser alert
const DEVELOPER_MODE = true;

exports.requestOTP = async (socket, data) => {
    const { phone } = data;

    if (!phone) {
        socket.emit('otp_error', { message: 'Phone number required' });
        return;
    }

    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

        // Save to DB (invalidate old OTPs)
        await OTP.destroy({ where: { phone } });
        await OTP.create({ phone, otp, expiresAt });

        // Check if user exists and has a registered email
        const user = await User.findByPk(phone);
        const registeredEmail = user ? user.email : null;

        if (registeredEmail) {
            // User has an email! Send OTP directly to their registered email ID.
            try {
                console.log(`[EMAIL] Attempting to send OTP to registered email: ${registeredEmail}...`);
                if (!DEVELOPER_MODE && process.env.SMTP_USER && process.env.SMTP_PASS) {
                    await transporter.sendMail({
                        from: `"RESQ Kerala" <${process.env.SMTP_USER}>`,
                        to: registeredEmail,
                        subject: "Your RESQ Login OTP",
                        html: `<h2>Welcome back to RESQ Kerala</h2><p>Your One-Time Password (OTP) for login is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p>`
                    });
                    console.log(`[EMAIL] Successfully sent OTP to ${registeredEmail}.`);
                } else {
                    console.log(`[EMAIL TEST/SIMULATION] Output for ${registeredEmail}: ${otp}`);
                }
            } catch (emailError) {
                console.error(`[EMAIL ERROR] Failed to send email to ${registeredEmail}:`, emailError.message);
                console.log(`[EMAIL SIMULATION FALLBACK] Output for ${registeredEmail}: ${otp}`);
            }
        } else {
            // No email found, fallback to real SMS via Fast2SMS
            if (!DEVELOPER_MODE && fast2SmsKey && fast2SmsKey !== 'your_fast2sms_api_key_here') {
                try {
                    console.log(`[FAST2SMS] Attempting to send OTP to ${phone} via POST...`);
                    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
                        route: 'otp',
                        variables_values: otp,
                        numbers: phone
                    }, {
                        headers: {
                            'authorization': fast2SmsKey,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.data && response.data.return === true) {
                        console.log(`[FAST2SMS] Successfully sent OTP to ${phone}. Message ID: ${response.data.request_id}`);
                    } else {
                        const data = response.data || {};
                        if (data.status_code === 996) {
                            console.error(`[FAST2SMS ACTION REQUIRED] Website Verification Needed!`);
                            console.error(`>>> Please log in to Fast2SMS and complete "Website Verification" in the OTP Message menu.`);
                        }
                        console.error(`[FAST2SMS REJECTION] API returned success=false:`, data);
                        throw new Error(data.message || 'Unknown error from Fast2SMS');
                    }
                } catch (smsError) {
                    const errorData = smsError.response ? smsError.response.data : (smsError.message ? { message: smsError.message } : null);

                    if (errorData && errorData.status_code === 996) {
                        console.error(`\n[FAST2SMS CRITICAL] Account Verification Required!`);
                        console.error(`To fix this: Visit Fast2SMS -> OTP Message -> Complete Website Verification.\n`);
                    }

                    console.error(`[FAST2SMS ERROR] Failed to send SMS to ${phone}. Status: ${smsError.response ? smsError.response.status : 'Local Error'}. Data:`, JSON.stringify(errorData));
                    console.log(`[SMS SIMULATION FALLBACK] Output for ${phone}: ${otp}`);
                }
            } else {
                // Send SMS (Simulated fallback if no credentials OR in Developer Mode)
                console.log(`[TEST/SIMULATION] Output for ${phone}: ${otp}`);
            }
        }

        // Emit success
        const responseData = { message: 'OTP sent successfully' };

        // In Developer Mode, send the OTP back to the UI for easy testing (only if it wasn't an email)
        if (DEVELOPER_MODE && !registeredEmail) {
            responseData.testOtp = otp;
        }

        socket.emit('otp_sent', responseData);

    } catch (err) {
        console.error(err);
        socket.emit('otp_error', { message: 'Server error' });
    }
};

exports.verifyOTP = async (socket, data) => {
    const { phone, otp, role } = data; // Accepted role from frontend
    console.log(`\n--- [VERIFY OTP REQUEST] ---`);
    console.log(`Incoming Phone: "${phone}"`);
    console.log(`Incoming OTP: "${otp}"`);
    console.log(`Current Server Time: ${new Date()}`);

    try {
        const record = await OTP.findOne({
            where: {
                phone,
                otp,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        console.log(`Query Result: Record Found? ${record ? 'YES' : 'NO'}`);
        if(!record) {
             const allOtps = await OTP.findAll({ where: { phone } });
             console.log(`OTPs currently stored for this phone:`, JSON.stringify(allOtps));
        }

        if (record) {
            // Valid OTP
            // Check if user exists, if not create one with requested role
            let user = await User.findByPk(phone);
            if (!user) {
                user = await User.create({ phone, role: role || 'user' });
            } else {
                // If user exists, update role if different (e.g. upgrading to mechanic)
                if (role && user.role !== role) {
                    user.role = role;
                    await user.save();
                }
            }

            // Clear OTP
            await record.destroy();

            let redirectPath = await getRedirectPath(user.role, phone);

            // Special check for mechanic status
            if (user.role === 'mechanic') {
                const mechanic = await require('../models/Mechanic').findOne({ where: { phone } });
                if (mechanic) {
                    if (mechanic.status === 'pending') {
                        redirectPath = 'mechanic_pending.html';
                    } else if (mechanic.status === 'rejected') {
                        redirectPath = 'mechanic_rejected.html';
                    } else if (mechanic.status === 'suspended') {
                        redirectPath = 'mechanic_pending.html'; // Or a suspended page
                    } else if (mechanic.status === 'approved') {
                        redirectPath = 'mechanic_dash.html';
                    }
                } else {
                    // Not found in mechanics table -> New registration
                    redirectPath = 'mechanic_register.html';
                }
            }

            socket.emit('otp_verified', {
                message: 'Login successful',
                user: { ...user.toJSON(), redirect: redirectPath }
            });
        } else {
            socket.emit('otp_error', { message: 'Invalid or expired OTP' });
        }
    } catch (err) {
        console.error(err);
        socket.emit('otp_error', { message: 'Verification failed' });
    }
};

async function getRedirectPath(role, phone) {
    if (role === 'admin') return 'admin_moni.html';
    if (role === 'mechanic') return 'mechanic_dash.html';

    // Check if user has name (registered)
    const user = await require('../models/User').findByPk(phone);
    if (!user.name) {
        return 'user_registration.html';
    }

    // Check if user has vehicle
    const vehicle = await require('../models/Vehicle').findOne({ where: { userPhone: phone } });
    if (!vehicle) {
        return 'add_newvehicle.html';
    }

    return 'user_dash.html'; // Direct to dashboard where user can select vehicle or add new one
}
