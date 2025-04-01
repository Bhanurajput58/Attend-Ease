const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Please add a course code'],
    unique: true,
    trim: true
  },
  courseName: {
    type: String,
    required: [true, 'Please add a course name'],
    trim: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  semester: {
    type: String,
    required: [true, 'Please add a semester'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please add a department'],
    trim: true
  },
  enrollmentHistory: [{
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    importDetails: {
      fileName: String,
      importDate: Date,
      count: Number
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to set instructor from faculty if not provided
courseSchema.pre('save', function(next) {
  if (!this.instructor && this.faculty) {
    this.instructor = this.faculty;
  }
  next();
});

// Static method to handle bulk student enrollments from Excel
courseSchema.statics.enrollStudentsFromExcel = async function(courseId, studentIds, fileName) {
  const course = await this.findById(courseId);
  
  if (!course) {
    throw new Error('Course not found');
  }
  
  // Add students to the course
  const uniqueStudents = [...new Set(studentIds)];
  
  // Update students array with new students
  await this.findByIdAndUpdate(courseId, {
    $addToSet: { students: { $each: uniqueStudents } },
    $push: {
      enrollmentHistory: {
        students: uniqueStudents,
        importDetails: {
          fileName: fileName || 'Manual Import',
          importDate: new Date(),
          count: uniqueStudents.length
        }
      }
    }
  });
  
  return { count: uniqueStudents.length };
};

module.exports = mongoose.model('Course', courseSchema);