import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'auction_products', // folder bạn đã tạo trên Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

export default upload;