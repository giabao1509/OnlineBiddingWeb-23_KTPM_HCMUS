import express from 'express';
import bcrypt from 'bcryptjs';
import * as accountService from '../services/account.service.js';
import { verifyCaptcha, isAuth} from '../middlewares/auth.mdw.js';
import { generateToken, generateOTPToken, verifyToken } from '../utils/jwt.js';
import { sendOTPEmail, generateOTP } from '../utils/otp.js';
import { OAuth2Client } from 'google-auth-library';



const router = express.Router();

router.get('/signup', (req, res) => {
    res.render('Accounts/signup', {
        RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
        googleClientId: process.env.GOOGLE_CLIENT_ID
    });
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
        RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
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
    res.render('Accounts/signin', {
        RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
        googleClientId: process.env.GOOGLE_CLIENT_ID
    });
});

router.post('/signin', async (req, res) => {
    const email = req.body.email
    const password = req.body.password 
    const user = await accountService.getAccountByEmail(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.render('Accounts/signin', { 
            error: 'Email or password is incorrect',
            email: email,
            RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY
        });
    }

    const token = generateToken(user);
    res.cookie('authToken', token, { httpOnly: true, maxAge: 3600*1000 });
    res.redirect('/accounts/dashboard');
});


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
router.post('/google-signin', async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ message: 'Missing token' });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture } = payload;

    let user = await accountService.getAccountByGoogleId(googleId);

    if (!user) {
      user = await accountService.getAccountByEmail(email);

      if (user) {
        await accountService.linkGoogleId(user.id, googleId);
      } else {
        const [newUser] = await accountService.addAccount({
          full_name: `${firstName} ${lastName}`,
          email,
          password: null,
          googleId,
          created_at: new Date(),
          role: 0,
          address: null
        });

        user = newUser;
      }
    }

    const jwtToken = generateToken({ userId: user.id, email: user.email, role: user.role },);

    res.cookie('authToken', jwtToken, { httpOnly: true, maxAge: 3600*1000 });
    res.json({ success: true, user });

  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

router.get('/dashboard', isAuth, async (req, res) => { 
    res.render('dashboard');
});


router.get('/forgotpassword', async (req, res) => { 
    res.render('Accounts/forgotpassword');
});

router.post('/forgotpassword', async (req, res) => { 
    const email = req.body.email;
    
    const user = await accountService.getAccountByEmail(email);
    if (!user) {
        return res.render('Accounts/forgotpassword', {
            error: 'This email is not registered in our system.'
        });
    }
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

router.get('/profile', (req, res) => {

      const stats = {
    activeBids: 3,
    wonAuctions: 1,
    watchlist: 4,
    totalSpent: 12.5
};

const activeBids = [
    {
        id: 101,
        title: "iPhone 14 Pro Max 256GB",
        category: "Điện thoại",
        image: "/img/products/iphone14.jpg",
        yourBid: 21000000,
        currentBid: 21500000,
        isWinning: false,
        timeRemaining: "2 giờ 15 phút"
    },
    {
        id: 102,
        title: "Laptop ASUS ROG Strix G15",
        category: "Laptop Gaming",
        image: "/img/products/rog-g15.jpg",
        yourBid: 15000000,
        currentBid: 14800000,
        isWinning: true,
        timeRemaining: "45 phút"
    }
];

const endingSoon = [
    {
        id: 201,
        title: "Tai nghe AirPods Pro 2",
        image: "/img/products/airpods2.jpg",
        currentBid: 4200000,
        timeLeft: "12 phút"
    },
    {
        id: 202,
        title: "Đồng hồ Casio G-SHOCK",
        image: "/img/products/gshock.jpg",
        currentBid: 2800000,
        timeLeft: "25 phút"
    }
];

const wonAuctions = [
    {
        orderId: 3001,
        title: "Chuột Logitech G Pro Wireless",
        image: "/img/products/logitech-gpro.jpg",
        winningBid: 1800000,
        isPaid: true
    },
    {
        orderId: 3002,
        title: "Monitor LG Ultrawide 29''",
        image: "/img/products/lg-ultrawide.jpg",
        winningBid: 4500000,
        isPaid: false
    }
];

const watchlist = [
    {
        id: 401,
        title: "PS5 Slim Digital Edition",
        image: "/img/products/ps5.jpg",
        currentBid: 9500000,
        timeLeft: "3 giờ"
    },
    {
        id: 402,
        title: "Bàn phím cơ Keychron K4",
        image: "/img/products/keychron-k4.jpg",
        currentBid: 1600000,
        timeLeft: "1 giờ 20 phút"
    }
];
    res.render('Accounts/profile', {
        stats,
        activeBids,
        endingSoon,
        wonAuctions,
        watchlist
    });
});





router.post('/signout', isAuth, function (req, res) {
  res.clearCookie('authToken');
  const retUrl = req.headers.referer || '/';
  res.redirect(retUrl);
});

export default router;