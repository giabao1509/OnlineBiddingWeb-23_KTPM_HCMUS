// import dotenv from "dotenv";
// dotenv.config({ path: './.env' });

console.log('API KEY =', process.env.CLOUD_API_KEY);

import * as cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export default cloudinary;