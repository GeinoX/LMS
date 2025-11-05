const bcrypt = require('bcrypt');
const Teacher = require('../models/teacherSchema.js');
const Subject = require('../models/subjectSchema.js');

const teacherRegister = async (req, res) => {
    // Accept either `school` or `adminID` from the client
    // Accept either `teachSubjects` (array) or `teachSubject` (single id) for compatibility
    const { name, email, password, role, school, adminID, teachSubject, teachSubjects, teachSclass } = req.body;
    const schoolId = school || adminID || null;
    // Normalize teachSubjects into an array
    const normalizedTeachSubjects = Array.isArray(teachSubjects)
        ? teachSubjects
        : (teachSubject ? [teachSubject] : []);
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

    const teacher = new Teacher({ name, email, password: hashedPass, role, school: schoolId, teachSubjects: normalizedTeachSubjects, teachSclass });

        const existingTeacherByEmail = await Teacher.findOne({ email });

        if (existingTeacherByEmail) {
            return res.status(400).send({ message: 'Email already exists' });
        }

        let result = await teacher.save();

        // If teachSubjects provided, set the teacher field on those subjects
        if (normalizedTeachSubjects && normalizedTeachSubjects.length > 0) {
            try {
                await Subject.updateMany(
                    { _id: { $in: normalizedTeachSubjects } },
                    { teacher: teacher._id }
                );
            } catch (updateErr) {
                console.error('Failed to set teacher on provided subjects:', updateErr);
            }
        }

        result = result.toObject();
        result.password = undefined;
        res.status(201).send(result);
    } catch (err) {
        res.status(500).json(err);
    }
};

const teacherLogIn = async (req, res) => {
    try {
        let teacher = await Teacher.findOne({ email: req.body.email });
        if (teacher) {
            const validated = await bcrypt.compare(req.body.password, teacher.password);
            if (validated) {
                // populate the subjects array and expose virtual teachSubject for compat
                teacher = await teacher.populate("teachSubjects", "subName sessions")
                teacher = await teacher.populate("school", "schoolName")
                teacher = await teacher.populate("teachSclass", "sclassName")
                teacher.password = undefined;
                res.send(teacher);
            } else {
                res.send({ message: "Invalid password" });
            }
        } else {
            res.send({ message: "Teacher not found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getTeachers = async (req, res) => {
    try {
        let teachers = await Teacher.find({ school: req.params.id })
            .populate("teachSubjects", "subName")
            .populate("teachSclass", "sclassName");
        if (teachers.length > 0) {
            let modifiedTeachers = teachers.map((teacher) => {
                return { ...teacher._doc, password: undefined };
            });
            res.send(modifiedTeachers);
        } else {
            res.send({ message: "No teachers found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getTeacherDetail = async (req, res) => {
    try {
        let teacher = await Teacher.findById(req.params.id)
            .populate("teachSubjects", "subName sessions")
            .populate("school", "schoolName")
            .populate("teachSclass", "sclassName")
        if (teacher) {
            teacher.password = undefined;
            res.send(teacher);
        }
        else {
            res.send({ message: "No teacher found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

const updateTeacherSubject = async (req, res) => {
    // Accept either a single teachSubject id or an array teachSubjects
    const { teacherId, teachSubject, teachSubjects } = req.body;
    try {
        const newSubjects = Array.isArray(teachSubjects) ? teachSubjects : (teachSubject ? [teachSubject] : []);

        // Update teacher document
        const updatedTeacher = await Teacher.findByIdAndUpdate(
            teacherId,
            { teachSubjects: newSubjects },
            { new: true }
        ).populate('teachSubjects', 'subName');

        // Remove teacher reference from any subjects that previously pointed to this teacher
        await Subject.updateMany({ teacher: teacherId }, { $unset: { teacher: "" } });

        // Set teacher reference on the newly assigned subjects
        if (newSubjects && newSubjects.length > 0) {
            await Subject.updateMany({ _id: { $in: newSubjects } }, { teacher: teacherId });
        }

        res.send(updatedTeacher);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);
        if (!deletedTeacher) {
            return res.status(404).send({ message: 'Teacher not found' });
        }

        // Unset the teacher reference on any subjects that referenced this teacher
        await Subject.updateMany(
            { teacher: deletedTeacher._id },
            { $unset: { teacher: "" } }
        );

        res.send(deletedTeacher);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteTeachers = async (req, res) => {
    try {
        // Find teachers first so we can remove references
        const teachers = await Teacher.find({ school: req.params.id });
        if (!teachers || teachers.length === 0) {
            return res.send({ message: "No teachers found to delete" });
        }

        const teacherIds = teachers.map(t => t._id);

        const deletionResult = await Teacher.deleteMany({ school: req.params.id });

        // Unset teacher reference from subjects that pointed to these teachers
        await Subject.updateMany(
            { teacher: { $in: teacherIds } },
            { $unset: { teacher: "" } }
        );

        res.send(deletionResult);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteTeachersByClass = async (req, res) => {
    try {
        // Teachers store their class in teachSclass
        const teachers = await Teacher.find({ teachSclass: req.params.id });
        if (!teachers || teachers.length === 0) {
            return res.send({ message: "No teachers found to delete" });
        }

        const teacherIds = teachers.map(t => t._id);

        const deletionResult = await Teacher.deleteMany({ teachSclass: req.params.id });

        // Unset teacher reference in subjects
        await Subject.updateMany(
            { teacher: { $in: teacherIds } },
            { $unset: { teacher: "" } }
        );

        res.send(deletionResult);
    } catch (error) {
        res.status(500).json(error);
    }
};

const teacherAttendance = async (req, res) => {
    const { status, date } = req.body;

    try {
        const teacher = await Teacher.findById(req.params.id);

        if (!teacher) {
            return res.send({ message: 'Teacher not found' });
        }

        const existingAttendance = teacher.attendance.find(
            (a) =>
                a.date.toDateString() === new Date(date).toDateString()
        );

        if (existingAttendance) {
            existingAttendance.status = status;
        } else {
            teacher.attendance.push({ date, status });
        }

        const result = await teacher.save();
        return res.send(result);
    } catch (error) {
        res.status(500).json(error)
    }
};

module.exports = {
    teacherRegister,
    teacherLogIn,
    getTeachers,
    getTeacherDetail,
    updateTeacherSubject,
    deleteTeacher,
    deleteTeachers,
    deleteTeachersByClass,
    teacherAttendance
};