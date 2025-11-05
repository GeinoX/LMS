// Migration script: move legacy `teachSubject` field into `teachSubjects` array for Teacher documents
// Usage: node tools/migrateTeachersToArray.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Teacher = require('../models/teacherSchema');

async function migrate() {
  if (!process.env.MONGO_URL) {
    console.error('MONGO_URL is not set in environment. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB for migration');

  try {
    const teachers = await Teacher.find({}).lean();
    console.log(`Found ${teachers.length} teacher documents`);

    let updatedCount = 0;

    for (const t of teachers) {
      const hasArray = Array.isArray(t.teachSubjects) && t.teachSubjects.length > 0;
      const hasLegacy = t.teachSubject !== undefined && t.teachSubject !== null;

      if (!hasArray && hasLegacy) {
        // prepare array from legacy field
        const teachSubjects = Array.isArray(t.teachSubject) ? t.teachSubject : [t.teachSubject];
        const res = await Teacher.updateOne({ _id: t._id }, { $set: { teachSubjects }, $unset: { teachSubject: "" } });
        if (res.modifiedCount && res.modifiedCount > 0) {
          updatedCount++;
          console.log(`Updated teacher ${t._id}: moved teachSubject -> teachSubjects`);
        }
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} teacher(s).`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
