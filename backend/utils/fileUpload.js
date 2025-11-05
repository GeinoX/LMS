const multer = require('multer');
const path = require('path');
const fs = require('fs');

const subjectStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/subjects/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'subject-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const examResponseStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/exam-responses/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'exam-response-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadSubject = multer({
  storage: subjectStorage,
  limits: {
    fileSize: 200 * 1024 * 1024,
    files: 10
  },
  fileFilter: function (req, file, cb) {
    cb(null, true);
  }
});

const uploadExamResponse = multer({
  storage: examResponseStorage,
  limits: {
    fileSize: 200 * 1024 * 1024,
    files: 10
  },
  fileFilter: function (req, file, cb) {
    cb(null, true);
  }
});

module.exports = { uploadSubject, uploadExamResponse };
