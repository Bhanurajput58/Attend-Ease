const ImportedStudent = require('../models/ImportedStudent');
const Course = require('../models/Course');

// @desc    Import students from Excel
// @route   POST /api/students/import
// @access  Private/Faculty,Admin
exports.importStudents = async (req, res) => {
  try {
    const { courseId, students, fileName } = req.body;
    
    if (!courseId || !students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid input. Please provide courseId and an array of students.' 
      });
    }
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }
    
    // Import students using the static method
    const result = await ImportedStudent.importFromExcel(
      students,
      courseId,
      req.user.id,
      fileName || 'Manual Import'
    );
    
    // Return success with count of updates
    res.status(200).json({
      success: true,
      message: 'Students imported successfully',
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
        upsertedIds: result.upsertedIds
      }
    });
  } catch (error) {
    console.error('Error importing students:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Get students for a course
// @route   GET /api/students/course/:courseId
// @access  Private/Faculty,Admin
exports.getStudentsByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }
    
    // Get students enrolled in this course
    const students = await ImportedStudent.find({ courses: courseId })
      .select('name rollNumber discipline attendanceStats');
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Get student by ID or roll number
// @route   GET /api/students/:identifier
// @access  Private
exports.getStudent = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    
    // Check if identifier is a MongoDB ID or roll number
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    
    let student;
    if (isObjectId) {
      student = await ImportedStudent.findById(identifier);
    } else {
      student = await ImportedStudent.findOne({ rollNumber: identifier });
    }
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
}; 