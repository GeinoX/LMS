const mongoose = require("mongoose")

const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "Teacher"
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true,
    },
    // Support multiple subjects per teacher (array). Keep a virtual `teachSubject`
    // for backward-compatibility with frontend code that expects a single subject.
    teachSubjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
    }],
    teachSclass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true,
    },
    attendance: [{
        date: {
            type: Date,
            required: true
        },
        presentCount: {
            type: String,
        },
        absentCount: {
            type: String,
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for backward compatibility: return first subject from teachSubjects
teacherSchema.virtual('teachSubject').get(function () {
    if (!this.teachSubjects) return undefined;
    // If populated, return populated doc; otherwise return the id
    return Array.isArray(this.teachSubjects) && this.teachSubjects.length > 0
        ? this.teachSubjects[0]
        : undefined;
});

module.exports = mongoose.model("teacher", teacherSchema)