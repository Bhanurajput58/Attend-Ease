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
  email: {
    type: String,
    default: null,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  discipline: {
    type: String,
    default: 'Not Specified'
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
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

// Post-save middleware to update courses collection
importedStudentSchema.post('save', async function(doc) {
  try {
    const Course = mongoose.model('Course');
    if (doc.courses && doc.courses.length > 0) {
      for (const courseId of doc.courses) {
        await Course.findByIdAndUpdate(
          courseId,
          { $addToSet: { students: doc._id } },
          { new: true }
        );
        console.log(`Added student ${doc._id} to course ${courseId}`);
      }
    }
  } catch (error) {
    console.error('Error updating courses after student save:', error);
  }
});

// Static method to handle bulk imports from Excel
importedStudentSchema.statics.importFromExcel = async function(students, courseId, userId, fileName) {
  const Course = mongoose.model('Course');
  
  const operations = students.map(student => ({
    updateOne: {
      filter: { rollNumber: student.rollNumber },
      update: {
        $set: {
          name: student.name,
          discipline: student.discipline || 'Not Specified',
          'importedFrom.fileName': fileName,
          'importedFrom.importDate': new Date(),
          'importedFrom.importedBy': userId
        },
        $addToSet: {
          courses: courseId
        }
      },
      upsert: true
    }
  }));

  const result = await this.bulkWrite(operations);
  
  if (courseId && result.upsertedCount > 0) {
    try {
      const courseStudents = await this.find({ courses: courseId }, { _id: 1 });
      const studentIds = courseStudents.map(student => student._id);
      
      await Course.findByIdAndUpdate(
        courseId,
        { $addToSet: { students: { $each: studentIds } } },
        { new: true }
      );
      
      console.log(`Updated course ${courseId} with ${studentIds.length} students after import`);
    } catch (error) {
      console.error('Error updating course after bulk import:', error);
    }
  }
  
  return result;
};

// Update attendance stats for a student
importedStudentSchema.statics.updateAttendanceStats = async function(studentId, courseId, status) {
  const student = await this.findById(studentId);
  if (!student) return null;

  if (!student.courses.includes(courseId)) {
    student.courses.push(courseId);
    console.log(`Added course ${courseId} to student ${studentId}'s courses`);
  }

  let stats = student.attendanceStats.find(stat => 
    stat.course && stat.course.toString() === courseId.toString()
  );
  
  if (!stats) {
    stats = {
      course: courseId,
      present: 0,
      absent: 0,
      total: 0,
      percentage: 0
    };
    student.attendanceStats.push(stats);
    console.log(`Created new attendance stats entry for student ${studentId} and course ${courseId}`);
  }

  if (status === 'present') {
    stats.present += 1;
    console.log(`Incremented present count for student ${studentId}, course ${courseId}`);
  } else {
    stats.absent += 1;
    console.log(`Incremented absent count for student ${studentId}, course ${courseId}`);
  }
  
  stats.total = stats.present + stats.absent;
  stats.percentage = (stats.present / stats.total) * 100;
  
  console.log(`Updated attendance stats for student ${studentId}: present=${stats.present}, absent=${stats.absent}, total=${stats.total}, percentage=${stats.percentage}`);

  return student.save();
};

// Create indices for better query performance
importedStudentSchema.index({ rollNumber: 1 }, { unique: true });
importedStudentSchema.index({ 'courses': 1 });

module.exports = mongoose.model('ImportedStudent', importedStudentSchema); 