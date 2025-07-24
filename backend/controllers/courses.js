const Course = require('../models/Course');

exports.createCourse = async (req, res) => {
  try {
    const courseData = { ...req.body };
    if (!('assigned' in courseData)) courseData.assigned = false;
    if (!('instructor' in courseData)) delete courseData.instructor;
    const course = await Course.create(courseData);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    let query = {};
    if (req.query.assigned === 'false') query.assigned = false;
    else if (req.query.assigned === 'true') query.assigned = true;
    const courses = await Course.find(query).populate('instructor', 'name email');
    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('students', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to update this course' });
    course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    await course.remove();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.addStudentToCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to modify this course' });
    if (course.students.includes(req.body.studentId))
      return res.status(400).json({ message: 'Student already enrolled in this course' });
    course.students.push(req.body.studentId);
    await course.save();
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getCourseStudents = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const ImportedStudent = require('../models/ImportedStudent');
    const students = await ImportedStudent.find({ courses: courseId }).select('name rollNumber discipline');
    const studentsWithFullName = students.map(student => ({
      _id: student._id,
      name: student.name,
      fullName: student.name,
      rollNumber: student.rollNumber,
      discipline: student.discipline
    }));
    if (students.length === 0 && course.students.length > 0) {
      const User = require('../models/User');
      const Student = require('../models/Student');
      const userIds = course.students;
      const studentRecords = await Student.find({ user: { $in: userIds } }).populate('user', 'name email');
      const userIdToStudent = {};
      studentRecords.forEach(record => {
        if (record.user) userIdToStudent[record.user._id.toString()] = record;
      });
      const unmappedUserIds = userIds.filter(id => !userIdToStudent[id.toString()]);
      const regularUsers = unmappedUserIds.length > 0 
        ? await User.find({ _id: { $in: unmappedUserIds } }).select('name email')
        : [];
      const studentsFromRecords = studentRecords.map(record => ({
        _id: record._id,
        user: record.user?._id || record.user,
        name: record.name || (record.user ? record.user.name : 'Unknown'),
        fullName: record.name || (record.user ? record.user.name : 'Unknown'),
        rollNumber: record.rollNumber || (record.user ? record.user.email.split('@')[0] : 'Unknown'),
        discipline: record.discipline || 'Not Specified'
      }));
      const formattedRegularUsers = regularUsers.map(user => ({
        _id: user._id,
        user: user._id,
        name: user.name,
        fullName: user.name,
        rollNumber: user.email.split('@')[0],
        discipline: 'Not Specified'
      }));
      const combinedStudents = [...studentsFromRecords, ...formattedRegularUsers];
      return res.status(200).json({ success: true, count: combinedStudents.length, data: combinedStudents });
    }
    res.status(200).json({ success: true, count: studentsWithFullName.length, data: studentsWithFullName });
  } catch (error) {
    console.error('Error getting course students:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.deleteAllStudentsFromCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized to modify this course' });
    const ImportedStudent = require('../models/ImportedStudent');
    const students = await ImportedStudent.find({ courses: courseId });
    for (const student of students) {
      student.courses = student.courses.filter(c => c.toString() !== courseId.toString());
      await student.save();
    }
    course.students = [];
    await course.save();
    return res.status(200).json({ success: true, message: `Successfully removed all students from course ${courseId}` });
  } catch (error) {
    console.error('Error deleting students from course:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getAvailableCourses = async (req, res) => {
  try {
    const courses = await Course.find().select('_id courseName courseCode department semester');
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
}; 