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
  

export function sendOutBidMail(toEmail, productName, userName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`, 
        to: toEmail,
        subject: "You've been outbid!",
        html: `<p>Dear ${userName},</p>
               <p>You have been outbid on the product <b>${productName}</b>.</p>
                <p>If you wish to place a new bid, please visit the auction page: http://localhost:3000/products/detail/${productId}</p>
                <p>Best regards,<br/>Auction Team</p>`
        };  
    return transporter.sendMail(mailOptions);
}

export function sendUserNewPasswordEmail(toEmail, newPassword) {

    const mailOptions = {
      from: `"Auction Hub" <${process.env.EMAIL_USER}>`, 
      to: toEmail,
      subject: "Your New Password",
      html: `<p>Your password has been reset. Your new password is <b>${newPassword}</b></p>
             <p>Please log in and change your password immediately for security reasons.</p>`
    };
    return transporter.sendMail(mailOptions);
}

export function sendMailForWinnerBidder(toEmail, productName, userName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`, 
        to: toEmail,
        subject: "You've Won the Auction!",
        html: `<p>Dear ${userName},</p>
               <p>Congratulations! You are the winner of the auction for the product <b>${productName}</b>.</p>
                <p>Please visit the auction page to complete your purchase: http://localhost:3000/products/detail/${productId}</p>
                <p>Best regards,<br/>Auction Team</p>`
        };  
    return transporter.sendMail(mailOptions);
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
    return transporter.sendMail(mailOptions);
}   
    

export function sendNewBidsWinnerEmailForSeller(toEmail, productName, userName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`, 
        to: toEmail,
        subject: "New Bidder for Your Product",
        html: `<p>Dear ${userName},</p>
               <p>A new bidder has placed a bid on your product <b>${productName}</b>.</p>
                <p>Please visit the auction page for more details: http://localhost:3000/products/detail/${productId}</p>
                <p>Best regards,<br/>Auction Team</p>`
        };  
    return transporter.sendMail(mailOptions);
}

export function sendRejectBidEmail(toEmail, productName, userName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Your Bid Has Been Rejected",
        html: `<p>Dear ${userName},</p>
                <p>We regret to inform you that your bid for the product <b>${productName}</b> has been rejected.</p>
                <p>Please visit the auction page for more details: http://localhost:3000/products/detail/${productId}</p>
                <p>Best regards,<br/>Auction Team</p>`
    };
    return transporter.sendMail(mailOptions);
}   

export function sendReplyCommentFromSellerEmail(toEmail, productName, userName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "New Reply From Seller",
        html: `<p>Dear ${userName},</p>
                <p>The seller has replied to question on the product <b>${productName}</b>.</p>
                <p>Please visit the product page to view the reply: http://localhost:3000/products/detail/${productId}</p>  
                <p>Best regards,<br/>Auction Team</p>`
    };
    return transporter.sendMail(mailOptions);
}

export function sendNewCommentEmail(toEmail, productName, userName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "New Comment on Your Product",
        html: `<p>Dear ${userName},</p>
                <p>You have received a new comment on your product <b>${productName}</b>.</p>
                <p>Please visit the product page to view the comment: http://localhost:3000/products/detail/${productId}</p>  
                <p>Best regards,<br/>Auction Team</p>`
    };
    return transporter.sendMail(mailOptions);
}


export function sendLeadingBidderEmail(toEmail, productName, userName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "You Are the Leading Bidder!",
        html: `<p>Dear ${userName},</p>
               <p>Congratulations! You are currently the leading bidder for the product <b>${productName}</b>.</p>
                <p>Please visit the auction page to monitor your bid: http://localhost:3000/products/detail/${productId}</p>
                <p>Best regards,<br/>Auction Team</p>`
        };  
    return transporter.sendMail(mailOptions);
}

export function sendChangeDescriptionEmail(toEmail, productName, userName, productId) {
    const mailOptions = {
        from: `"Auction Hub" <${process.env.EMAIL_USER}>`, 
        to: toEmail,
        subject: "Product Description Updated",
        html: `<p>Dear ${userName},</p>
               <p>The description for your product <b>${productName}</b> has been updated.</p>
                <p>Please visit the product page to view the changes: http://localhost:3000/products/detail/${productId}</p>
                <p>Best regards,<br/>Auction Team</p>`
        };  
    return transporter.sendMail(mailOptions);
}