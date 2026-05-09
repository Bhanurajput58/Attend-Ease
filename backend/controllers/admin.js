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

// Get all admins (for notifications)
exports.getAllAdmins = async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admins = await Admin.find({})
      .populate('user', 'name email username')
      .select('fullName name email department designation user');
    
    const formattedAdmins = admins.map(a => ({
      _id: a._id,
      fullName: a.fullName || a.name || 'Unknown Name',
      name: a.fullName || a.name || 'Unknown Name',
      email: a.email,
      department: a.department,
      designation: a.designation,
      user: a.user?._id
    }));
    
    res.status(200).json({
      success: true,
      count: formattedAdmins.length,
      data: formattedAdmins
    });
  } catch (error) {
    console.error('Error fetching all admins:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
}; 