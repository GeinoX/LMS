const multer = require('multer');
const path = require('path');
const File = require('../models/uploadSchema.js'); // your upload schema
const sharp = require('sharp'); // for image compression

// Configure Multer storage (memory storage for processing)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // limit 20MB
}).single('file'); // single file upload, name must match frontend

// Upload controller
const adminuploadFile = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).send(err.message);

        try {
            if (!req.file) return res.status(400).send('No file uploaded');

            const filename = Date.now() + '-' + req.file.originalname;
            const filepath = path.join(__dirname, '../adminuploads', filename);

            if (req.file.mimetype.startsWith('image/')) {
                await sharp(req.file.buffer)
                    .resize({ width: 1080 }) 
                    .jpeg({ quality: 80 }) 
                    .toFile(filepath);
            } else {
               
                const fs = require('fs');
                fs.writeFileSync(filepath, req.file.buffer);
            }

           
            const newFile = new File({
                filename,
                uploader: req.body.uploader, 
                school: req.body.school,     
            });
            await newFile.save();

            res.status(200).send({ message: 'File uploaded successfully', filename });
        } catch (error) {
            console.error(error);
            res.status(500).send('Server error');
        }
    });
};

module.exports = { adminuploadFile };
