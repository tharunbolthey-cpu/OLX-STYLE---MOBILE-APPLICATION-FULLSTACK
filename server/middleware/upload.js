const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '../uploads');

if (!fs.existsSync(dir))
  fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, dir),

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    cb(
      null,
      `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    );
  }
});

const fileFilter = (req, file, cb) =>
  /^image\/(jpeg|png|webp|jpg)$/.test(file.mimetype)
    ? cb(null, true)
    : cb(
        new Error(
          'Only JPG, PNG and WEBP images are allowed'
        )
      );

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8
  }
});