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