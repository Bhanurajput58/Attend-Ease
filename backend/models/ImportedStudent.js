const mongoose = require('mongoose');

const importedStudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required']
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true
  },
  importId: {
    type: String,
    sparse: true  // Allows null values while keeping uniqueness
  },
  discipline: {
    type: String,
    default: 'Not Specified'
  },
  department: {
    type: String,
    default: 'Not Specified'
  },
  semester: {
    type: Number,
    default: 1
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  // Import metadata
  importedFrom: {
    fileName: String,
    importDate: {
      type: Date,
      default: Date.now
    },
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  attendanceStats: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    present: {
      type: Number,
      default: 0
    },
    absent: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Static method to handle bulk imports from Excel
importedStudentSchema.statics.importFromExcel = async function(students, courseId, userId, fileName) {
  const operations = students.map(student => ({
    updateOne: {
      filter: { rollNumber: student.rollNumber },
      update: {
        $set: {
          name: student.name,
          discipline: student.discipline || 'Not Specified',
          department: student.department || 'Not Specified',
          importId: student.id?.toString(),
          'importedFrom.fileName': fileName,
          'importedFrom.importDate': new Date(),
          'importedFrom.importedBy': userId
        },
        $addToSet: {
          courses: courseId
        }
      },
      upsert: true // Create if doesn't exist
    }
  }));

  return this.bulkWrite(operations);
};

// Update attendance stats for a student
importedStudentSchema.statics.updateAttendanceStats = async function(studentId, courseId, status) {
  const student = await this.findById(studentId);
  if (!student) return null;

  // Find or create stats for this course
  let stats = student.attendanceStats.find(stat => stat.course.toString() === courseId.toString());
  
  if (!stats) {
    stats = {
      course: courseId,
      present: 0,
      absent: 0,
      total: 0,
      percentage: 0
    };
    student.attendanceStats.push(stats);
  }

  // Update stats based on status
  if (status === 'present') {
    stats.present += 1;
  } else {
    stats.absent += 1;
  }
  
  stats.total += 1;
  stats.percentage = (stats.present / stats.total) * 100;

  return student.save();
};

// Static method to find a student by roll number or create if doesn't exist
importedStudentSchema.statics.findOrCreateByRollNumber = async function(rollNumber, name, discipline, courseId) {
  // Try to find by roll number first
  let student = await this.findOne({ rollNumber: rollNumber });
  
  // If student exists, update their info if needed
  if (student) {
    let updated = false;
    
    // Only update name if current is placeholder and new is better
    if (name && name !== 'Unknown' && name !== 'Student' && 
        (student.name === 'Student' || student.name === 'Unknown')) {
      student.name = name;
      updated = true;
    }
    
    // Only update discipline if current is default and new is better
    if (discipline && discipline !== 'Not Specified' && 
        student.discipline === 'Not Specified') {
      student.discipline = discipline;
      updated = true;
    }
    
    // Ensure student is associated with this course
    if (courseId && !student.courses.includes(courseId)) {
      student.courses.push(courseId);
      updated = true;
    }
    
    if (updated) {
      await student.save();
      console.log(`Updated existing student: ${student._id}`);
    }
    
    return student;
  }
  
  // Create new student if not found
  const newStudent = await this.create({
    name: name || 'Unknown',
    rollNumber: rollNumber,
    discipline: discipline || 'Not Specified',
    courses: courseId ? [courseId] : []
  });
  
  console.log(`Created new student with roll number ${rollNumber}`);
  return newStudent;
};

// Create indices for better query performance
importedStudentSchema.index({ rollNumber: 1 }, { unique: true });
importedStudentSchema.index({ importId: 1 });
importedStudentSchema.index({ 'courses': 1 });

module.exports = mongoose.model('ImportedStudent', importedStudentSchema); 