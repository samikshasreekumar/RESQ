const io = require("socket.io-client");
const OTP = require('./models/OTP');

const socket = io("http://localhost:5001"); // backend port is 5001

socket.on("connect", () => {
    console.log("Connected as", socket.id);
    const testPhone = "9998887770";
    console.log("Emitting request_otp for", testPhone);
    socket.emit("request_otp", { phone: testPhone });
});

let testPhone = "9998887770";

socket.on("otp_sent", async (data) => {
    console.log("Received otp_sent:", data);
    
    // Read from DB directly
    try {
        const record = await OTP.findOne({ where: { phone: testPhone }, order: [['createdAt', 'DESC']] });
        if (!record) {
            console.log("OTP not found in DB!");
            process.exit(1);
        }
        console.log("Found OTP in DB:", record.otp);
        
        console.log("Emitting verify_otp with", record.otp);
        socket.emit("verify_otp", { phone: testPhone, otp: record.otp, role: "user" });
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
});

socket.on("otp_verified", (data) => {
    console.log("✅ OTP VERIFIED SUCCESSFULLY:", data);
    process.exit(0);
});

socket.on("otp_error", (data) => {
    console.log("❌ OTP ERROR:", data);
    process.exit(1);
});

setTimeout(() => {
    console.log("Test timed out!");
    process.exit(1);
}, 10000);
