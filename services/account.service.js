import db from '../ultis/db.js';




export function addAccount(account) {
    return db('user_account').insert(account);
}

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


export function addOTP(otp) {
    return db('otp').insert(otp);
}


export function getOTP(email) {
    return db('otp').where('email', email).first();
}

export function deleteOTP(email) {
    return db('otp').where('email', email).del();
}

export function getAccountByEmail(email) {
    return db('user_account').where('email', email).first();
}