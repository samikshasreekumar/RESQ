const io = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Connected to server:", socket.id);

    // 1. Request OTP
    console.log("Requesting OTP for 9876543210...");
    socket.emit("request_otp", { phone: "9876543210" });
});

socket.on("otp_sent", (data) => {
    console.log("OTP Sent:", data);

    // Note: verification requires the OTP which is logged on the server console.
    // In a real automated test, we'd need to mock the DB or have a way to retrieve it.
    console.log("Please check server logs for the OTP and manually verify using a separate script or client.");

    // For this test script, we will disconnect after request.
    // To complete the flow, we'd need to fetch the OTP from DB.
    // But for now, getting 'otp_sent' confirms the socket connection and request logic.
    socket.disconnect();
});

socket.on("otp_error", (data) => {
    console.error("OTP Error:", data);
    socket.disconnect();
});
