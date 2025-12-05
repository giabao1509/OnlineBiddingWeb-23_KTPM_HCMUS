import express from 'express';
import bcrypt from 'bcryptjs';
import * as accountService from '../services/account.service.js';
import { verifyCaptcha } from '../middlewares/auth.mdw.js';

const router = express.Router();

router.get('/signup', (req, res) => {
    res.render('Accounts/signup');
});

router.post('/signup', verifyCaptcha, async (req, res) => {
    const newAccount = {
        full_name: req.body.fullName,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        created_at: new Date()
    };

    await accountService.addAccount(newAccount);
    res.render('Accounts/signup');
});


router.post("/send-otp", async (req, res) => {
  const email  = req.body.email;

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