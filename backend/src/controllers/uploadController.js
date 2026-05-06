// @POST /api/upload/image
const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: { url, filename: req.file.filename },
  });
};

// @POST /api/upload/images (multiple)
const uploadImages = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No image files provided' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const data = req.files.map((file) => ({
    url: `${baseUrl}/uploads/${file.filename}`,
    filename: file.filename,
  }));

  res.json({ success: true, data });
};

// @POST /api/upload/video
const uploadVideo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No video file provided' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: { url, filename: req.file.filename },
  });
};

module.exports = { uploadImage, uploadImages, uploadVideo };
