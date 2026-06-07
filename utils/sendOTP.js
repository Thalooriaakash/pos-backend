const { Resend } = require("resend");

//const resend = new Resend(process.env.RESEND_API_KEY);
// This forces it to read directly from Render's cloud environment if dotenv fails
const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY?.trim();
const resend = new Resend(apiKey);

async function sendOTP(email, otp) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Password Reset OTP",
    html: `
      <div style="font-family:Arial;padding:20px">
        <h2>Password Reset OTP</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      </div>
    `
  });
}

module.exports = sendOTP;