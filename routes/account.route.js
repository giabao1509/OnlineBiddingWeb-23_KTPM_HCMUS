import express from 'express';
import bcrypt from 'bcryptjs';
import * as accountService from '../services/account.service.js';
import * as productsService from '../services/product.service.js';
import * as upgradeRequestService from '../services/upgrade_request.service.js';
import { verifyCaptcha, isAuth} from '../middlewares/auth.mdw.js';
import { generateToken, generateOTPToken, verifyToken } from '../utils/jwt.js';
import { sendOTPEmail, generateOTP } from '../utils/otp.js';
import { OAuth2Client } from 'google-auth-library';
import { create } from 'express-handlebars';



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
        created_at: new Date(),
        role: 0
    };

    const existingAccount = await accountService.getAccountByEmail(req.body.email);
    if (existingAccount) {
        req.flash('error', 'This email is already registered. Please log in or use another email.');
        return res.render('Accounts/signup', {
            RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
            fullName: req.body.fullName,
            email: req.body.email,
            address: req.body.address
        });
    }



    const recordedOTP = await accountService.getOTP(req.body.email)

    if (!recordedOTP) {
        req.flash('error', 'You have not requested an OTP or the OTP has expired.');
        return res.render('Accounts/signup', {
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
    req.flash('success', 'Account created successfully! You can now log in.');
    return res.render('Accounts/signup', {
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

  await sendOTPEmail(email, otp_code);

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
    const remember = req.body.remember === 'on';
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
        req.flash('error', 'Invalid email or password.');
        return res.render('Accounts/signin', { 
            email: email,
            RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY
        });
    }

    if (user.status === 'Blocked') {
        req.flash('error', 'Your account has been blocked. Please contact support for assistance.');
        return res.render('Accounts/signin', {
            email: email,
            RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY
        });
    }

    const tokenAge = remember ? 7*24*3600*1000 : 3600*1000; // 7 days or 1 hour
    const token = generateToken(user);
    res.cookie('authToken', token, { httpOnly: true, maxAge: tokenAge });

    req.flash('success', 'Signin successfully.');
    const retUrl = req.headers.referer || '/';
    res.redirect(retUrl);
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

    const jwtToken = generateToken(user);

    res.cookie('authToken', jwtToken, { httpOnly: true, maxAge: 3600*1000 });
    req.flash('success', 'Signin successfully.');
    res.json({ success: true });
    // res.redirect('/');

  } catch (err) {
    //console.error(err);
    //res.status(401).json({ message: 'Invalid Google token' });
    req.flash('error', 'Google sign-in failed. Please try again.');
    res.render('Accounts/signin', { 
        RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY
    });
  }
});

router.get('/dashboard', isAuth, async (req, res) => { 
    res.render('Buyer/dashboard');
});


router.get('/forgotpassword', async (req, res) => { 
    res.render('Accounts/forgotpassword');
});

router.post('/forgotpassword', async (req, res) => { 
    const email = req.body.email;
    const user = await accountService.getAccountByEmail(email);
    
    if (!user) {
        req.flash('error', 'This email is not registered in our system.');
        return res.redirect('/accounts/forgotpassword');
    }

    if (user.googleId) {
        req.flash('error', 'Password reset is not available for Google-linked accounts. Please sign in with Google.');
        return res.redirect('/accounts/forgotpassword');
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


    await sendOTPEmail(email, otp_code);

    
    const token = generateOTPToken(email);

    
    res.cookie('resetToken', token, { httpOnly: true, maxAge: 5 * 60 * 1000 });

    req.flash('success', 'An OTP has been sent to your email. Please verify to reset your password.');
    res.redirect('/accounts/verifyotp');
});



router.get('/verifyotp', (req, res) => {
    res.render('Accounts/verifyotp');
});


router.post('/verifyotp', async (req, res) => {
    const otp = req.body.otp;
    const token = req.cookies.resetToken;

    if (!token) {
        req.flash('error', 'Missing or expired token.');
        return res.render("Accounts/verifyotp");
    }

    let email;
    try {
        const decoded = verifyToken(token);  
        email = decoded.email;
    } catch(err) {
        req.flash('error', 'Invalid or expired token.');
        return res.render("Accounts/verifyotp");
    }

    const recordedOTP = await accountService.getOTP(email);
    if (!recordedOTP) {
        req.flash('error', 'OTP expired or not found.');
        return res.render("Accounts/verifyotp");
    }

    if (recordedOTP.code !== otp) {
        req.flash('error', 'Invalid OTP.');
        return res.render("Accounts/verifyotp");
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
        req.flash('error', 'Missing or expired token.');
        return res.render("Accounts/resetpassword");
    }

    let email;
    try {
        const decoded = verifyToken(token);  
        email = decoded.email;
    } catch(err) {
        req.flash('error', 'Invalid or expired token.');
        return res.render("Accounts/resetpassword");
    }

    const newPassword = req.body.password

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await accountService.updatePassword(email, hashedPassword)
    res.clearCookie('resetToken')
    req.flash('success', 'Password has been changed.');
    res.render('Accounts/resetpassword', { disabled: true });
});

router.get('/profile', isAuth, async (req, res) => {

    const userRating = await accountService.getUserRatingById(req.user.id);
    userRating.rating_percent = Number(userRating.rating_score) * 100;
    const activeBids = await productsService.countAllBiddingAuctions(req.user.id);
    const wonAuctions = await productsService.countAllWonAuctions(req.user.id);
    const watchlist = await productsService.countAllWatchListItems(req.user.id);
    const stats = {
        activeBids: activeBids.count,
        wonAuctions: wonAuctions.count,
        watchlist: watchlist.count
    };
    const userBasicInfo = await accountService.getAccountByEmail(req.user.email);
    const upgrade_request = await upgradeRequestService.getUpgradeRequestByCustomerId(req.user.id);

    //console.log('Upgrade request:', upgrade_request);
    res.render('Accounts/profile', {
        stats,
        userBasicInfo,
        userRating: userRating,
        upgrade_request: upgrade_request 
    });
});

router.post('/profile/update', isAuth, async (req, res) => {
    const updatedData = {
        full_name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        oldPassword: req.body.oldPassword,
        newPassword: req.body.newPassword,
        confirmPassword: req.body.confirmPassword
    };

    const existingAccount = await accountService.getAccountByEmail(req.body.email);
    if (existingAccount) {
        if (existingAccount.id !== req.user.id) {
            req.flash('error', 'This email is already registered. Please use another email.');
            return res.redirect('/accounts/profile');
        }
    }

    if (updatedData.newPassword) {
        const user = await accountService.getAccountByEmail(req.user.email);
        if (!bcrypt.compareSync(updatedData.oldPassword, user.password)) {
            req.flash('error', 'Old password is incorrect.');
            return res.redirect('/accounts/profile');
        }
        
        updatedData.password = bcrypt.hashSync(updatedData.newPassword, 10);
    }

    delete updatedData.oldPassword;
    delete updatedData.newPassword;
    delete updatedData.confirmPassword;

    await accountService.updateAccount(req.user.id, updatedData);


    req.flash('success', 'Profile updated successfully.');
    res.redirect('/accounts/profile');
});


router.post('/profile/upgrade_seller', isAuth, async (req, res) => {
    try {
        await upgradeRequestService.createUpgradeRequest({
            customer_id: req.user.id,
        });
        req.flash('success', 'Your account has been upgraded to Seller.');
        res.redirect('/accounts/profile');
    }
    catch (err) {
        console.error(err);
        req.flash('error', 'An error occurred while upgrading your account. Please try again later.');
        res.redirect('/accounts/profile');
    }
});

router.get('/external_profile/:id',  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const offset = (page - 1) * limit;
    const userId = req.params.id;
    const user = await accountService.getUserExternalInfo(Number(userId));
    const userInfo = user[0];
    let reviews = [];
    if (userInfo) {

        userInfo.rating_percent = Number(userInfo.rating_score) * 100;
        //console.log('User rating score:', userInfo);
        reviews = await accountService.getAllUserRatings(Number(userId), limit, offset);
        reviews.forEach(r => {
            r.rating = Number(r.rating);
        });
        //console.log('User fetched:', userInfo);
        //console.log('Fetched reviews:', reviews);
    }
    res.render('Accounts/externalprofile', {
        userInfo: userInfo,
        reviews: reviews,
        currentPage: page,
        userNotFound: !userInfo
    });
});


router.get('/external_profile/:id/reviews', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const offset = (page - 1) * limit;
    const userId = req.params.id;

    const reviews = await accountService.getAllUserRatings(userId, limit, offset);
    //console.log('Fetched reviews:', reviews);
    res.json({
    reviews,
    hasMore: reviews.length === limit
    });
});

router.get('/my_auctions', isAuth, async (req, res) => {
    const activeTab = req.query.tab || 'bidding';
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;
    const role = await accountService.getAccountRoleById(req.user.id);
    const isSellerUpdated = Number(role.role) === 1;
    let totalProducts;
    
    let biddingItems = [];
    if (activeTab === 'bidding') {
        totalProducts = await productsService.countAllBiddingAuctions(req.user.id);
        biddingItems = await productsService.getBiddingAuctionsByUserId(req.user.id, limit, offset);
        biddingItems.forEach(item => {
            item.yourbid = item.yourbid ? Number(item.yourbid) : 0;
            item.currentBid = item.currentBid ? Number(item.currentBid) : 0;
        });
        console.log('Bidding items:', biddingItems);
    }

    let watchlist = [];
    if (activeTab === 'watchlist') {
        totalProducts = await productsService.countAllWatchListItems(req.user.id);
        watchlist = await productsService.getWatchListByUserId(req.user.id, limit, offset);
        console.log('Watchlist items:', watchlist);
    }

    let wonAuctions = [];
    if (activeTab === 'won') {
        totalProducts = await productsService.countAllWonAuctions(req.user.id);
        wonAuctions = await productsService.getWonAuctionsByUserId(req.user.id, limit, offset);
        console.log('Won auctions:', wonAuctions);
    }

    
    let activeAuctions = [];
    if (activeTab === 'active' && isSellerUpdated) {
        totalProducts = await productsService.countAllActiveAuctionsBySeller(req.user.id);
        activeAuctions = await productsService.getActiveAuctionsBySellerId(req.user.id, limit, offset);
        console.log('Active auctions:', activeAuctions);
    }

    let soldItems = [];
    if (activeTab === 'sold' && isSellerUpdated) {
        totalProducts = await productsService.countAllSoldItemsBySeller(req.user.id);
        soldItems = await productsService.getSoldItemsBySellerId(req.user.id, limit, offset);
        console.log('Sold items:', soldItems);
    }
    
    if (!totalProducts) {
        totalProducts = { count: 0 };
    }

    const totalPages = Math.ceil(Number(totalProducts.count) / limit);
    const prevPage = page > 1 ? page - 1 : 1;
    const nextPage = page < totalPages ? page + 1 : totalPages;
    const isFirstPage = page === 1;
    const isLastPage = page === totalPages;
    
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push({ number: i, active: i === page });
    }


    res.render('Accounts/myauctions', {
        activeTab,
        biddingItems,
        watchlist,
        wonAuctions,
        activeAuctions,
        soldItems,
        isSellerUpdated,
        currentPage: page,
        totalPages,
        prevPage,
        nextPage,
        isFirstPage,
        isLastPage,
        pages
    });
});



router.post('/signout', isAuth, function (req, res) {
  res.clearCookie('authToken');
  const retUrl = req.headers.referer || '/';
  res.redirect(retUrl);
});

export default router;