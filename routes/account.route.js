import express from 'express';
import bcrypt from 'bcryptjs';
import * as accountService from '../services/account.service.js';
import { verifyCaptcha, isAuth} from '../middlewares/auth.mdw.js';
import { generateToken, generateOTPToken, verifyToken } from '../utils/jwt.js';
import { sendOTPEmail, generateOTP } from '../utils/otp.js';


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


router.post('/send-otp', async (req, res) => {
  const email  = req.body.email;

  await accountService.deleteOTP(email);

  const otp_code = generateOTP();

  const otp = {
    email: email,
    code: otp_code,
    expired_at: new Date(Date.now() + 5 * 60 * 1000)
  }

  await accountService.addOTP(otp)

  sendOTPEmail(email, otp_code);

  res.json({ success: true, message: "OTP sent!" });
});



router.get('/signin', async (req, res) => { 
    res.render('Accounts/signin', {RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY});
});

router.post('/signin', async (req, res) => {
    const email = req.body.email
    const password = req.body.password 
    const user = await accountService.getAccountByEmail(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.render('Accounts/signin', { 
            error: 'Email or password is incorrect',
            email: email
        });
    }

    const token = generateToken(user);
    res.cookie('authToken', token, { httpOnly: true, maxAge: 3600*1000 });
    res.redirect('/accounts/dashboard');
});

router.get('/dashboard', isAuth, async (req, res) => { 
    res.render('dashboard');
});


router.get('/forgotpassword', async (req, res) => { 
    res.render('Accounts/forgotpassword');
});

router.post('/forgotpassword', async (req, res) => { 
    const email = req.body.email;

    // Xóa OTP cũ nếu có
    await accountService.deleteOTP(email);

    // Tạo OTP mới
    const otp_code = generateOTP();
    const otp = {
        email: email,
        code: otp_code,
        expired_at: new Date(Date.now() + 5 * 60 * 1000)
    };
    await accountService.addOTP(otp);

    
    sendOTPEmail(email, otp_code);

    
    const token = generateOTPToken(email);

    
    res.cookie('resetToken', token, { httpOnly: true, maxAge: 5 * 60 * 1000 });

    
    res.redirect('/accounts/verifyotp');
});



router.get('/verifyotp', (req, res) => {
    res.render('Accounts/verifyotp');
});


router.post('/verifyotp', async (req, res) => {
    const otp = req.body.otp;
    const token = req.cookies.resetToken;

    if (!token) {
        return res.render("Accounts/verifyotp", { error: "Missing or expired token." });
    }

    let email;
    try {
        const decoded = verifyToken(token);  
        email = decoded.email;
    } catch(err) {
        return res.render("Accounts/verifyotp", { error: "Invalid or expired token." });
    }

    const recordedOTP = await accountService.getOTP(email);
    if (!recordedOTP) {
        return res.render("Accounts/verifyotp", { error: "OTP expired or not found." });
    }

    if (recordedOTP.code !== otp) {
        return res.render("Accounts/verifyotp", { error: "Invalid OTP." });
    }

    
    await accountService.deleteOTP(email);

    
    res.redirect('/accounts/resetpassword');
});


router.get('/resetpassword', (req, res) => {
    res.render('Accounts/resetpassword');
});


router.post('/resetpassword', async (req, res) => {
    const token = req.cookies.resetToken;

    if (!token) {
        return res.render("Accounts/resetpassword", { error: "Missing or expired token." });
    }

    let email;
    try {
        const decoded = verifyToken(token);  
        email = decoded.email;
    } catch(err) {
        return res.render("Accounts/resetpassword", { error: "Invalid or expired token." });
    }

    const newPassword = req.body.password

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await accountService.updatePassword(email, hashedPassword)
    res.clearCookie('resetToken')
    res.render('Accounts/resetpassword', {success: "Password has been changed.", disabled: true });
});


router.post('/signout', isAuth, function (req, res) {
  res.clearCookie('authToken');
  const retUrl = req.headers.referer || '/';
  res.redirect(retUrl);
});

export default router;