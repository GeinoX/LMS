// models/subjectSchema.js
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  // Track who uploaded the file and whether it's an exam response
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId
  },
  uploadedByRole: {
    type: String,
    enum: ['admin','teacher','student','other'],
    default: 'other'
  },
  forExam: {
    type: Boolean,
    default: false
  },
  compressionLevel: String,
  compressionMode: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const subjectSchema = new mongoose.Schema({
  subName: {
    type: String,
    required: true,
  },
  subCode: {
    type: String,
    required: true,
  },
  sessions: {
    type: Number,
    required: true,
  },
  sclassName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sclass',
    required: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'teacher',
  },
  // Optional exam metadata
  type: {
    type: String,
    enum: ['Regular','Exam'],
    default: 'Regular'
  },
  examStart: Date,
  examEnd: Date,
  allowStudentUploads: {
    type: Boolean,
    default: false
  },
  files: [fileSchema] // Nouveau champ pour les fichiers
}, { timestamps: true });

module.exports = mongoose.model("subject", subjectSchema);