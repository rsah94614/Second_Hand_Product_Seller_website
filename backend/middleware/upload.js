// const multer = require('multer');

// const storage = multer.diskStorage({
//     filename:function (req, file, callback) {
//       callback(null,file.originalname);
//     }
//   })
  
// const upload = multer({ storage });

// module.exports = upload;

/* Better version by chatgpt*/

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
// });


/*By CODEX*/

const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination:function (req, file, callback) {
      callback(null, uploadDir);
    },
    filename:function (req, file, callback) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname);
      callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });

const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.mimetype.startsWith('image/') && allowedTypes.includes(ext)) {
    return cb(null, true);
  }

  cb(new Error('Only valid image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
