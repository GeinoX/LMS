const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'teacher', required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'admin', required: true },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('file', uploadSchema);
