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
        next();
    } catch(err) {
        res.clearCookie('authToken');
        req.flash('error', 'Please sign in to continue');
        res.redirect('/accounts/signin');
    }
}

export function isAdmin(req, res, next) {
    if (req.user && Number(req.user.role) === 2) return next();
    req.flash('error', 'Access denied');
    res.redirect('/');
}

export function isSeller(req, res, next) {
    if (req.user && Number(req.user.role) === 1) return next();
    req.flash('error', 'Access denied');
    res.redirect('/');
}

export function isBuyer(req, res, next) {
    if (req.user && Number(req.user.role) === 0) return next();
    req.flash('error', 'Access denied');
    res.redirect('/');
}

export async function attachLayoutData(req, res, next) {
    // JWT
    const token = req.cookies.authToken;
    if (token) {
        try {
            const decoded = verifyToken(token);
            res.locals.user = decoded;
            res.locals.isSeller = Number(decoded.role) === 1;
            res.locals.isAdmin = Number(decoded.role) === 2;
            res.locals.isBuyer = Number(decoded.role) === 0;
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


    } catch (err) {
        console.log("Error fetching categories:", err.message);
        res.locals.categories = [];
    }

    res.locals.messages = req.flash();

    next();
}

