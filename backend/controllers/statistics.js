const User = require('../models/User');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Attendance = require('../models/Attendance');

// Get homepage statistics
exports.getHomepageStats = async (req, res) => {
  try {
    // Get counts from different collections
    const [
      totalUsers,
      totalCourses,
      totalStudents,
      totalFaculty,
      totalAttendanceRecords
    ] = await Promise.all([
      User.countDocuments(), // Count all users, not just approved ones
      Course.countDocuments(),
      Student.countDocuments(),
      Faculty.countDocuments(), // Count all faculty members, not just approved ones
      Attendance.countDocuments()
    ]);

    // Calculate active users (all users from users collection)
    const activeUsers = totalUsers;

    const stats = {
      activeUsers,
      courses: totalCourses,
      facultyMembers: totalFaculty,
      students: totalStudents,
      totalAttendanceRecords
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching homepage statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
}; 