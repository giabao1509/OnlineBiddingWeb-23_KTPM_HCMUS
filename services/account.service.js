import db from '../ultis/db.js';




export function addAccount(account) {
    return db('user_account').insert(account);
}

import nodemailer from "nodemailer";

export async function sendOTPEmail(toEmail, otp) {
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
    from: `"My App" <${process.env.EMAIL_USER}>`,   // CHỈNH CHỖ NÀY
    to: toEmail,
    subject: "Your OTP Code",
    html: `<p>Your OTP code is <b>${otp}</b></p>`
  };

  await transporter.sendMail(mailOptions);
}


export function addOTP(otp) {
    return db('otp').insert(otp);
}