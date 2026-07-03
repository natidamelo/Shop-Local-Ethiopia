const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== 'your_api_secret'
  );
};

// @POST /api/upload/image
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    if (isCloudinaryConfigured()) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'shopl',
      });
      // Delete temporary local file
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
      return res.json({
        success: true,
        data: { url: result.secure_url, filename: result.public_id },
      });
    }

    // Fallback to local uploads
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      data: { url, filename: req.file.filename },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/upload/images (multiple)
const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }

    if (isCloudinaryConfigured()) {
      const uploadPromises = req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'shopl',
        });
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Failed to delete temp file:', err);
        }
        return {
          url: result.secure_url,
          filename: result.public_id,
        };
      });
      const data = await Promise.all(uploadPromises);
      return res.json({ success: true, data });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const data = req.files.map((file) => ({
      url: `${baseUrl}/uploads/${file.filename}`,
      filename: file.filename,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @POST /api/upload/video
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    if (isCloudinaryConfigured()) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'video',
        folder: 'shopl',
      });
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
      return res.json({
        success: true,
        data: { url: result.secure_url, filename: result.public_id },
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      data: { url, filename: req.file.filename },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage, uploadImages, uploadVideo };

