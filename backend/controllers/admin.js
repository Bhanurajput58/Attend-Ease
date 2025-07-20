exports.convertStudentsToUsers = async (req, res) => {
  try {
    const ImportedStudent = require('../models/ImportedStudent');
    const User = require('../models/User');
    const Student = require('../models/Student');
    const importedStudents = await ImportedStudent.find();
    if (!importedStudents.length) {
      return res.status(404).json({ success: false, message: 'No imported students found' });
    }
    const stats = { total: importedStudents.length, created: 0, skipped: 0, errors: 0, errorDetails: [] };
    for (const importedStudent of importedStudents) {
      try {
        if (!importedStudent.rollNumber) { stats.skipped++; continue; }
        const email = `${importedStudent.rollNumber.replace(/[^a-zA-Z0-9]/g, '')}@example.com`;
        if (await User.findOne({ email })) { stats.skipped++; continue; }
        let username = importedStudent.rollNumber.replace(/[^a-zA-Z0-9]/g, '');
        if (username.length < 3) username = username.padEnd(3, '0');
        if (await User.findOne({ username })) username += Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const defaultPassword = 'password123';
        try {
          const newUser = new User({ name: importedStudent.name || 'Student', email, password: defaultPassword, role: 'student', username });
          const savedUser = await newUser.save();
          try {
            const studentProfile = new Student({ user: savedUser._id, name: importedStudent.name || 'Student', email, department: importedStudent.department || 'Not Specified', semester: importedStudent.semester || 1, rollNumber: importedStudent.rollNumber, courses: importedStudent.courses || [] });
            await studentProfile.save();
            if (importedStudent.courses && importedStudent.courses.length > 0) {
              try {
                const Course = require('../models/Course');
                for (const courseId of importedStudent.courses) {
                  await Course.findByIdAndUpdate(courseId, { $addToSet: { students: savedUser._id } });
                }
              } catch (courseError) {}
            }
            stats.created++;
          } catch (studentError) {
            stats.errors++;
            stats.errorDetails.push({ rollNumber: importedStudent.rollNumber, name: importedStudent.name, stage: 'student_profile_creation', error: studentError.message });
            try { await User.findByIdAndDelete(savedUser._id); } catch {}
          }
        } catch (userError) {
          stats.errors++;
          stats.errorDetails.push({ rollNumber: importedStudent.rollNumber, name: importedStudent.name, stage: 'user_creation', error: userError.message });
        }
      } catch (err) {
        stats.errors++;
        stats.errorDetails.push({ rollNumber: importedStudent?.rollNumber, name: importedStudent?.name, stage: 'initial_processing', error: err.message });
      }
    }
    return res.status(200).json({ success: true, message: 'Student conversion completed', data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const User = require('../models/User');
    const Student = require('../models/Student');
    const Faculty = require('../models/Faculty');
    const users = await User.find().select('name email role username createdAt');
    const students = await Student.find().select('user rollNumber');
    const faculties = await Faculty.find().select('-password');
    const userToRollNumber = {};
    students.forEach(student => { if (student.user && student.rollNumber) userToRollNumber[student.user.toString()] = student.rollNumber; });
    const userToFaculty = {};
    faculties.forEach(faculty => { if (faculty.user) userToFaculty[faculty.user.toString()] = faculty.toObject(); });
    const enrichedUsers = users.map(user => {
      const userData = user.toObject();
      if (user.role === 'student' && userToRollNumber[user._id.toString()]) userData.rollNumber = userToRollNumber[user._id.toString()];
      if (user.role === 'faculty' && userToFaculty[user._id.toString()]) Object.assign(userData, userToFaculty[user._id.toString()]);
      return userData;
    });
    res.status(200).json({ success: true, count: enrichedUsers.length, data: enrichedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getAdminById = async (req, res) => {
  try {
    const User = require('../models/User');
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
}; 