import express from 'express';
import bcrypt from 'bcryptjs';
import * as accountService from '../services/account.service.js';
import { verifyCaptcha } from '../middlewares/auth.mdw.js';

const router = express.Router();

router.get('/signup', (req, res) => {
    res.render('Accounts/signup', {RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY});
});

router.post('/signup', verifyCaptcha, async (req, res) => {
    const otp = req.body.otp
    const newAccount = {
        full_name: req.body.fullName,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        created_at: new Date()
    };

    const existingAccount = await accountService.getAccountByEmail(req.body.email);
    if (existingAccount) {
        return res.render('Accounts/signup', {
            error: "This email is already registered. Please log in or use another email.",
            RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
            fullName: req.body.fullName,
            email: req.body.email,
            address: req.body.address
        });
    }



    const recordedOTP = await accountService.getOTP(req.body.email)

    if (!recordedOTP) {
        return res.render('Accounts/signup', {
            error: "You haven't requested an OTP or the OTP has expired.",
            RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
            fullName: req.body.fullName,
            email: req.body.email,
            address: req.body.address
        });
    }

   
    if (recordedOTP.code !== otp) {
        return res.render('Accounts/signup', {
            error: "Invalid OTP.",
            RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
            fullName: req.body.fullName,
            email: req.body.email,
            address: req.body.address
        });
    }

    

    await accountService.addAccount(newAccount);

    
    await accountService.deleteOTP(req.body.email);

    return res.render('Accounts/signup', {
        success: "Account created successfully! You can now log in.",
        RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY
    });
});


router.post("/send-otp", async (req, res) => {
  const email  = req.body.email;

  await accountService.deleteOTP(email);

  const otp_code = Math.floor(100000 + Math.random() * 900000).toString();

  const otp = {
    email: email,
    code: otp_code,
    expired_at: new Date(Date.now() + 5 * 60 * 1000)
  }

  await accountService.addOTP(otp)

  await accountService.sendOTPEmail(email, otp_code);

  res.json({ success: true, message: "OTP sent!" });
});




export default router;