import multer from 'multer';
import { AppError } from '../lib/errors';
import cloudinary from '../config/cloudinary';

// Memory storage for multer
const storage = multer.memoryStorage();

// File filter (jpg, png, webp)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPG, PNG, and WebP are allowed.', 400));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter,
});

// Helper function to upload buffer stream to Cloudinary
export const uploadToCloudinary = async (fileBuffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(new AppError('Failed to upload image to Cloudinary', 500));
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new AppError('Unknown error during upload', 500));
        }
      }
    );
    
    uploadStream.end(fileBuffer);
  });
};
