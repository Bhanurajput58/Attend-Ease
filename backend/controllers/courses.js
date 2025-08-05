const Course = require('../models/Course');


exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({})
      .populate('instructor', 'name email')
      .populate('students', 'name studentId rollNumber')
      .select('courseName name courseCode code department semester students instructor');
    
    const formattedCourses = courses.map(course => ({
      _id: course._id,
      courseName: course.courseName || course.name || 'Unknown Course',
      name: course.courseName || course.name || 'Unknown Course',
      courseCode: course.courseCode || course.code || 'Unknown Code',
      code: course.courseCode || course.code || 'Unknown Code',
      department: course.department,
      semester: course.semester,
      students: course.students || [],
      instructor: course.instructor
    }));
    
    res.status(200).json({
      success: true,
      count: formattedCourses.length,
      data: formattedCourses
    });
  } catch (error) {
    console.error('Error fetching all courses:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

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
    
    // Allow admins to update any course, or instructors to update their own courses
    if (req.user.role !== 'admin' && course.instructor && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }
    
    // If this is an admin assigning a faculty member
    if (req.user.role === 'admin' && req.body.instructor) {
      const CourseApplication = require('../models/CourseApplication');
      
      // Find any application for this faculty and course (pending or rejected)
      const application = await CourseApplication.findOne({ 
        course: req.params.id, 
        faculty: req.body.instructor
      });
      
      if (application) {
        // Update the application status to approved
        application.status = 'approved';
        await application.save();
        
        // Reject all other applications for this course
        await CourseApplication.updateMany(
          { 
            course: req.params.id, 
            _id: { $ne: application._id } 
          },
          { $set: { status: 'rejected' } }
        );
      } else {
        // If no application exists, create one with approved status
        const facultyUser = await require('../models/User').findById(req.body.instructor);
        const courseObj = await Course.findById(req.params.id);
        await CourseApplication.create({
          course: req.params.id,
          faculty: req.body.instructor,
          facultyName: facultyUser?.name || '',
          facultyEmail: facultyUser?.email || '',
          facultyDepartment: facultyUser?.department || '',
          courseName: courseObj?.courseName || courseObj?.name || '',
          status: 'approved'
        });
      }
      
      // Set the course as assigned
      req.body.assigned = true;
    }
    
    // If this is an admin unassigning a faculty member (setting instructor to null)
    if (req.user.role === 'admin' && req.body.instructor === null) {
      const CourseApplication = require('../models/CourseApplication');
      
      // Reject all applications for this course
      await CourseApplication.updateMany(
        { course: req.params.id },
        { $set: { status: 'rejected' } }
      );
      
      // Set the course as unassigned and clear both instructor and faculty fields
      req.body.assigned = false;
      req.body.faculty = null; // Also clear the faculty field to ensure consistency
    }
    
    course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: course });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    await Course.findByIdAndDelete(req.params.id);
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
    const facultyId = req.user.id;
    
    // Get courses that are NOT assigned to the current faculty
    // This should exclude courses where instructor = current faculty ID
    const courses = await Course.find({
      $and: [
        // Course must not be assigned to the current faculty
        { instructor: { $ne: facultyId } },
        // Course must either be unassigned or assigned to someone else
        {
          $or: [
            // Courses that are not assigned to anyone
            { assigned: false },
            { assigned: { $exists: false } },
            // Courses where instructor is null or doesn't exist
            { instructor: null },
            { instructor: { $exists: false } }
          ]
        }
      ]
    }).select('_id courseName courseCode department semester');
    
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
}; 