const OTP = require('./models/OTP');
async function test() {
    try {
        const otps = await OTP.findAll();
        console.log("Current OTPs in DB:\n" + JSON.stringify(otps, null, 2));
    } catch(err) {
        console.error(err);
    }
    process.exit();
}
test();
