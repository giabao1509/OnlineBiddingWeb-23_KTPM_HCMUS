import axios from "axios";
import { verifyToken } from '../utils/jwt.js';
import * as categoryService from '../services/category.service.js';
export async function verifyCaptcha(req, res, next) {
  const token = req.body["g-recaptcha-response"];

  if (!token) {
    return res.render('Accounts/signup', {
      error: "Captcha verification failed.",
      RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
      fullName: req.body.fullName,
      email: req.body.email,
      address: req.body.address
    });
  }

  try {
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );

    if (!response.data.success) {
      return res.render('Accounts/signup', {
        error: "Captcha verification failed.",
        RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
        fullName: req.body.fullName,
        email: req.body.email,
        address: req.body.address
      });
    }

    next();

  } catch (err) {
    return res.render('Accounts/signup', {
      error: "Captcha verification error. Please try again.",
      RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,
      fullName: req.body.fullName,
      email: req.body.email,
      address: req.body.address
    });
  }
}



export function isAuth(req, res, next) {
    const token = req.cookies.authToken;
    if (!token) return res.redirect('/accounts/signin');

    try {
        req.user = verifyToken(token);
        //console.log(req.user)
        next();
    } catch(err) {
        res.clearCookie('authToken');
        res.redirect('/accounts/signin');
    }
}

export function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') return next();
    res.status(403).send('Access denied');
}

export async function attachLayoutData(req, res, next) {
    // JWT
    const token = req.cookies.authToken;
    if (token) {
        try {
            const decoded = verifyToken(token);
            res.locals.user = decoded;
            res.locals.isSeller = decoded.role === 1;

        } catch {
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }

    try {
        let categories = await categoryService.getCategories();
        
        // Get the selected category from req.query
        const selectedCategory = req.query.category || '';

        for (let cat of categories) {
            const subCats = await categoryService.getSubCategories(cat.id);
            cat.subCategories = subCats.map(sub => ({
                ...sub,
                selected: sub.id.toString() === selectedCategory
            }));
            // Mark the parent category as selected if needed
            cat.selected = cat.id.toString() === selectedCategory;
        }

        res.locals.categories = categories;

        // Sort options
        const sortOptions = [
            { value: 'newest', name: 'Newest' },
            { value: 'ending_soon', name: 'Ending Soon' },
            { value: 'price_low', name: 'Price: Low → High' },
            { value: 'price_high', name: 'Price: High → Low' },
            { value: 'most_bids', name: 'Most Bids' }
        ];
        const selectedSort = req.query.sort || 'newest';
        res.locals.sortOptions = sortOptions.map(opt => ({
            ...opt,
            selected: opt.value === selectedSort
        }));


    } catch (err) {
        console.log("Error fetching categories:", err.message);
        res.locals.categories = [];
        res.locals.sortOptions = [];
    }

    next();
}

