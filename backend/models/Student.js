const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  department: {
    type: String,
    default: 'Not Specified'
  },
  semester: {
    type: Number,
    default: 1
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  rollNumber: {
    type: String,
    required: true
  },
  currentSemester: {
    type: Number,
    default: 1
  },
  major: {
    type: String,
    default: 'Not Specified'
  },
  gpa: {
    type: Number,
    default: 0
  },
  attendance: [
    {
      courseId: {
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
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  excelImportId: {
    type: String,
    sparse: true  // Allows null/undefined values while still maintaining uniqueness
  },
  importedFrom: {
    fileName: String,
    importDate: {
      type: Date,
      default: Date.now
    }
  }
});

// Encrypt password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hashing');
    next();
    return;
  }
  console.log('Hashing password for student:', this.email);
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    
    // Generate a student ID if not provided
    if (!this.studentId) {
      const currentYear = new Date().getFullYear().toString().substr(-2);
      const randomId = Math.floor(10000 + Math.random() * 90000);
      this.studentId = `S${currentYear}${randomId}`;
    }
    
    // Generate a unique roll number before saving
    if (this.isNew) {
      const year = new Date().getFullYear().toString().substr(-2);
      const deptCode = this.department.substring(0, 2).toUpperCase();
      
      // Find the highest existing roll number
      const highestStudent = await this.constructor.findOne(
        { rollNumber: new RegExp('^' + year + deptCode) }, 
        {}, 
        { sort: { rollNumber: -1 } }
      );
      
      let nextNumber = 1;
      if (highestStudent && highestStudent.rollNumber) {
        // Extract the numeric part and increment
        const numericPart = parseInt(highestStudent.rollNumber.substring(4));
        nextNumber = numericPart + 1;
      }
      
      // Create roll number in format YYDCNNN (YY=year, DC=dept code, NNN=sequential number)
      this.rollNumber = `${year}${deptCode}${nextNumber.toString().padStart(3, '0')}`;
    }
    
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Match password
studentSchema.methods.matchPassword = async function(enteredPassword) {
  console.log('Comparing passwords for student');
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Static method to handle bulk imports from Excel
studentSchema.statics.importFromExcel = async function(students, courseId) {
  const operations = students.map(student => ({
    updateOne: {
      filter: { rollNumber: student.rollNumber },
      update: {
        $set: {
          name: student.name,
          department: student.department || 'Not Specified',
          excelImportId: student.id,
          'importedFrom.fileName': student.fileName
        }
      },
      upsert: true // Create if doesn't exist
    }
  }));

  return this.bulkWrite(operations);
};

// Create a compound index for rollNumber to ensure uniqueness but allow for nulls
studentSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Student', studentSchema);