import nodemailer from "nodemailer";

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
  

export async function sendOutBidMail(toEmail, productName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`, 
        to: toEmail,
        subject: "You've been outbid!",
        html: `<p>Dear User,</p>
               <p>You have been outbid on the product <b>${productName}</b>.</p>
                <p>If you wish to place a new bid, please visit the auction page: http://localhost:3000/products/detail/${productId}</p>
                <p>Best regards,<br/>Auction Team</p>`
        };  
    await transporter.sendMail(mailOptions);
}

export async function sendUserNewPasswordEmail(toEmail, newPassword) {

    const mailOptions = {
      from: `"Auction Hub" <${process.env.EMAIL_USER}>`, 
      to: toEmail,
      subject: "Your New Password",
      html: `<p>Your password has been reset. Your new password is <b>${newPassword}</b></p>
             <p>Please log in and change your password immediately for security reasons.</p>`
    };
    await transporter.sendMail(mailOptions);
}

export function sendMailForWinnerBidder(toEmail, productName, userName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`, 
        to: toEmail,
        subject: "You've Won the Auction!",
        html: `<p>Dear ${userName},</p>
               <p>Congratulations! You have won the auction for the product <b>${productName}</b>.</p>
                <p>Please visit the auction page to complete your purchase: http://localhost:3000/products/detail/${productId}</p>
                <p>Best regards,<br/>Auction Team</p>`
        };  
    transporter.sendMail(mailOptions);
}


export function sendMailForSeller(toEmail, productName, userName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`, 
        to: toEmail,
        subject: "Your Auction Has Ended",
        html: `<p>Dear ${userName},</p>
               <p>Your auction for the product <b>${productName}</b> has ended.</p>
                <p>Please visit the auction page for more details: http://localhost:3000/products/detail/${productId}</p>
                <p>Best regards,<br/>Auction Team</p>`
        };  
    transporter.sendMail(mailOptions);
}   