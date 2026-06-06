const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

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