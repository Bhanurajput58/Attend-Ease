const Course = require('../models/Course');

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Admin,Faculty
exports.createCourse = async (req, res) => {
  try {
    // Set instructor to logged in user if not specified
    if (!req.body.instructor) {
      req.body.instructor = req.user.id;
    }
    
    const course = await Course.create(req.body);
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    // Different query based on user role
    let query;
    
    // If admin, get all courses
    if (req.user.role === 'admin') {
      query = Course.find();
    } 
    // If faculty, get their own courses
    else if (req.user.role === 'faculty') {
      query = Course.find({ instructor: req.user.id });
    } 
    // If student, get courses they're enrolled in
    else {
      query = Course.find({ students: req.user.id });
    }
    
    // Execute query with populated instructor
    const courses = await query.populate('instructor', 'name email');
    
    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('students', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin,Owner
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Ensure user is course owner or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }
    
    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin,Owner
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Ensure user is course owner or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }
    
    await course.remove();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add student to course
// @route   POST /api/courses/:id/students
// @access  Private/Admin,Owner
exports.addStudentToCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if authorized
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this course' });
    }
    
    // Add student to course if not already enrolled
    if (course.students.includes(req.body.studentId)) {
      return res.status(400).json({ message: 'Student already enrolled in this course' });
    }
    
    course.students.push(req.body.studentId);
    await course.save();
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all students for a course
// @route   GET /api/courses/:id/students
// @access  Private
exports.getCourseStudents = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Find all imported students for this course
    const ImportedStudent = require('../models/ImportedStudent');
    const students = await ImportedStudent.find({ 
      courses: courseId 
    }).select('name rollNumber discipline');
    
    // If no imported students, try to get regular students
    if (students.length === 0 && course.students.length > 0) {
      // This course has students but they're not in the ImportedStudent collection
      const User = require('../models/User');
      const regularStudents = await User.find({
        _id: { $in: course.students }
      }).select('name email');
      
      // Convert regular students to the expected format
      const formattedStudents = regularStudents.map(student => ({
        _id: student._id,
        name: student.name,
        rollNumber: student.email.split('@')[0],
        discipline: 'Not Specified'
      }));
      
      return res.status(200).json({
        success: true,
        count: formattedStudents.length,
        data: formattedStudents
      });
    }
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error getting course students:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete all students from a course
// @route   DELETE /api/courses/:id/students
// @access  Private/Admin,Owner
exports.deleteAllStudentsFromCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check authorization
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this course'
      });
    }
    
    // Get the ImportedStudent model
    const ImportedStudent = require('../models/ImportedStudent');
    
    // Find all students in this course
    const students = await ImportedStudent.find({ courses: courseId });
    console.log(`Found ${students.length} students to remove from course ${courseId}`);
    
    // Remove this course from each student's courses array
    for (const student of students) {
      student.courses = student.courses.filter(c => c.toString() !== courseId.toString());
      await student.save();
      console.log(`Removed course ${courseId} from student ${student._id}`);
    }
    
    // Also clear the students array in the course
    course.students = [];
    await course.save();
    console.log(`Cleared students array in course ${courseId}`);
    
    return res.status(200).json({
      success: true,
      message: `Successfully removed all students from course ${courseId}`
    });
  } catch (error) {
    console.error('Error deleting students from course:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}; 