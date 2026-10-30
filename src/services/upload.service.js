import { Readable } from 'stream';
import cloudinary from '../configs/cloudinary.config.js';

export const uploadImage = (fileBuffer, folder = 'sgroup_uploads') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};
