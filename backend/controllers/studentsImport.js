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

// @desc    Get student's timetable
// @route   GET /api/students/:studentId/timetable
// @access  Private
exports.getStudentTimetable = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Find the student's enrolled courses
    const student = await ImportedStudent.findById(studentId)
      .populate({
        path: 'courses',
        select: 'courseName courseCode schedule faculty',
        populate: {
          path: 'faculty',
          select: 'name'
        }
      });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Transform courses into day-wise timetable
    const timetable = [
      { day: 'Monday', courses: [] },
      { day: 'Tuesday', courses: [] },
      { day: 'Wednesday', courses: [] },
      { day: 'Thursday', courses: [] },
      { day: 'Friday', courses: [] }
    ];

    // Map courses to their respective days
    student.courses.forEach(course => {
      const courseInfo = {
        id: course._id,
        name: course.courseName,
        code: course.courseCode,
        faculty: course.faculty?.name || 'TBD',
        time: course.schedule?.time || '09:00 AM - 10:30 AM',
        room: course.schedule?.room || 'TBD'
      };

      if (course.schedule?.days && Array.isArray(course.schedule.days)) {
        course.schedule.days.forEach(day => {
          const dayEntry = timetable.find(d => d.day === day);
          if (dayEntry) {
            dayEntry.courses.push(courseInfo);
          }
        });
      } else {
        // If no schedule is specified, add to Monday by default
        timetable[0].courses.push(courseInfo);
      }
    });

    // Sort courses within each day by time
    timetable.forEach(day => {
      day.courses.sort((a, b) => {
        const timeA = a.time.split(' - ')[0];
        const timeB = b.time.split(' - ')[0];
        return timeA.localeCompare(timeB);
      });
    });

    res.status(200).json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Error getting student timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};