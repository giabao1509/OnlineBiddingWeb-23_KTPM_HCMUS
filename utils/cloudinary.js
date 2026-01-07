
import * as cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});


export async function deleteImageByPublicId(publicId) {
    try {
        if (!publicId) {
            throw new Error('public_id is required to delete image');
        }

        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Deleted image:', result);
        return result;
    } catch (err) {
        console.error('Error deleting image:', err);
        throw err;
    }
}



export default cloudinary;