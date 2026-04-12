const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "yourgmail@gmail.com",
        pass: "your_app_password" // NOT your normal password
    }
});

exports.sendOTP = async (to, otp) => {
    await transporter.sendMail({
        from: "yourgmail@gmail.com",
        to,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}`
    });
};