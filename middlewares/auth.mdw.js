import axios from "axios";
export async function verifyCaptcha(req, res, next) {
  const token = req.body["g-recaptcha-response"];

  if (!token) {
    return res.status(400).send("Missing captcha");
  }

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
    return res.status(400).send("Captcha verification failed");
  }

  next();
}
