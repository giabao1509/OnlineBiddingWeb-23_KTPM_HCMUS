import nodemailer from "nodemailer";

export async function sendOTPEmail(toEmail, otp_code) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
    rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"My App" <${process.env.EMAIL_USER}>`, 
    to: toEmail,
    subject: "Your OTP Code",
    html: `<p>Your OTP code is <b>${otp_code}</b></p>`
  };

  await transporter.sendMail(mailOptions);
}


export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
