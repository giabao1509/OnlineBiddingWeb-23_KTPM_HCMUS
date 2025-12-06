import axios from "axios";

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
