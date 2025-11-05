const Subject = require('../models/subjectSchema.js');
const mongoose = require('mongoose');
const Teacher = require('../models/teacherSchema.js');
const Student = require('../models/studentSchema.js');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const { uploadSubject, uploadExamResponse } = require('../utils/fileUpload.js');

// Fonction de création de subject (sans middleware intégré)
const subjectCreate = async (req, res) => {
  try {
    console.log('=== SERVER: SUBJECT CREATE ===');
    console.log('Files received:', req.files ? req.files.length : 0);

    // Afficher les détails de chaque fichier reçu
    if (req.files) {
      req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`);
        console.log('  - Original name:', file.originalname);
        console.log('  - Saved name:', file.filename);
        console.log('  - Size:', file.size, 'bytes');
        console.log('  - Path:', file.path);
        console.log('  - Mime type:', file.mimetype);

        // Vérifier si le fichier existe physiquement
        if (fs.existsSync(file.path)) {
          const stats = fs.statSync(file.path);
          console.log('  - Physical file size:', stats.size, 'bytes');
        } else {
          console.log('  - PHYSICAL FILE NOT FOUND!');
        }
      });
    }

    const { sclassName, adminID, subjects, compressionLevel, compressionMode } = req.body;

    // Validate subjects payload before parsing
    if (!subjects) {
      return res.status(400).json({ success: false, message: 'Missing subjects payload' });
    }

    let subjectsArray;
    try {
      subjectsArray = JSON.parse(subjects);
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: 'Invalid subjects payload (must be valid JSON)' });
    }

    // Traitement des fichiers
    const isCompressedByFile = (file) => {
      if (!file) return false;
      const name = (file.originalname || '').toLowerCase();
      const mt = (file.mimetype || '').toLowerCase();
      if (mt.includes('zip') || mt.includes('gzip') || mt.includes('compressed') ) return true;
      return name.endsWith('.zip') || name.endsWith('.gz') || name.endsWith('.7z') || name.endsWith('.rar');
    };

    const fileData = req.files ? req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      compressionLevel: compressionLevel || 'medium',
      compressionMode: compressionMode || 'individual',
      uploadedAt: new Date(),
      // detect if this uploaded file is already compressed (e.g., ZIP/GZ produced by client)
      isCompressed: isCompressedByFile(file)
    })) : [];

    console.log('Files to save in database:', fileData);

    // Create subjects with files
    const createdSubjects = [];
    for (const subjectData of subjectsArray) {
      const subject = new Subject({
        subName: subjectData.subName,
        subCode: subjectData.subCode,
        sessions: Number(subjectData.sessions) || 0,
        sclassName: sclassName,
        school: adminID,
        files: fileData,
        // optional exam metadata
        type: subjectData.type || 'Regular',
        examStart: subjectData.examStart ? new Date(subjectData.examStart) : undefined,
        examEnd: subjectData.examEnd ? new Date(subjectData.examEnd) : undefined,
        allowStudentUploads: !!subjectData.allowStudentUploads
      });

      const existingSubject = await Subject.findOne({
        subName: subjectData.subName,
        subCode: subjectData.subCode,
        sclassName: sclassName
      });

      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: `Subject ${subjectData.subName} already exists`
        });
      }

      const result = await subject.save();
      createdSubjects.push(result);
    }

    console.log('✅ Subjects created successfully:', createdSubjects.length);
    res.status(201).json({
      success: true,
      message: `${createdSubjects.length} subject(s) created successfully`,
      subjects: createdSubjects
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Fonction pour télécharger un fichier
const downloadFile = async (req, res) => {
  try {
    const { subjectId, fileId } = req.params;
    const { teacherID, userID, adminID, studentID } = { ...req.query, ...req.body };

    const subject = await Subject.findById(subjectId).select('files teacher school sclassName');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject non trouvé' });
    }

    // Admins allowed if adminID provided (lightweight check)
    if (adminID) {
      // Admin can download any file
    } else if (studentID) {
      // Check if student is in the same class as the subject
      const student = await Student.findById(studentID).select('sclassName');
      if (!student) {
        return res.status(401).json({ success: false, message: 'Unauthorized: invalid studentID' });
      }
      if (String(subject.sclassName) !== String(student.sclassName)) {
        return res.status(403).json({ success: false, message: 'Accès refusé: étudiant non autorisé pour ce subject' });
      }
    } else {
      // Secure access for teachers: requester must be the subject teacher or have the subject in teachSubjects
      const requesterId = teacherID || userID; // frontend may send either
      if (!requesterId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: missing teacherID/adminID/studentID' });
      }

      const isDirectTeacher = subject.teacher && String(subject.teacher) === String(requesterId);
      let isTeacherWithSubject = false;
      if (!isDirectTeacher) {
        const teacherDoc = await Teacher.findById(requesterId).select('teachSubjects role');
        if (teacherDoc && Array.isArray(teacherDoc.teachSubjects)) {
          isTeacherWithSubject = teacherDoc.teachSubjects.some(sid => String(sid) === String(subjectId));
        }
      }
      if (!(isDirectTeacher || isTeacherWithSubject)) {
        return res.status(403).json({ success: false, message: 'Accès refusé: non autorisé pour ce subject' });
      }
    }

    const file = subject.files.id(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ success: false, message: 'Fichier non disponible sur le serveur' });
    }

    // Derive the REAL extension from the physical file (most reliable)
    const realExt = (path.extname(file.path || file.filename || file.originalName || '') || '').toLowerCase();
    const mimeMap = {
      '.zip': 'application/zip',
      '.gz': 'application/gzip',
      '.tgz': 'application/gzip',
      '.7z': 'application/x-7z-compressed',
      '.rar': 'application/vnd.rar',
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska', '.webm': 'video/webm',
      '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.aac': 'audio/aac'
    };
    const mimeType = mimeMap[realExt] || (file.mimetype || '').toLowerCase() || 'application/octet-stream';

    // Build a safe download filename that matches the real extension to avoid browser confusion
    const baseOriginal = path.parse(file.originalName || file.filename || 'download').name;
    const safeBase = String(baseOriginal).replace(/[^a-z0-9._-]/gi, '_');
    const downloadName = `${safeBase}${realExt || ''}`;

    let statSize = file.size;
    try {
      const stats = fs.statSync(file.path);
      statSize = stats.size;
    } catch (e) {}

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Length', statSize);

    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);

  } catch (err) {
    console.error('Erreur téléchargement fichier:', err);
    res.status(500).json({ success: false, message: 'Erreur lors du téléchargement', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

// Obtenir les fichiers d'un subject
const getSubjectFiles = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .select('files subName subCode sessions')
      .populate('sclassName', 'sclassName');
    
    if (!subject) {
      return res.status(404).json({ 
        success: false,
        message: 'Subject non trouvé' 
      });
    }

    res.json({
      success: true,
      subjectName: subject.subName,
      subjectCode: subject.subCode,
      sessions: subject.sessions,
      className: subject.sclassName?.sclassName,
      files: subject.files,
      totalFiles: subject.files.length
    });

  } catch (err) {
    console.error('Erreur récupération fichiers:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des fichiers',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Les autres fonctions existantes (gardez-les inchangées)
const allSubjects = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid school id' });
    }

    let subjects = await Subject.find({ school: req.params.id })
      .populate("sclassName", "sclassName")
      .select("subName subCode sessions sclassName files")
    if (subjects.length > 0) {
      res.send(subjects)
    } else {
      res.send({ message: "No subjects found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const classSubjects = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid class id' });
    }

    let subjects = await Subject.find({ sclassName: req.params.id })
      .select("subName subCode sessions files type examStart examEnd allowStudentUploads")
    if (subjects.length > 0) {
      // Attach per-file download URLs so clients (teacher/student) can download directly
      const host = req.get('host');
      const protocol = req.protocol;
      const subjectsWithUrls = subjects.map(subj => {
        const filesWithUrl = (subj.files || []).map(f => ({
          ...f.toObject ? f.toObject() : f,
          downloadUrl: `${protocol}://${host}/Subject/${subj._id}/file/${f._id}/download`
        }));
        return {
          _id: subj._id,
          subName: subj.subName,
          subCode: subj.subCode,
          sessions: subj.sessions,
          type: subj.type,
          examStart: subj.examStart,
          examEnd: subj.examEnd,
          allowStudentUploads: subj.allowStudentUploads,
          files: filesWithUrl
        };
      });

      res.send(subjectsWithUrls)
    } else {
      res.send({ message: "No subjects found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getSubjectDetail = async (req, res) => {
  try {
    const { userRole, userId } = req.query;

    let subject = await Subject.findById(req.params.id)
      .select("subName subCode sessions sclassName teacher files");
    if (subject) {
      subject = await subject.populate("sclassName", "sclassName")
      subject = await subject.populate("teacher", "name")

      // Filter files based on user role
      if (userRole === 'Student' && userId) {
        subject.files = subject.files.filter(file =>
          !file.forExam || (file.forExam === true && String(file.uploadedBy) === String(userId))
        );
      }
      // Teachers and Admins see all files

      res.send(subject);
    }
    else {
      res.send({ message: "No subject found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
}

const freeSubjectList = async (req, res) => {
  try {
    let subjects = await Subject.find({ sclassName: req.params.id, teacher: { $exists: false } })
      .select("subName subCode sessions files");
    if (subjects.length > 0) {
      res.send(subjects);
    } else {
      res.send({ message: "No subjects found" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Supprimer les fichiers physiques
    subject.files.forEach(file => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    });

    const deletedSubject = await Subject.findByIdAndDelete(req.params.id);

    // Remove the deleted subject from any teacher's teachSubjects array
    await Teacher.updateMany(
      { teachSubjects: deletedSubject._id },
      { $pull: { teachSubjects: deletedSubject._id } }
    );

    await Student.updateMany(
      {},
      { $pull: { examResult: { subName: deletedSubject._id } } }
    );

    await Student.updateMany(
      {},
      { $pull: { attendance: { subName: deletedSubject._id } } }
    );

    res.send(deletedSubject);
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ school: req.params.id });
    
    // Supprimer tous les fichiers physiques
    subjects.forEach(subject => {
      subject.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
        }
      });
    });

    const deletedSubjects = await Subject.deleteMany({ school: req.params.id });

    // Remove all deleted subjects from teachers' teachSubjects arrays
    const subjectIds = subjects.map(subject => subject._id);
    await Teacher.updateMany(
      { teachSubjects: { $in: subjectIds } },
      { $pull: { teachSubjects: { $in: subjectIds } } }
    );

    await Student.updateMany(
      {},
      { $set: { examResult: [], attendance: [] } }
    );

    res.send(deletedSubjects);
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteSubjectsByClass = async (req, res) => {
  try {
    const subjects = await Subject.find({ sclassName: req.params.id });
    
    // Supprimer tous les fichiers physiques
    subjects.forEach(subject => {
      subject.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
        }
      });
    });

    const deletedSubjects = await Subject.deleteMany({ sclassName: req.params.id });

    const subjectIdsByClass = subjects.map(subject => subject._id);
    await Teacher.updateMany(
      { teachSubjects: { $in: subjectIdsByClass } },
      { $pull: { teachSubjects: { $in: subjectIdsByClass } } }
    );

    await Student.updateMany(
      {},
      { $set: { examResult: [], attendance: [] } }
    );

    res.send(deletedSubjects);
  } catch (error) {
    res.status(500).json(error);
  }
};

// Fonction pour ajouter des fichiers à un subject existant (pour Teachers)
const addFilesToSubject = async (req, res) => {
  try {
    console.log('=== ADD FILES TO SUBJECT ===');
    console.log('Subject ID:', req.params.id);
    const { compressionLevel, compressionMode, uploaderId, uploaderRole, forExam } = req.body;

    // Normalize uploaderRole and forExam (moved to top to be available for conditional multer)
    const mapRole = (r) => {
      if (!r) return 'other';
      const rl = String(r).toLowerCase();
      if (rl === 'teacher') return 'teacher';
      if (rl === 'admin' || rl === 'administrator') return 'admin';
      if (rl === 'student') return 'student';
      return 'other';
    };
    const role = mapRole(uploaderRole);
    const isForExam = (forExam === 'true' || forExam === true || forExam === '1');

    // Conditionally apply multer middleware
    let uploadMiddleware;
    if (isForExam && role === 'student') {
      uploadMiddleware = uploadExamResponse.any();
    } else {
      uploadMiddleware = uploadSubject.any();
    }

    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, function (err) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    console.log('Files received:', req.files ? req.files.length : 0);

    // Require files after multer has processed them
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' });
    }

    // Load subject to enforce exam/upload rules
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      // Cleanup uploaded files
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch (e) { console.error('cleanup failed', e); }
        }
      });
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Server-side enforcement:
    // - Students may only upload when forExam=true AND subject.type==='Exam' AND allowStudentUploads===true AND within exam window
    // - Students cannot upload normal files
    if (role === 'Student') {
      if (!isForExam) {
        return res.status(403).json({ success: false, message: 'Students are not allowed to upload non-exam files' });
      }

      if (subject.type !== 'Exam' || !subject.allowStudentUploads) {
        return res.status(403).json({ success: false, message: 'Student uploads are not allowed for this subject' });
      }

      const now = new Date();
      if (subject.examStart && now < new Date(subject.examStart)) {
        return res.status(403).json({ success: false, message: 'Exam upload window has not started' });
      }
      if (subject.examEnd && now > new Date(subject.examEnd)) {
        return res.status(403).json({ success: false, message: 'Exam upload window has ended' });
      }
    }

    // Teachers/Admins (or others) can upload normally. If role is not provided assume teacher/admin behavior.

    // Helper to detect compressed uploads
    const isCompressedByFile = (file) => {
      if (!file) return false;
      const name = (file.originalname || '').toLowerCase();
      const mt = (file.mimetype || '').toLowerCase();
      if (mt.includes('zip') || mt.includes('gzip') || mt.includes('compressed') ) return true;
      return name.endsWith('.zip') || name.endsWith('.gz') || name.endsWith('.7z') || name.endsWith('.rar');
    };

    // Prepare file documents
    const fileData = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      compressionLevel: compressionLevel || 'medium',
      compressionMode: compressionMode || 'individual',
      uploadedAt: new Date(),
      uploadedBy: uploaderId || null,
      uploadedByRole: role,
      forExam: isForExam,
      isCompressed: isCompressedByFile(file)
    }));

    // Persist files to subject
    subject.files.push(...fileData);
    await subject.save();

    console.log('✅ Files added successfully');
    res.status(200).json({ success: true, message: `${fileData.length} file(s) added successfully`, files: fileData });

  } catch (error) {
    console.error('Error adding files:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fonction pour supprimer un fichier d'un subject
const deleteFileFromSubject = async (req, res) => {
  try {
    const { subjectId, fileId } = req.params;

    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const file = subject.files.id(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Supprimer le fichier physique
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Supprimer le fichier de la base de données
    subject.files.pull(fileId);
    await subject.save();

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fonction pour permettre à un Teacher de créer un subject (même comportement que pour Admin)
const teacherCreateSubject = async (req, res) => {
  try {
    console.log('=== SERVER: TEACHER SUBJECT CREATE ===');
    console.log('Files received:', req.files ? req.files.length : 0);

    const { sclassName, teacherID: bodyTeacherID, subjects, compressionLevel, compressionMode } = req.body;
    // teacherID may be provided in body or as route param (/Teacher/:id/SubjectCreate)
    const teacherID = bodyTeacherID || req.params.id;

    if (!teacherID) {
      return res.status(400).json({ success: false, message: 'Missing teacherID (body or route param)' });
    }

    if (!subjects) {
      return res.status(400).json({ success: false, message: 'Missing subjects payload' });
    }

    let subjectsArray;
    try {
      subjectsArray = JSON.parse(subjects);
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: 'Invalid subjects payload (must be valid JSON)' });
    }

    const isCompressedByFile = (file) => {
      if (!file) return false;
      const name = (file.originalname || '').toLowerCase();
      const mt = (file.mimetype || '').toLowerCase();
      if (mt.includes('zip') || mt.includes('gzip') || mt.includes('compressed')) return true;
      return name.endsWith('.zip') || name.endsWith('.gz') || name.endsWith('.7z') || name.endsWith('.rar');
    };

    const fileData = req.files ? req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      compressionLevel: compressionLevel || 'medium',
      compressionMode: compressionMode || 'individual',
      uploadedAt: new Date(),
      uploadedByRole: 'teacher',
      uploadedBy: teacherID,
      isCompressed: isCompressedByFile(file)
    })) : [];

    const createdSubjects = [];

    for (const subjectData of subjectsArray) {
      const subject = new Subject({
        subName: subjectData.subName,
        subCode: subjectData.subCode,
        sessions: Number(subjectData.sessions) || 0,
        sclassName: sclassName,
        school: req.body.school || undefined,
        teacher: teacherID,
        files: fileData,
        type: subjectData.type || 'Regular',
        examStart: subjectData.examStart ? new Date(subjectData.examStart) : undefined,
        examEnd: subjectData.examEnd ? new Date(subjectData.examEnd) : undefined,
        allowStudentUploads: !!subjectData.allowStudentUploads
      });

      const existingSubject = await Subject.findOne({
        subName: subjectData.subName,
        subCode: subjectData.subCode,
        sclassName: sclassName
      });

      if (existingSubject) {
        return res.status(400).json({ success: false, message: `Subject ${subjectData.subName} already exists` });
      }

      const result = await subject.save();
      createdSubjects.push(result);

      // Add the subject to teacher's teachSubjects array
      try {
        await Teacher.findByIdAndUpdate(teacherID, { $addToSet: { teachSubjects: result._id } });
      } catch (e) {
        console.warn('Could not update teacher with new subject:', e.message);
      }
    }

    res.status(201).json({ success: true, message: `${createdSubjects.length} subject(s) created successfully`, subjects: createdSubjects });

  } catch (error) {
    console.error('Server error (teacherCreateSubject):', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer uniquement les réponses d'exam pour un subject (uploadedByRole === 'student' && forExam === true)
const getExamResponses = async (req, res) => {
  try {
    const { teacherID, adminID } = { ...req.query, ...req.body };
    const subject = await Subject.findById(req.params.id).select('files subName subCode teacher');
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // Admins can always access, teachers need to be linked to the subject
    if (!adminID) {
      // Teacher must be linked to subject
      if (!teacherID) {
        return res.status(401).json({ success: false, message: 'Unauthorized: missing teacherID/adminID' });
      }
      const isDirectTeacher = subject.teacher && String(subject.teacher) === String(teacherID);
      let isTeacherWithSubject = false;
      if (!isDirectTeacher) {
        const teacherDoc = await Teacher.findById(teacherID).select('teachSubjects');
        if (teacherDoc && Array.isArray(teacherDoc.teachSubjects)) {
          isTeacherWithSubject = teacherDoc.teachSubjects.some(sid => String(sid) === String(subject._id));
        }
      }
      if (!(isDirectTeacher || isTeacherWithSubject)) {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
      }
    }

    const responses = (subject.files || []).filter(f => f.forExam === true && String(f.uploadedByRole).toLowerCase() === 'student');

    res.json({ success: true, subjectName: subject.subName, subjectCode: subject.subCode, responses, totalResponses: responses.length });
  } catch (err) {
    console.error('Error getting exam responses:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Stream a ZIP of all student exam responses for a given subject
const zipExamResponsesForSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const subject = await Subject.findById(subjectId).select('files subName teacher');
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const { teacherID, adminID } = { ...req.query, ...req.body };

    // Admins can always access, teachers need to be linked to the subject
    if (!adminID) {
      if (!teacherID) return res.status(401).json({ success: false, message: 'Unauthorized: missing teacherID/adminID' });
      const isDirectTeacher = subject.teacher && String(subject.teacher) === String(teacherID);
      let isTeacherWithSubject = false;
      if (!isDirectTeacher) {
        const teacherDoc = await Teacher.findById(teacherID).select('teachSubjects');
        if (teacherDoc && Array.isArray(teacherDoc.teachSubjects)) {
          isTeacherWithSubject = teacherDoc.teachSubjects.some(sid => String(sid) === String(subjectId));
        }
      }
      if (!(isDirectTeacher || isTeacherWithSubject)) {
        return res.status(403).json({ success: false, message: 'Not authorized to download responses for this subject' });
      }
    }

    const responses = (subject.files || []).filter(f => f.forExam === true && String(f.uploadedByRole).toLowerCase() === 'student');

    if (!responses || responses.length === 0) {
      return res.status(404).json({ success: false, message: 'No exam responses found for this subject' });
    }

    const archive = archiver('zip', { zlib: { level: 6 } });
    res.attachment(`${subject.subName || 'subject'}_${subjectId}_responses.zip`);
    res.setHeader('Content-Type', 'application/zip');

    archive.on('error', err => {
      console.error('Archive error:', err);
      res.status(500).end();
    });

    archive.pipe(res);

    for (const resp of responses) {
      if (resp.path && fs.existsSync(resp.path)) {
        // ensure filename inside zip preserves originalName or filename
        const entryName = resp.originalName || resp.filename || path.basename(resp.path);
        archive.file(resp.path, { name: entryName });
      } else {
        console.warn('Skipping missing file in archive:', resp.path);
      }
    }

    await archive.finalize();

  } catch (err) {
    console.error('Error creating zip for subject responses:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Stream a ZIP of all student exam responses for a class (collect across subjects)
const zipExamResponsesForClass = async (req, res) => {
  try {
    const classId = req.params.id;
    if (!mongoose.isValidObjectId(classId)) return res.status(400).json({ success: false, message: 'Invalid class id' });

    const subjects = await Subject.find({ sclassName: classId }).select('files subName');

    const allResponses = [];
    for (const subj of subjects) {
      const responses = (subj.files || []).filter(f => f.forExam === true && String(f.uploadedByRole).toLowerCase() === 'student')
        .map(r => ({ ...r.toObject ? r.toObject() : r, subjectName: subj.subName }));
      allResponses.push(...responses);
    }

    if (allResponses.length === 0) {
      return res.status(404).json({ success: false, message: 'No exam responses found for this class' });
    }

    const archive = archiver('zip', { zlib: { level: 6 } });
    res.attachment(`class_${classId}_responses.zip`);
    res.setHeader('Content-Type', 'application/zip');

    archive.on('error', err => {
      console.error('Archive error:', err);
      res.status(500).end();
    });

    archive.pipe(res);

    for (const resp of allResponses) {
      if (resp.path && fs.existsSync(resp.path)) {
        // prefix with subject name to avoid duplicate names
        const safeSubject = (resp.subjectName || 'subject').replace(/[^a-z0-9._-]/gi, '_');
        const entryName = `${safeSubject}/${resp.originalName || resp.filename || path.basename(resp.path)}`;
        archive.file(resp.path, { name: entryName });
      }
    }

    await archive.finalize();

  } catch (err) {
    console.error('Error creating zip for class responses:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Function to remove a subject from a teacher (admin only)
const removeSubjectFromTeacher = async (req, res) => {
  try {
    const { teacherId, subjectId } = req.params;

    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Check if the subject is in the teacher's teachSubjects array
    const subjectIndex = teacher.teachSubjects.indexOf(subjectId);
    if (subjectIndex === -1) {
      return res.status(400).json({ success: false, message: 'Subject not assigned to this teacher' });
    }

    // Remove the subject from the teacher's teachSubjects array
    teacher.teachSubjects.splice(subjectIndex, 1);
    await teacher.save();

    // Update the subject to remove the teacher reference if this was the direct teacher
    const subject = await Subject.findById(subjectId);
    if (subject && subject.teacher && String(subject.teacher) === String(teacherId)) {
      subject.teacher = undefined;
      await subject.save();
    }

    res.status(200).json({
      success: true,
      message: 'Subject removed from teacher successfully'
    });

  } catch (error) {
    console.error('Error removing subject from teacher:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  subjectCreate,
  teacherCreateSubject,
  addFilesToSubject,
  deleteFileFromSubject,
  downloadFile,
  getSubjectFiles,
  getExamResponses,
  zipExamResponsesForSubject,
  zipExamResponsesForClass,
  freeSubjectList,
  classSubjects,
  getSubjectDetail,
  deleteSubjectsByClass,
  deleteSubjects,
  deleteSubject,
  allSubjects,
  removeSubjectFromTeacher
};