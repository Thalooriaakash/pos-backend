const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTP = async (email, otp) => {

  await transporter.sendMail({

    from: process.env.EMAIL_USER,

    to: email,

    subject: "Password Reset OTP",

    text: `Your OTP is ${otp}`
  });
};

module.exports = sendOTP;