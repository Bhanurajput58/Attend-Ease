// @desc    Convert imported students to user accounts
// @route   POST /api/admin/convert-students-to-users
// @access  Private/Admin
exports.convertStudentsToUsers = async (req, res) => {
  try {
    const ImportedStudent = require('../models/ImportedStudent');
    const User = require('../models/User');
    const Student = require('../models/Student');
    
    // Get all imported students
    const importedStudents = await ImportedStudent.find();
    
    if (!importedStudents.length) {
      return res.status(404).json({
        success: false,
        message: 'No imported students found'
      });
    }
    
    console.log(`Found ${importedStudents.length} imported students to convert`);
    
    // Stats to track the process
    const stats = {
      total: importedStudents.length,
      created: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [] // Track specific errors
    };
    
    // Process each student
    for (const importedStudent of importedStudents) {
      try {
        // Check if the roll number is valid before proceeding
        if (!importedStudent.rollNumber) {
          console.log(`Missing roll number for student ${importedStudent.name}, skipping`);
          stats.skipped++;
          continue;
        }
        
        // Create a valid email format that will pass validation
        const email = `${importedStudent.rollNumber.replace(/[^a-zA-Z0-9]/g, '')}@example.com`;
        
        // Check if user already exists with this email
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          console.log(`User already exists for ${importedStudent.name} (${importedStudent.rollNumber}), skipping`);
          stats.skipped++;
          continue;
        }
        
        // Create a sanitized username from the roll number (ensure no special characters)
        let username = importedStudent.rollNumber.replace(/[^a-zA-Z0-9]/g, '');
        
        // Ensure username is at least 3 characters
        if (username.length < 3) {
          // Pad username to reach minimum length
          username = username.padEnd(3, '0');
        }
        
        // Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
          console.log(`Username ${username} already exists, adding random suffix`);
          // Add a random suffix to the username to make it unique
          const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          username = `${username}${randomSuffix}`;
        }
        
        // Create a default password (you might want to make this more secure or random)
        const defaultPassword = 'password123';
        
        try {
          // Create the user
          const newUser = new User({
            name: importedStudent.name || 'Student',
            email,
            password: defaultPassword,
            role: 'student',
            username
          });
          
          console.log(`Attempting to save new user: ${username}`);
          const savedUser = await newUser.save();
          console.log(`User saved successfully: ${savedUser._id}`);
          
          try {
            // Create the student profile linked to the user
            const studentProfile = new Student({
              user: savedUser._id,
              name: importedStudent.name || 'Student',
              email,
              department: importedStudent.department || 'Not Specified',
              semester: importedStudent.semester || 1,
              rollNumber: importedStudent.rollNumber,
              // Copy any courses from the imported student
              courses: importedStudent.courses || []
            });
            
            console.log(`Attempting to save student profile for: ${importedStudent.rollNumber}`);
            await studentProfile.save();
            console.log(`Student profile saved successfully`);
            
            // Update any course references to point to the new user ID
            if (importedStudent.courses && importedStudent.courses.length > 0) {
              try {
                const Course = require('../models/Course');
                for (const courseId of importedStudent.courses) {
                  await Course.findByIdAndUpdate(courseId, {
                    $addToSet: { students: savedUser._id }
                  });
                }
              } catch (courseError) {
                console.error(`Error updating courses for ${importedStudent.rollNumber}:`, courseError);
                // Don't fail the entire process for course update errors
              }
            }
            
            console.log(`Created user for ${importedStudent.name} (${importedStudent.rollNumber})`);
            stats.created++;
          } catch (studentError) {
            console.error(`Error creating student profile for ${importedStudent.rollNumber}:`, studentError);
            stats.errors++;
            stats.errorDetails.push({
              rollNumber: importedStudent.rollNumber,
              name: importedStudent.name,
              stage: 'student_profile_creation',
              error: studentError.message
            });
            
            // Cleanup the user since student profile failed
            try {
              await User.findByIdAndDelete(savedUser._id);
              console.log(`Cleaned up user ${savedUser._id} due to student profile creation failure`);
            } catch (cleanupError) {
              console.error('Error cleaning up user:', cleanupError);
            }
          }
        } catch (userError) {
          console.error(`Error creating user for ${importedStudent.rollNumber}:`, userError);
          stats.errors++;
          stats.errorDetails.push({
            rollNumber: importedStudent.rollNumber,
            name: importedStudent.name,
            stage: 'user_creation',
            error: userError.message
          });
        }
      } catch (err) {
        console.error(`Error processing student ${importedStudent?.name || 'unknown'} (${importedStudent?.rollNumber || 'unknown'}):`, err);
        stats.errors++;
        stats.errorDetails.push({
          rollNumber: importedStudent?.rollNumber,
          name: importedStudent?.name,
          stage: 'initial_processing',
          error: err.message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Student conversion completed',
      data: stats
    });
  } catch (error) {
    console.error('Error converting students to users:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const User = require('../models/User');
    const Student = require('../models/Student');
    
    console.log('Fetching all users for admin panel');
    
    // Get all users with role information
    const users = await User.find().select('name email role username createdAt');
    
    // Get student profiles to map roll numbers
    const students = await Student.find().select('user rollNumber');
    
    // Create a map of user ID to roll number
    const userToRollNumber = {};
    students.forEach(student => {
      if (student.user && student.rollNumber) {
        userToRollNumber[student.user.toString()] = student.rollNumber;
      }
    });
    
    // Attach roll numbers to student users
    const enrichedUsers = users.map(user => {
      const userData = user.toObject();
      
      // Add roll number if this is a student and we have the roll number
      if (user.role === 'student' && userToRollNumber[user._id.toString()]) {
        userData.rollNumber = userToRollNumber[user._id.toString()];
      }
      
      return userData;
    });
    
    console.log(`Found ${enrichedUsers.length} users`);
    
    res.status(200).json({
      success: true,
      count: enrichedUsers.length,
      data: enrichedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.getAdminById = async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
}; 