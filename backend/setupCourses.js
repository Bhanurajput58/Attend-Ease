const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pr_attendance_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('DB Connection Error:', err);
  process.exit(1);
});

async function setupCourses() {
  try {
    // Import Course model
    const Course = require('./models/Course');
    const User = require('./models/User');

    // Find a faculty user to associate with courses
    let facultyUser = await User.findOne({ role: 'faculty' });
    
    if (!facultyUser) {
      console.log('Creating a default faculty user...');
      
      // Create a default faculty user if none exists
      const defaultFaculty = new User({
        name: 'Dr. Faculty Demo',
        email: 'faculty@demo.com',
        password: 'password123', // This will be hashed by the pre-save hook
        role: 'faculty',
        username: 'facultydemo'
      });
      
      await defaultFaculty.save();
      console.log('Default faculty user created with ID:', defaultFaculty._id);
      
      // Use this new user as the faculty
      facultyUser = defaultFaculty;
    }

    // Demo course data
    const demoCourses = [
      { id: "65f12abd0f70dab6a2876304", name: "Operating systems", code: "CS2006", semester: "4", department: "CSE" },
      { id: "65f12abd0f70dab6a2876305", name: "Design & Analysis of Algorithms", code: "CS2007", semester: "4", department: "CSE" },
      { id: "65f12abd0f70dab6a2876306", name: "Computer Network", code: "CS2008", semester: "4", department: "CSE" },
      { id: "65f12abd0f70dab6a2876307", name: "IoT and Embedded systems", code: "CS2009", semester: "4", department: "CSE" }
    ];

    // Delete existing courses first
    await Course.deleteMany({ _id: { $in: demoCourses.map(c => c.id) } });
    console.log('Deleted any existing courses with the same IDs');

    // Create each course
    for (const course of demoCourses) {
      const newCourse = new Course({
        _id: course.id,
        courseCode: course.code,
        courseName: course.name,
        instructor: facultyUser._id,
        faculty: facultyUser._id,
        semester: course.semester,
        department: course.department,
        students: []
      });
      
      await newCourse.save();
      console.log(`Created course: ${course.name} with ID: ${course.id}`);
    }

    console.log('All courses created successfully!');
    
    // Verify courses were created
    const count = await Course.countDocuments();
    console.log(`Total courses in database: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up courses:', error);
    process.exit(1);
  }
}

setupCourses(); 